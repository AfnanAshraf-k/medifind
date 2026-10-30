import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, recordAuditLog, getServiceRoleClient } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const category = searchParams.get("category") || "all";
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const supabase = createClient();

  let query = supabase
    .from("medicines")
    .select("id, name, generic_name, category, image_url, created_at", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,generic_name.ilike.%${search}%`);
  }

  if (category !== "all") {
    query = query.eq("category", category);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ medicines: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse || !admin) return errorResponse;

  const body = await request.json();
  const { action, medicineId, name, genericName, category, imageUrl } = body;

  const serviceClient = getServiceRoleClient();
  const userClient = createClient();
  const clientToUse = serviceClient || userClient;

  if (action === "create") {
    if (!name?.trim()) {
      return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
    }

    const { data, error } = await clientToUse
      .from("medicines")
      .insert({
        name: name.trim(),
        generic_name: genericName?.trim() || null,
        category: category?.trim() || "General",
        image_url: imageUrl?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "create_medicine",
      targetType: "medicine",
      targetId: data.id,
      details: { name: data.name, category: data.category },
      req: request,
    });

    return NextResponse.json({ success: true, medicine: data });
  }

  if (action === "update" || action === "edit") {
    const idToUpdate = medicineId || body.id;
    if (!idToUpdate) {
      return NextResponse.json({ error: "medicineId is required for updating medicine." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (genericName !== undefined) updates.generic_name = genericName?.trim() || null;
    if (category !== undefined) updates.category = category.trim();
    if (imageUrl !== undefined) updates.image_url = imageUrl?.trim() || null;

    const { data, error } = await clientToUse
      .from("medicines")
      .update(updates)
      .eq("id", idToUpdate)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update_medicine",
      targetType: "medicine",
      targetId: idToUpdate,
      details: updates,
      req: request,
    });

    return NextResponse.json({ success: true, medicine: data });
  }

  if (action === "delete") {
    if (!medicineId) {
      return NextResponse.json({ error: "medicineId is required for deletion." }, { status: 400 });
    }

    let deletedName = "Medicine";
    let deletedSuccessfully = false;

    // 1. Attempt using Security Definer RPC function if present
    try {
      const { data: rpcRes, error: rpcErr } = await clientToUse.rpc("delete_medicine_as_admin", {
        medicine_id_to_delete: medicineId,
      });

      if (!rpcErr && rpcRes) {
        if (rpcRes.success) {
          deletedSuccessfully = true;
          deletedName = rpcRes.medicine_name || deletedName;
        } else if (rpcRes.error) {
          return NextResponse.json({ error: rpcRes.error }, { status: 400 });
        }
      }
    } catch {
      // RPC may not be present in remote database yet, proceed to direct fallback
    }

    // 2. Direct relational cleanup and deletion
    if (!deletedSuccessfully) {
      // Step A: Check if medicine exists
      const { data: existingMed, error: fetchErr } = await clientToUse
        .from("medicines")
        .select("id, name")
        .eq("id", medicineId)
        .maybeSingle();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      if (!existingMed) {
        return NextResponse.json({ error: "Medicine not found in catalog." }, { status: 404 });
      }

      deletedName = existingMed.name;

      // Step B: Find stock rows referencing this medicine
      const { data: stockRows } = await clientToUse
        .from("pharmacy_stock")
        .select("id")
        .eq("medicine_id", medicineId);

      const stockIds = (stockRows || []).map((s: { id: string }) => s.id);

      // Step C: Remove referencing reservations to prevent FK or trigger blocks
      if (stockIds.length > 0) {
        await clientToUse
          .from("reservations")
          .delete()
          .in("pharmacy_stock_id", stockIds);

        // Step D: Remove referencing stock entries
        await clientToUse
          .from("pharmacy_stock")
          .delete()
          .eq("medicine_id", medicineId);
      }

      // Step E: Delete the medicine with select() to verify row deletion
      const { data: deletedRows, error: deleteError } = await clientToUse
        .from("medicines")
        .delete()
        .eq("id", medicineId)
        .select("id, name");

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      if (!deletedRows || deletedRows.length === 0) {
        return NextResponse.json(
          {
            error: `Unable to delete "${deletedName}". Database Row Level Security (RLS) prevented deletion. Please apply migration 0007_admin_medicine_delete_policy.sql in your Supabase SQL Editor.`,
          },
          { status: 403 }
        );
      }

      deletedSuccessfully = true;
    }

    // Step F: Record administrative audit log
    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete_medicine",
      targetType: "medicine",
      targetId: medicineId,
      details: { medicine_id: medicineId, medicine_name: deletedName },
      req: request,
    });

    return NextResponse.json({
      success: true,
      message: `Medicine "${deletedName}" has been successfully removed from catalog.`,
    });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}
