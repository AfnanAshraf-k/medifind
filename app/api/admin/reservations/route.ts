import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin, recordAuditLog, createNotification } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const pharmacyId = searchParams.get("pharmacyId");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const supabase = createClient();

  let query = supabase
    .from("reservations")
    .select(
      `
      id,
      quantity,
      status,
      created_at,
      expires_at,
      prescription_url,
      user:user_id(id, full_name, email),
      pharmacy_stock:pharmacy_stock_id(
        id,
        price,
        pharmacy:pharmacies(id, name, phone, address),
        medicine:medicines(id, name, category)
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (pharmacyId) {
    query = query.eq("pharmacy_stock.pharmacy_id", pharmacyId);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reservations: data || [], total: count || 0 });
}

export async function POST(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse || !admin) return errorResponse;

  const body = await request.json();
  const { action, reservationId, reason } = body;

  if (action !== "cancel" || !reservationId) {
    return NextResponse.json({ error: "Invalid action or missing reservationId." }, { status: 400 });
  }

  const supabase = createClient();

  // Find reservation
  const { data: res, error: findError } = await supabase
    .from("reservations")
    .select(
      `
      id,
      quantity,
      status,
      user_id,
      pharmacy_stock:pharmacy_stock_id(
        id,
        pharmacy:pharmacies(id, name, owner_id),
        medicine:medicines(id, name)
      )
    `
    )
    .eq("id", reservationId)
    .single();

  if (findError || !res) {
    return NextResponse.json({ error: "Reservation not found." }, { status: 404 });
  }

  const cancellationReason = reason?.trim() || "Cancelled by platform administrator oversight.";

  // Update reservation status to 'cancelled'. Trigger restores stock automatically!
  const { error: updateError } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const medName = (res.pharmacy_stock as any)?.medicine?.name || "Medication";
  const pharmName = (res.pharmacy_stock as any)?.pharmacy?.name || "Pharmacy";
  const pharmOwnerId = (res.pharmacy_stock as any)?.pharmacy?.owner_id;

  // Notify customer
  await createNotification({
    userId: res.user_id,
    title: "Reservation Cancelled by Admin",
    message: `Your reservation for ${medName} at ${pharmName} has been cancelled by platform admin. Reason: ${cancellationReason}`,
    type: "order_cancelled",
    metadata: { reservation_id: reservationId, reason: cancellationReason },
  });

  // Notify pharmacy owner if present
  if (pharmOwnerId) {
    await createNotification({
      userId: pharmOwnerId,
      title: "Reservation Cancelled by Admin",
      message: `Reservation #${reservationId.slice(0, 8)} for ${medName} was cancelled by administrator. Items returned to stock.`,
      type: "order_cancelled",
      metadata: { reservation_id: reservationId },
    });
  }

  await recordAuditLog({
    adminId: admin.id,
    adminEmail: admin.email,
    action: "cancel_reservation",
    targetType: "reservation",
    targetId: reservationId,
    details: {
      customer_id: res.user_id,
      medicine: medName,
      pharmacy: pharmName,
      reason: cancellationReason,
    },
    req: request,
  });

  return NextResponse.json({
    success: true,
    message: "Reservation successfully cancelled and stock returned to availability.",
  });
}

