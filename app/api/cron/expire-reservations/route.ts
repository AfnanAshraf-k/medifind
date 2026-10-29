import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleExpiry(request);
}

export async function POST(request: NextRequest) {
  return handleExpiry(request);
}

async function handleExpiry(request: NextRequest) {
  // Check authorization: Either CRON_SECRET header or an authenticated admin
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  const isCronAuth = cronSecret && authHeader === `Bearer ${cronSecret}`;

  const supabase = createClient();

  if (!isCronAuth) {
    // If not cron secret, check if signed in as admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin or Cron Secret required" }, { status: 403 });
    }
  }

  try {
    // 1. Try running database function if available
    const { data: rpcCount, error: rpcError } = await supabase.rpc("expire_overdue_reservations");

    if (!rpcError && typeof rpcCount === "number") {
      return NextResponse.json({
        success: true,
        expiredCount: rpcCount,
        timestamp: new Date().toISOString(),
        method: "rpc",
      });
    }

    // 2. Direct query fallback: find all active reservations where expires_at <= now()
    const nowIso = new Date().toISOString();

    const { data: overdueList, error: queryError } = await supabase
      .from("reservations")
      .select("id, user_id, quantity, pharmacy_stock_id, status, pharmacy_stock(medicine_id, medicine:medicines(name))")
      .in("status", ["pending", "ready"])
      .not("expires_at", "is", null)
      .lte("expires_at", nowIso);

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    let expiredCount = 0;

    for (const res of overdueList || []) {
      // Mark as expired
      const { error: updateError } = await supabase
        .from("reservations")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", res.id);

      if (!updateError) {
        expiredCount++;

        // Restore stock
        if (res.pharmacy_stock_id && res.quantity) {
          // Fetch current stock
          const { data: curStock } = await supabase
            .from("pharmacy_stock")
            .select("quantity")
            .eq("id", res.pharmacy_stock_id)
            .single();

          if (curStock) {
            await supabase
              .from("pharmacy_stock")
              .update({ quantity: (curStock.quantity || 0) + res.quantity })
              .eq("id", res.pharmacy_stock_id);
          }
        }

        // Notify customer
        const medName = (res.pharmacy_stock as any)?.medicine?.name || "medicine";
        await supabase.from("notifications").insert({
          user_id: res.user_id,
          title: "Reservation Expired",
          message: `Your reservation for ${medName} has expired. The reserved items have been returned to available stock.`,
          type: "expiry_notice",
          metadata: { reservation_id: res.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      timestamp: new Date().toISOString(),
      method: "query_fallback",
    });
  } catch (err: any) {
    console.error("Error in expire-reservations cron:", err);
    return NextResponse.json({ error: err.message || "Cron execution failed" }, { status: 500 });
  }
}

