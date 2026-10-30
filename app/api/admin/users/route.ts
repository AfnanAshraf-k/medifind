import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, recordAuditLog, getServiceRoleClient } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const role = searchParams.get("role") || "all";
  const status = searchParams.get("status") || "all"; // 'active', 'suspended', 'all'
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, role, is_suspended, suspended_at, suspension_reason, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  if (role !== "all") {
    query = query.eq("role", role);
  }

  if (status === "active") {
    query = query.eq("is_suspended", false);
  } else if (status === "suspended") {
    query = query.eq("is_suspended", true);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse || !admin) return errorResponse;

  const body = await request.json();
  const { action, userId, reason } = body;

  if (!action || !userId) {
    return NextResponse.json({ error: "Missing required fields: action and userId are required." }, { status: 400 });
  }

  // Prevent admin from suspending or deleting themselves
  if (userId === admin.id) {
    return NextResponse.json({ error: "You cannot perform this action on your own super-admin account." }, { status: 400 });
  }

  const serviceClient = getServiceRoleClient();
  const userClient = createClient();
  const clientToUse = serviceClient || userClient;

  // Retrieve user to check exists and log details
  const { data: targetUser, error: findError } = await clientToUse
    .from("profiles")
    .select("id, email, full_name, role, is_suspended")
    .eq("id", userId)
    .maybeSingle();

  if (findError || !targetUser) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  if (action === "suspend") {
    const { error } = await clientToUse
      .from("profiles")
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspension_reason: reason || "Administrative suspension",
      })
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "suspend_user",
      targetType: "user",
      targetId: userId,
      details: { email: targetUser.email, role: targetUser.role, reason: reason || "No reason specified" },
      req: request,
    });

    return NextResponse.json({ success: true, message: `User ${targetUser.email} has been suspended.` });
  }

  if (action === "reactivate") {
    const { error } = await clientToUse
      .from("profiles")
      .update({
        is_suspended: false,
        suspended_at: null,
        suspension_reason: null,
      })
      .eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "reactivate_user",
      targetType: "user",
      targetId: userId,
      details: { email: targetUser.email, role: targetUser.role },
      req: request,
    });

    return NextResponse.json({ success: true, message: `User ${targetUser.email} has been reactivated.` });
  }

  if (action === "delete") {
    let deletedSuccessfully = false;

    // 1. Try atomic procedure if present
    try {
      const { data: rpcRes, error: rpcErr } = await clientToUse.rpc("delete_user_as_admin", {
        user_id_to_delete: userId,
      });

      if (!rpcErr && rpcRes && rpcRes.success) {
        deletedSuccessfully = true;
      }
    } catch {
      // Proceed to direct cascade fallback
    }

    // 2. Direct cascade fallback
    if (!deletedSuccessfully) {
      // Clean up reservations placed by this user
      await clientToUse.from("reservations").delete().eq("user_id", userId);

      // If user owns pharmacies, clean up pharmacies & stock
      const { data: ownedPharmacies } = await clientToUse
        .from("pharmacies")
        .select("id")
        .eq("owner_id", userId);

      if (ownedPharmacies && ownedPharmacies.length > 0) {
        for (const p of ownedPharmacies) {
          const { data: pStocks } = await clientToUse.from("pharmacy_stock").select("id").eq("pharmacy_id", p.id);
          const pStockIds = (pStocks || []).map((s: { id: string }) => s.id);
          if (pStockIds.length > 0) {
            await clientToUse.from("reservations").delete().in("pharmacy_stock_id", pStockIds);
            await clientToUse.from("pharmacy_stock").delete().eq("pharmacy_id", p.id);
          }
          await clientToUse.from("pharmacies").delete().eq("id", p.id);
        }
      }

      // Clean up notifications
      await clientToUse.from("notifications").delete().eq("user_id", userId);

      // If service role client is configured, also remove from Auth users
      if (serviceClient && serviceClient.auth && serviceClient.auth.admin) {
        try {
          await serviceClient.auth.admin.deleteUser(userId);
        } catch (authErr) {
          console.warn("Service role auth user deletion warning:", authErr);
        }
      }

      // Delete from profiles
      const { data: deleted, error } = await clientToUse
        .from("profiles")
        .delete()
        .eq("id", userId)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      if (!deleted || deleted.length === 0) {
        return NextResponse.json(
          { error: `Unable to delete user "${targetUser.email}". Database RLS policy prevented deletion. Please apply migration 0008.` },
          { status: 403 }
        );
      }
    }

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete_user",
      targetType: "user",
      targetId: userId,
      details: { email: targetUser.email, role: targetUser.role },
      req: request,
    });

    return NextResponse.json({ success: true, message: `User ${targetUser.email} has been deleted.` });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
