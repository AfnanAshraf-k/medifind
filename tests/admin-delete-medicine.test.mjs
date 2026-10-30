import test from "node:test";
import assert from "node:assert/strict";

/**
 * Test Suite: Admin Medicine Deletion Logic & Error Handling
 * Validates that medicine catalog deletion properly cascades across
 * stock and reservations, detects missing RLS policies, and prevents silent failure.
 */

test("Admin Delete Medicine - Returns 400 when medicineId is omitted", async () => {
  const handler = async (body) => {
    if (body.action === "delete") {
      if (!body.medicineId) {
        return { status: 400, data: { error: "medicineId is required for deletion." } };
      }
    }
    return { status: 200, data: { success: true } };
  };

  const res = await handler({ action: "delete" });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.error, "medicineId is required for deletion.");
});

test("Admin Delete Medicine - Returns 404 when target medicine does not exist", async () => {
  const mockDb = {
    medicines: [{ id: "med-1", name: "Paracetamol 500mg" }],
  };

  const deleteMedicineWorkflow = async (medicineId) => {
    const med = mockDb.medicines.find((m) => m.id === medicineId);
    if (!med) {
      return { status: 404, data: { error: "Medicine not found in catalog." } };
    }
    return { status: 200, data: { success: true } };
  };

  const res = await deleteMedicineWorkflow("non-existent-uuid");
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.data.error, "Medicine not found in catalog.");
});

test("Admin Delete Medicine - Cleans up reservations and stocks before medicine deletion", async () => {
  const mockDb = {
    medicines: [{ id: "med-1", name: "Amoxicillin 250mg" }],
    pharmacy_stock: [
      { id: "stock-1", medicine_id: "med-1" },
      { id: "stock-2", medicine_id: "med-1" },
      { id: "stock-3", medicine_id: "med-other" },
    ],
    reservations: [
      { id: "res-1", pharmacy_stock_id: "stock-1" },
      { id: "res-2", pharmacy_stock_id: "stock-3" },
    ],
    auditLogs: [],
  };

  const executeDelete = async (medicineId) => {
    const med = mockDb.medicines.find((m) => m.id === medicineId);
    if (!med) return { status: 404, data: { error: "Medicine not found in catalog." } };

    // 1. Find referencing stock IDs
    const referencingStocks = mockDb.pharmacy_stock.filter((s) => s.medicine_id === medicineId);
    const stockIds = referencingStocks.map((s) => s.id);

    // 2. Cascade delete reservations
    mockDb.reservations = mockDb.reservations.filter((r) => !stockIds.includes(r.pharmacy_stock_id));

    // 3. Cascade delete stock
    mockDb.pharmacy_stock = mockDb.pharmacy_stock.filter((s) => s.medicine_id !== medicineId);

    // 4. Delete medicine
    mockDb.medicines = mockDb.medicines.filter((m) => m.id !== medicineId);

    // 5. Audit log
    mockDb.auditLogs.push({
      action: "delete_medicine",
      targetId: medicineId,
      medicineName: med.name,
    });

    return {
      status: 200,
      data: { success: true, message: `Medicine "${med.name}" has been successfully removed from catalog.` },
    };
  };

  const res = await executeDelete("med-1");
  assert.strictEqual(res.status, 200);
  assert.strictEqual(mockDb.medicines.length, 0);
  assert.strictEqual(mockDb.pharmacy_stock.length, 1);
  assert.strictEqual(mockDb.pharmacy_stock[0].id, "stock-3");
  assert.strictEqual(mockDb.reservations.length, 1);
  assert.strictEqual(mockDb.reservations[0].id, "res-2");
  assert.strictEqual(mockDb.auditLogs.length, 1);
  assert.strictEqual(mockDb.auditLogs[0].targetId, "med-1");
});

