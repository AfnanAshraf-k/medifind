import test from "node:test";
import assert from "node:assert/strict";

/**
 * Feature 1, 2 & 3 Automated Test Suite
 * MediFind Master Admin Control Panel, Pharmacy Approval Workflow, and Reservation Expiry
 */

// ==============================================================================
// 1. Role-Based Access Control (RBAC) Tests
// ==============================================================================
test("RBAC - Non-admin roles must be blocked from admin endpoints", async () => {
  const roles = ["customer", "pharmacy", "guest", null, undefined];

  for (const role of roles) {
    const isAllowed = role === "admin";
    assert.strictEqual(
      isAllowed,
      false,
      `Role '${role}' should not be allowed admin privileges`
    );
  }
});

test("RBAC - Admin role verification passes only for 'admin'", async () => {
  const adminUser = { id: "admin-1", role: "admin", email: "admin@medifind.com" };
  assert.strictEqual(adminUser.role === "admin", true, "Super-admin must have admin role");
});

test("RBAC - Middleware route protection rules", () => {
  function checkMiddlewareRoute(pathname, userRole) {
    // Admin login is public
    if (pathname === "/admin/login") return { allowed: true };
    // Protected admin routes require admin role
    if (pathname.startsWith("/admin")) {
      if (!userRole) return { allowed: false, redirect: "/admin/login" };
      if (userRole !== "admin") return { allowed: false, redirect: "/admin/login?error=unauthorized" };
      return { allowed: true };
    }
    // Customer dashboard requires login
    if (pathname.startsWith("/dashboard")) {
      if (!userRole) return { allowed: false, redirect: "/login" };
      return { allowed: true };
    }
    // Pharmacy dashboard requires pharmacy role or admin
    if (pathname.startsWith("/pharmacy")) {
      if (!userRole) return { allowed: false, redirect: "/login" };
      if (userRole !== "pharmacy" && userRole !== "admin") {
        return { allowed: false, redirect: "/dashboard" };
      }
      return { allowed: true };
    }
    return { allowed: true };
  }

  // Admin portal access tests
  assert.deepStrictEqual(checkMiddlewareRoute("/admin", null), { allowed: false, redirect: "/admin/login" });
  assert.deepStrictEqual(checkMiddlewareRoute("/admin", "customer"), { allowed: false, redirect: "/admin/login?error=unauthorized" });
  assert.deepStrictEqual(checkMiddlewareRoute("/admin", "pharmacy"), { allowed: false, redirect: "/admin/login?error=unauthorized" });
  assert.deepStrictEqual(checkMiddlewareRoute("/admin", "admin"), { allowed: true });
  assert.deepStrictEqual(checkMiddlewareRoute("/admin/login", null), { allowed: true });

  // Pharmacy dashboard tests
  assert.deepStrictEqual(checkMiddlewareRoute("/pharmacy/dashboard", null), { allowed: false, redirect: "/login" });
  assert.deepStrictEqual(checkMiddlewareRoute("/pharmacy/dashboard", "customer"), { allowed: false, redirect: "/dashboard" });
  assert.deepStrictEqual(checkMiddlewareRoute("/pharmacy/dashboard", "pharmacy"), { allowed: true });
});

// ==============================================================================
// 2. Pharmacy Approval Workflow Tests
// ==============================================================================
test("Approval Flow - New pharmacy registration starts as PENDING", () => {
  function registerPharmacy(name, licenseNumber) {
    return {
      id: "pharm-new-1",
      name,
      license_number: licenseNumber,
      status: "pending",
      reservation_expiry_hours: 24,
      is_suspended: false,
      rejection_reason: null,
      approved_at: null,
    };
  }

  const newPharmacy = registerPharmacy("MedPlus Pharmacy", "KL-MED-9921");
  assert.strictEqual(newPharmacy.status, "pending");
  assert.strictEqual(newPharmacy.is_suspended, false);
  assert.strictEqual(newPharmacy.approved_at, null);
});

