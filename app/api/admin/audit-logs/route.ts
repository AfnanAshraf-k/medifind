import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { admin, errorResponse } = await getAuthenticatedAdmin();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const targetType = searchParams.get("targetType");
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const supabase = createClient();

  let query = supabase
    .from("admin_audit_logs")
    .select(
      `
      id,
      admin_id,
      admin_email,
      action,
      target_type,
      target_id,
      details,
      ip_address,
      created_at
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (action && action !== "all") {
    query = query.eq("action", action);
  }

  if (targetType && targetType !== "all") {
    query = query.eq("target_type", targetType);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data || [], total: count || 0 });
}

