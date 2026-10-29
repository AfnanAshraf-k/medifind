import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "admin";
}

/**
 * Verifies that the current request is authenticated and belongs to an administrator.
 * Returns the admin user profile or null.
 */
export async function getAuthenticatedAdmin(): Promise<{ admin: AdminUser | null; errorResponse?: NextResponse }> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Please sign in as an administrator." },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_suspended")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin" || profile.is_suspended) {
    return {
      admin: null,
      errorResponse: NextResponse.json(
        { error: "Forbidden: Super-admin privileges are required to access this resource." },
        { status: 403 }
      ),
    };
  }

  return {
    admin: {
      id: profile.id,
      email: profile.email || user.email || "",
      full_name: profile.full_name || "Admin",
      role: "admin",
    },
  };
}

/**
 * Records an entry in the admin audit log.
 */
export async function recordAuditLog({
  adminId,
  adminEmail,
  action,
  targetType,
  targetId,
  details = {},
  req,
}: {
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  req?: NextRequest;
}) {
  try {
    const supabase = createClient();
    const ipAddress = req
      ? req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
      : "system";

    await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error("Failed to write to admin_audit_logs:", err);
  }
}

/**
 * Creates an in-app notification for a user.
 */
export async function createNotification({
  userId,
  title,
  message,
  type = "info",
  metadata = {},
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const supabase = createClient();
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      metadata,
    });
  } catch (err) {
    console.error("Failed to create in-app notification:", err);
  }
}

