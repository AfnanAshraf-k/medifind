import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, recordAuditLog } from "@/lib/admin";
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

  const supabase = createClient();

  // Retrieve user to check exists and log details
  const { data: targetUser, error: findError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_suspended")
    .eq("id", userId)
    .single();

  if (findError || !targetUser) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  if (action === "suspend") {
    const { error } = await supabase
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
    const { error } = await supabase
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
    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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

