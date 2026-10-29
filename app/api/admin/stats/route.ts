import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse) return errorResponse;

  const supabase = createClient();

  try {
    // Platform-wide counts
    const [
      { count: totalUsers },
      { count: totalCustomers },
      { count: totalPharmacies },
      { count: pendingApprovals },
      { count: approvedPharmacies },
      { count: rejectedPharmacies },
      { count: activeReservations },
      { count: expiredReservations },
      { count: collectedReservations },
      { count: cancelledReservations },
      { count: totalMedicines },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("pharmacies").select("*", { count: "exact", head: true }),
      supabase.from("pharmacies").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("pharmacies").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("pharmacies").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      supabase.from("reservations").select("*", { count: "exact", head: true }).in("status", ["pending", "ready"]),
      supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "expired"),
      supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "collected"),
      supabase.from("reservations").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
      supabase.from("medicines").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalCustomers: totalCustomers || 0,
      totalPharmacies: totalPharmacies || 0,
      pendingApprovals: pendingApprovals || 0,
      approvedPharmacies: approvedPharmacies || 0,
      rejectedPharmacies: rejectedPharmacies || 0,
      activeReservations: activeReservations || 0,
      expiredReservations: expiredReservations || 0,
      collectedReservations: collectedReservations || 0,
      cancelledReservations: cancelledReservations || 0,
      totalMedicines: totalMedicines || 0,
    });
  } catch (err: any) {
    console.error("Error fetching admin stats:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch platform stats" }, { status: 500 });
  }
}