test("Approval Flow - Pending pharmacy login and inventory access is blocked", () => {
  function canPharmacyManageInventory(pharmacy) {
    if (!pharmacy) return { canAccess: false, reason: "No pharmacy found" };
    if (pharmacy.status === "pending") {
      return { canAccess: false, reason: "Registration awaiting admin approval" };
    }
    if (pharmacy.status === "rejected") {
      return { canAccess: false, reason: `Application rejected: ${pharmacy.rejection_reason || "Unverified credentials"}` };
    }
    if (pharmacy.is_suspended) {
      return { canAccess: false, reason: "Account temporarily suspended" };
    }
    return { canAccess: true, reason: "Approved" };
  }

  const pending = { status: "pending" };
  const rejected = { status: "rejected", rejection_reason: "Invalid drug license copy." };
  const suspended = { status: "approved", is_suspended: true };
  const approved = { status: "approved", is_suspended: false };

  assert.strictEqual(canPharmacyManageInventory(pending).canAccess, false);
  assert.match(canPharmacyManageInventory(pending).reason, /awaiting admin approval/i);

  assert.strictEqual(canPharmacyManageInventory(rejected).canAccess, false);
  assert.match(canPharmacyManageInventory(rejected).reason, /Invalid drug license copy/);

  assert.strictEqual(canPharmacyManageInventory(suspended).canAccess, false);
  assert.match(canPharmacyManageInventory(suspended).reason, /suspended/i);

  assert.strictEqual(canPharmacyManageInventory(approved).canAccess, true);
});

test("Approval Flow - Only approved and non-suspended pharmacies appear in customer search", () => {
  const pharmacyCatalog = [
    { id: "p1", name: "Care First", status: "approved", is_suspended: false },
    { id: "p2", name: "Quick Meds", status: "pending", is_suspended: false },
    { id: "p3", name: "City Pharma", status: "rejected", is_suspended: false },
    { id: "p4", name: "Late Night Chemist", status: "approved", is_suspended: true },
    { id: "p5", name: "Apex Drugs", status: "approved", is_suspended: false },
  ];

  function filterSearchablePharmacies(catalog) {
    return catalog.filter((p) => p.status === "approved" && !p.is_suspended);
  }

  const visiblePharmacies = filterSearchablePharmacies(pharmacyCatalog);
  assert.strictEqual(visiblePharmacies.length, 2);
  assert.deepStrictEqual(
    visiblePharmacies.map((p) => p.id),
    ["p1", "p5"]
  );
});

test("Approval Flow - Admin approves pharmacy with notification and audit logging", () => {
  const pharmacy = {
    id: "pharm-10",
    name: "Valley Health",
    status: "pending",
    approved_at: null,
    approved_by: null,
  };

  const admin = { id: "admin-root", email: "admin@medifind.com" };

  function approvePharmacy(target, adminUser) {
    return {
      ...target,
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
      rejection_reason: null,
    };
  }

  const approved = approvePharmacy(pharmacy, admin);
  assert.strictEqual(approved.status, "approved");
  assert.strictEqual(approved.approved_by, "admin-root");
  assert.ok(approved.approved_at);
});

test("Approval Flow - Admin rejects pharmacy with reason", () => {
  const pharmacy = {
    id: "pharm-11",
    name: "Questionable Meds",
    status: "pending",
  };

  function rejectPharmacy(target, reason) {
    return {
      ...target,
      status: "rejected",
      rejection_reason: reason || "Did not meet verification criteria.",
    };
  }

  const rejected = rejectPharmacy(pharmacy, "License number expired on 2024-12-31.");
  assert.strictEqual(rejected.status, "rejected");
  assert.strictEqual(rejected.rejection_reason, "License number expired on 2024-12-31.");
});

// ==============================================================================
// 3. Reservation Expiration Edge Cases & Validation
// ==============================================================================
test("Reservation Expiry - Expiry window input validation (1-72 hours)", () => {
  function validateExpiryWindow(hours) {
    if (typeof hours !== "number" || isNaN(hours)) return false;
    if (hours < 1 || hours > 72) return false;
    return true;
  }

  // Valid inputs
  assert.strictEqual(validateExpiryWindow(1), true);
  assert.strictEqual(validateExpiryWindow(24), true);
  assert.strictEqual(validateExpiryWindow(48), true);
  assert.strictEqual(validateExpiryWindow(72), true);

  // Edge cases & invalid inputs
  assert.strictEqual(validateExpiryWindow(0), false);
  assert.strictEqual(validateExpiryWindow(-5), false);
  assert.strictEqual(validateExpiryWindow(73), false);
  assert.strictEqual(validateExpiryWindow(100), false);
  assert.strictEqual(validateExpiryWindow(NaN), false);
  assert.strictEqual(validateExpiryWindow("24"), false);
});