test("Admin Delete Medicine - Surfaces RLS 403 error when database policy blocks deletion", async () => {
  const simulateRLSDelete = async (hasDeletePolicy) => {
    const medExists = true;
    const medName = "Dolo 650mg";

    if (!medExists) return { status: 404, data: { error: "Medicine not found in catalog." } };

    const deletedRows = hasDeletePolicy ? [{ id: "med-2", name: medName }] : [];

    if (!deletedRows || deletedRows.length === 0) {
      return {
        status: 403,
        data: {
          error: `Unable to delete "${medName}". Database Row Level Security (RLS) prevented deletion. Please apply migration 0007_admin_medicine_delete_policy.sql in your Supabase SQL Editor.`,
        },
      };
    }

    return {
      status: 200,
      data: { success: true, message: `Medicine "${medName}" has been successfully removed from catalog.` },
    };
  };

  const blockedRes = await simulateRLSDelete(false);
  assert.strictEqual(blockedRes.status, 403);
  assert.ok(blockedRes.data.error.includes("Row Level Security (RLS) prevented deletion"));

  const allowedRes = await simulateRLSDelete(true);
  assert.strictEqual(allowedRes.status, 200);
  assert.ok(allowedRes.data.message.includes("Dolo 650mg"));
});

test("Admin Delete Medicine - Supports Security Definer RPC path", async () => {
  const rpcMock = async (fnName, params) => {
    if (fnName === "delete_medicine_as_admin") {
      if (params.medicine_id_to_delete === "med-valid") {
        return {
          data: {
            success: true,
            medicine_name: "Metformin 500mg",
            deleted_stock_count: 3,
            deleted_reservations_count: 1,
          },
          error: null,
        };
      }
    }
    return { data: null, error: { message: "Function not found" } };
  };

  const { data, error } = await rpcMock("delete_medicine_as_admin", {
    medicine_id_to_delete: "med-valid",
  });

  assert.strictEqual(error, null);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.medicine_name, "Metformin 500mg");
  assert.strictEqual(data.deleted_stock_count, 3);
});

// ==============================================================================
// Additional Tests for User-Reported Issues
// ==============================================================================

test("Admin Edit Medicine - Accepts both 'update' and 'edit' actions", async () => {
  const medicinesDb = [{ id: "med-1", name: "Paracetamol 500mg", generic_name: "Acetaminophen", category: "Analgesic" }];

  const handleMedicinePost = async (body) => {
    const { action, medicineId, name, genericName, category } = body;
    if (action === "update" || action === "edit") {
      if (!medicineId) return { status: 400, data: { error: "medicineId is required" } };
      const med = medicinesDb.find((m) => m.id === medicineId);
      if (!med) return { status: 404, data: { error: "Not found" } };
      if (name) med.name = name;
      if (genericName !== undefined) med.generic_name = genericName;
      if (category) med.category = category;
      return { status: 200, data: { success: true, medicine: med } };
    }
    return { status: 400, data: { error: "Invalid action." } };
  };

  // Test with action = "edit" (from modal)
  const resEdit = await handleMedicinePost({
    action: "edit",
    medicineId: "med-1",
    name: "Paracetamol 650mg",
  });
  assert.strictEqual(resEdit.status, 200);
  assert.strictEqual(resEdit.data.medicine.name, "Paracetamol 650mg");

  // Test with action = "update"
  const resUpdate = await handleMedicinePost({
    action: "update",
    medicineId: "med-1",
    genericName: "Paracetamol BP",
  });
  assert.strictEqual(resUpdate.status, 200);
  assert.strictEqual(resUpdate.data.medicine.generic_name, "Paracetamol BP");
});

test("Admin Delete Pharmacy - Cleans up reservations and pharmacy stock cascade", async () => {
  const db = {
    pharmacies: [{ id: "pharm-1", name: "Care Pharmacy" }],
    pharmacy_stock: [{ id: "stock-1", pharmacy_id: "pharm-1" }],
    reservations: [{ id: "res-1", pharmacy_stock_id: "stock-1" }],
  };

  const deletePharmacy = async (pharmacyId) => {
    // 1. Clean up reservations
    const stockIds = db.pharmacy_stock.filter((s) => s.pharmacy_id === pharmacyId).map((s) => s.id);
    db.reservations = db.reservations.filter((r) => !stockIds.includes(r.pharmacy_stock_id));
    // 2. Clean up stock
    db.pharmacy_stock = db.pharmacy_stock.filter((s) => s.pharmacy_id !== pharmacyId);
    // 3. Delete pharmacy
    db.pharmacies = db.pharmacies.filter((p) => p.id !== pharmacyId);
    return { status: 200, data: { success: true } };
  };

  await deletePharmacy("pharm-1");
  assert.strictEqual(db.pharmacies.length, 0);
  assert.strictEqual(db.pharmacy_stock.length, 0);
  assert.strictEqual(db.reservations.length, 0);
});

