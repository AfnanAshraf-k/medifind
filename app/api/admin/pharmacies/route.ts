import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, recordAuditLog, createNotification } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "all"; // 'pending', 'approved', 'rejected', 'all'
  const suspended = searchParams.get("suspended") || "all";
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const supabase = createClient();

  let query = supabase
    .from("pharmacies")
    .select(
      `
      id,
      name,
      address,
      phone,
      license_number,
      status,
      rejection_reason,
      approved_at,
      reservation_expiry_hours,
      is_suspended,
      is_open,
      rating,
      created_at,
      owner:owner_id(id, full_name, email, role, is_suspended)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,phone.ilike.%${search}%,license_number.ilike.%${search}%`);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (suspended === "active") {
    query = query.eq("is_suspended", false);
  } else if (suspended === "suspended") {
    query = query.eq("is_suspended", true);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pharmacies: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse || !admin) return errorResponse;

  const body = await request.json();
  const { action, pharmacyId, reason } = body;

  if (!action || !pharmacyId) {
    return NextResponse.json({ error: "Missing required fields: action and pharmacyId are required." }, { status: 400 });
  }

  const supabase = createClient();

  // Find pharmacy
  const { data: pharmacy, error: findError } = await supabase
    .from("pharmacies")
    .select("id, name, owner_id, status, is_suspended, license_number")
    .eq("id", pharmacyId)
    .single();

  if (findError || !pharmacy) {
    return NextResponse.json({ error: "Pharmacy not found." }, { status: 404 });
  }

  if (action === "approve") {
    const { error } = await supabase
      .from("pharmacies")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: admin.id,
        rejection_reason: null,
      })
      .eq("id", pharmacyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify pharmacy owner
    await createNotification({
      userId: pharmacy.owner_id,
      title: "Pharmacy Approved!",
      message: `Congratulations! Your pharmacy "${pharmacy.name}" has been approved by administrators. You can now log in and manage your medicine listings.`,
      type: "approval",
      metadata: { pharmacy_id: pharmacyId },
    });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "approve_pharmacy",
      targetType: "pharmacy",
      targetId: pharmacyId,
      details: { pharmacy_name: pharmacy.name, owner_id: pharmacy.owner_id },
      req: request,
    });

    return NextResponse.json({ success: true, message: `Pharmacy "${pharmacy.name}" has been approved.` });
  }

  if (action === "reject") {
    const rejectionReason = reason?.trim() || "Information could not be verified by platform administrators.";

    const { error } = await supabase
      .from("pharmacies")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
      })
      .eq("id", pharmacyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify pharmacy owner
    await createNotification({
      userId: pharmacy.owner_id,
      title: "Pharmacy Registration Rejected",
      message: `Your registration request for "${pharmacy.name}" was not approved. Reason: ${rejectionReason}`,
      type: "rejection",
      metadata: { pharmacy_id: pharmacyId, reason: rejectionReason },
    });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "reject_pharmacy",
      targetType: "pharmacy",
      targetId: pharmacyId,
      details: { pharmacy_name: pharmacy.name, owner_id: pharmacy.owner_id, reason: rejectionReason },
      req: request,
    });

    return NextResponse.json({ success: true, message: `Pharmacy "${pharmacy.name}" has been rejected.` });
  }

  if (action === "suspend") {
    const { error } = await supabase
      .from("pharmacies")
      .update({ is_suspended: true })
      .eq("id", pharmacyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createNotification({
      userId: pharmacy.owner_id,
      title: "Pharmacy Temporarily Suspended",
      message: `Your pharmacy "${pharmacy.name}" has been suspended by an administrator. Please reach out to support for resolution.`,
      type: "suspension",
      metadata: { pharmacy_id: pharmacyId, reason: reason },
    });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "suspend_pharmacy",
      targetType: "pharmacy",
      targetId: pharmacyId,
      details: { pharmacy_name: pharmacy.name, reason: reason || "No reason specified" },
      req: request,
    });

    return NextResponse.json({ success: true, message: `Pharmacy "${pharmacy.name}" has been suspended.` });
  }

  if (action === "reactivate") {
    const { error } = await supabase
      .from("pharmacies")
      .update({ is_suspended: false })
      .eq("id", pharmacyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createNotification({
      userId: pharmacy.owner_id,
      title: "Pharmacy Reactivated",
      message: `Your pharmacy "${pharmacy.name}" suspension has been lifted. Your listings are active again.`,
      type: "reactivation",
      metadata: { pharmacy_id: pharmacyId },
    });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "reactivate_pharmacy",
      targetType: "pharmacy",
      targetId: pharmacyId,
      details: { pharmacy_name: pharmacy.name },
      req: request,
    });

    return NextResponse.json({ success: true, message: `Pharmacy "${pharmacy.name}" has been reactivated.` });
  }

  if (action === "delete") {
    const { error } = await supabase.from("pharmacies").delete().eq("id", pharmacyId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await recordAuditLog({
      adminId: admin.id,
      adminEmail: admin.email,
      action: "delete_pharmacy",
      targetType: "pharmacy",
      targetId: pharmacyId,
      details: { pharmacy_name: pharmacy.name },
      req: request,
    });

    return NextResponse.json({ success: true, message: `Pharmacy "${pharmacy.name}" has been deleted.` });
  }

  return NextResponse.json({ error: "Invalid action." }, { status: 400 });
}