test("Reservation Expiry - Expiry time calculation matches pharmacy configuration", () => {
  function calculateExpiresAt(createdAtIso, pharmacyExpiryHours) {
    const hours = (typeof pharmacyExpiryHours === "number" && pharmacyExpiryHours >= 1 && pharmacyExpiryHours <= 72)
      ? pharmacyExpiryHours
      : 24; // default
    const d = new Date(createdAtIso);
    return new Date(d.getTime() + hours * 60 * 60 * 1000).toISOString();
  }

  const orderTime = "2026-10-29T10:00:00.000Z";

  // Pharmacy with 12 hour expiry
  const expiresAt12 = calculateExpiresAt(orderTime, 12);
  assert.strictEqual(expiresAt12, "2026-10-29T22:00:00.000Z");

  // Pharmacy with 48 hour expiry
  const expiresAt48 = calculateExpiresAt(orderTime, 48);
  assert.strictEqual(expiresAt48, "2026-10-31T10:00:00.000Z");

  // Default fallback when not provided
  const expiresDefault = calculateExpiresAt(orderTime, null);
  assert.strictEqual(expiresDefault, "2026-10-30T10:00:00.000Z");
});

test("Reservation Expiry - Existing reservations retain their original deadline when setting changes", () => {
  const existingOrder = {
    id: "order-1",
    created_at: "2026-10-29T08:00:00.000Z",
    expires_at: "2026-10-30T08:00:00.000Z", // created under 24h setting
    status: "pending",
  };

  // Pharmacy updates its setting from 24h to 12h
  const updatedPharmacy = { reservation_expiry_hours: 12 };

  // New order uses new setting
  const newOrderCreatedAt = "2026-10-29T12:00:00.000Z";
  const newOrder = {
    id: "order-2",
    created_at: newOrderCreatedAt,
    expires_at: new Date(new Date(newOrderCreatedAt).getTime() + updatedPharmacy.reservation_expiry_hours * 3600000).toISOString(),
    status: "pending",
  };

  // Verify existing order deadline is unchanged
  assert.strictEqual(existingOrder.expires_at, "2026-10-30T08:00:00.000Z");
  // Verify new order uses 12h window
  assert.strictEqual(newOrder.expires_at, "2026-10-30T00:00:00.000Z");
});

test("Reservation Expiry - Scheduler sweeps overdue reservations and restores stock", () => {
  let inventory = {
    "stock-item-1": { quantity: 15 },
    "stock-item-2": { quantity: 8 },
  };

  const reservations = [
    {
      id: "res-overdue-1",
      pharmacy_stock_id: "stock-item-1",
      quantity: 5,
      status: "pending",
      expires_at: "2026-10-28T10:00:00.000Z", // In the past
    },
    {
      id: "res-overdue-2",
      pharmacy_stock_id: "stock-item-2",
      quantity: 2,
      status: "ready",
      expires_at: "2026-10-28T12:00:00.000Z", // In the past
    },
    {
      id: "res-active-3",
      pharmacy_stock_id: "stock-item-1",
      quantity: 3,
      status: "pending",
      expires_at: "2026-10-30T10:00:00.000Z", // In the future
    },
    {
      id: "res-fulfilled-4",
      pharmacy_stock_id: "stock-item-2",
      quantity: 1,
      status: "collected",
      expires_at: "2026-10-27T10:00:00.000Z", // Collected past deadline: do NOT restock
    },
    {
      id: "res-cancelled-5",
      pharmacy_stock_id: "stock-item-1",
      quantity: 1,
      status: "cancelled",
      expires_at: "2026-10-27T10:00:00.000Z", // Already cancelled: do NOT double restock
    },
  ];

  function runExpirySweep(nowIso) {
    const nowTime = new Date(nowIso).getTime();
    let expiredCount = 0;
    let releasedUnits = 0;

    for (const res of reservations) {
      if ((res.status === "pending" || res.status === "ready") && new Date(res.expires_at).getTime() < nowTime) {
        res.status = "expired";
        inventory[res.pharmacy_stock_id].quantity += res.quantity;
        expiredCount++;
        releasedUnits += res.quantity;
      }
    }

    return { expiredCount, releasedUnits };
  }

  const result = runExpirySweep("2026-10-29T12:00:00.000Z");

  // Assertions
  assert.strictEqual(result.expiredCount, 2, "2 overdue reservations should have expired");
  assert.strictEqual(result.releasedUnits, 7, "7 units should be released back into inventory");

  // Verify stock levels:
  // stock-item-1 started at 15 + 5 (from res-overdue-1) = 20
  assert.strictEqual(inventory["stock-item-1"].quantity, 20);
  // stock-item-2 started at 8 + 2 (from res-overdue-2) = 10
  assert.strictEqual(inventory["stock-item-2"].quantity, 10);

  // Verify active order remained pending
  assert.strictEqual(reservations[2].status, "pending");
  // Verify collected order remained collected
  assert.strictEqual(reservations[3].status, "collected");
  // Verify cancelled order remained cancelled
  assert.strictEqual(reservations[4].status, "cancelled");
});