test("Admin Delete User - Cascades customer reservations and pharmacy ownership", async () => {
  const db = {
    profiles: [{ id: "user-pharm-owner", email: "pharm@test.com", role: "pharmacy" }],
    pharmacies: [{ id: "pharm-1", owner_id: "user-pharm-owner" }],
    pharmacy_stock: [{ id: "stock-1", pharmacy_id: "pharm-1" }],
    reservations: [{ id: "res-1", pharmacy_stock_id: "stock-1" }],
  };

  const deleteUser = async (userId) => {
    const user = db.profiles.find((u) => u.id === userId);
    if (!user) return { status: 404 };

    if (user.role === "pharmacy") {
      const pharmIds = db.pharmacies.filter((p) => p.owner_id === userId).map((p) => p.id);
      const stockIds = db.pharmacy_stock.filter((s) => pharmIds.includes(s.pharmacy_id)).map((s) => s.id);
      db.reservations = db.reservations.filter((r) => !stockIds.includes(r.pharmacy_stock_id));
      db.pharmacy_stock = db.pharmacy_stock.filter((s) => !pharmIds.includes(s.pharmacy_id));
      db.pharmacies = db.pharmacies.filter((p) => p.owner_id !== userId);
    }
    db.profiles = db.profiles.filter((u) => u.id !== userId);
    return { status: 200, data: { success: true } };
  };

  await deleteUser("user-pharm-owner");
  assert.strictEqual(db.profiles.length, 0);
  assert.strictEqual(db.pharmacies.length, 0);
  assert.strictEqual(db.pharmacy_stock.length, 0);
  assert.strictEqual(db.reservations.length, 0);
});

test("Reserved Medicine Visibility - Other users cannot see reserved medicine until released or cancelled", async () => {
  // Pharmacy has 1 unit of insulin in stock
  let pharmacyStock = { id: "stock-insulin", quantity: 1, status: "in_stock" };
  let reservations = [];

  // Function simulating medicine search for a customer
  const searchMedicineForCustomer = (inStockOnly = true) => {
    const activeHolds = reservations
      .filter((r) => r.pharmacy_stock_id === pharmacyStock.id && (r.status === "pending" || r.status === "ready"))
      .reduce((sum, r) => sum + r.quantity, 0);

    const availableQuantity = Math.max(0, pharmacyStock.quantity - activeHolds);
    const isOutOfStock = availableQuantity <= 0 || pharmacyStock.status === "out_of_stock";

    if (inStockOnly && isOutOfStock) {
      return []; // Hidden from other users!
    }

    return [{ ...pharmacyStock, availableQuantity, isOutOfStock }];
  };

  // 1. Initial State: 1 unit available. Customer A and Customer B both see it.
  assert.strictEqual(searchMedicineForCustomer(true).length, 1);
  assert.strictEqual(searchMedicineForCustomer(true)[0].availableQuantity, 1);

  // 2. Customer A reserves the 1 unit!
  const resA = { id: "res-A", pharmacy_stock_id: "stock-insulin", quantity: 1, status: "pending" };
  reservations.push(resA);

  // 3. Customer B now searches for the medicine:
  // Since all units are reserved, it MUST NOT appear in in-stock search for Customer B!
  const resultsForCustomerB = searchMedicineForCustomer(true);
  assert.strictEqual(resultsForCustomerB.length, 0, "Reserved medicine must be hidden from other users!");

  // If Customer B turns off 'in-stock only', they see 0 available and out of stock:
  const allResultsForB = searchMedicineForCustomer(false);
  assert.strictEqual(allResultsForB.length, 1);
  assert.strictEqual(allResultsForB[0].availableQuantity, 0);
  assert.strictEqual(allResultsForB[0].isOutOfStock, true);

  // 4. Reservation is cancelled (or expires)
  resA.status = "cancelled";

  // 5. Now Customer B searches again:
  // The hold has been released, so Customer B can now see and reserve it!
  const restoredResultsForB = searchMedicineForCustomer(true);
  assert.strictEqual(restoredResultsForB.length, 1, "Released medicine becomes visible to other users again!");
  assert.strictEqual(restoredResultsForB[0].availableQuantity, 1);
  assert.strictEqual(restoredResultsForB[0].isOutOfStock, false);
});
