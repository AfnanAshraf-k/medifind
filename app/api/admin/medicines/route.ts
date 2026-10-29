import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, recordAuditLog } from "@/lib/admin";
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

  const supabase = createClient();

  if (action === "create") {
    if (!name?.trim()) {
      return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
    }

    const { data, error } = await supabase
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

  if (action === "update") {
    if (!medicineId) {
      return NextResponse.json({ error: "medicineId is required for update." }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (name) updates.name = name.trim();
    if (genericName !== undefined) updates.generic_name = genericName?.trim() || null;
    if (category) updates.category = category.trim();
    if (imageUrl !== undefined) updates.image_url = imageUrl?.trim() || null;

    const { data, error } = await supabase
      .from("medicines")
      .update(updates)
      .eq("id", medicineId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "update_medicine",
      targetType: "medicine",
      targetId: medicineId,
      details: updates,
      req: request,
    });

    return NextResponse.json({ success: true, medicine: data });
  }

  if (action === "delete") {
    if (!medicineId) {
      return NextResponse.json({ error: "medicineId is required for deletion." }, { status: 400 });
    }

    const { error } = await supabase.from("medicines").delete().eq("id", medicineId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete_medicine",
      targetType: "medicine",
      targetId: medicineId,
      details: { medicine_id: medicineId },
      req: request,
    });

    return NextResponse.json({ success: true, message: "Medicine removed from catalog." });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

