import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TOWNS,
  calculateDistanceKm,
  formatINR,
  formatDistanceKm,
  findClosestTown,
  resolvePharmacyCoordinates,
  isPharmacyInTown,
} from "../lib/locations.ts";

/**
 * Automated Test Suite: Location Filtering, Pharmacy Registration,
 * Indian Localization (INR & km), and Coordinates Resolution.
 */

// ==============================================================================
// 1. Indian Currency (INR: ₹) Formatting Tests
// ==============================================================================
test("INR Currency - Formats standard price values with ₹ symbol", () => {
  assert.strictEqual(formatINR(5), "₹5.00");
  assert.strictEqual(formatINR(10), "₹10.00");
  assert.strictEqual(formatINR(100), "₹100.00");
  assert.strictEqual(formatINR(1250.5), "₹1,250.50");
});

test("INR Currency - Formats zero and handles missing/NaN inputs gracefully", () => {
  assert.strictEqual(formatINR(0), "₹0.00");
  assert.strictEqual(formatINR(NaN), "₹0.00");
  assert.strictEqual(formatINR(null), "₹0.00");
});

// ==============================================================================
// 2. Kilometers (km) Distance Calculation Tests (Earth Radius = 6371 km)
// ==============================================================================
test("Distance - Calculates distance in Kilometers using Earth radius 6371 km", () => {
  // Valanchery (10.8878, 76.0732) to Perinthalmanna (10.9765, 76.2269)
  // Geodetic straight-line distance is ~19.5 km
  const distKm = calculateDistanceKm(10.8878, 76.0732, 10.9765, 76.2269);
  assert.ok(
    distKm > 18 && distKm < 21,
    `Calculated distance was ${distKm} km, expected ~19.5 km`
  );
});

test("Distance - Zero distance for identical coordinates", () => {
  const distKm = calculateDistanceKm(10.8878, 76.0732, 10.8878, 76.0732);
  assert.strictEqual(distKm, 0);
});

test("Distance - Formats kilometers in human-readable '1.2 km' format", () => {
  assert.strictEqual(formatDistanceKm(1.234), "1.2 km");
  assert.strictEqual(formatDistanceKm(19.54), "19.5 km");
  assert.strictEqual(formatDistanceKm(0), "0.0 km");
  assert.strictEqual(formatDistanceKm(NaN), "0.0 km");
});

// ==============================================================================
// 3. Towns Database & Dynamic Catalog Tests
// ==============================================================================
test("Towns Catalog - Contains key Kerala municipalities including Valanchery and Perinthalmanna", () => {
  const names = DEFAULT_TOWNS.map((t) => t.name);
  assert.ok(names.includes("Valanchery"), "Valanchery must be in town catalog");
  assert.ok(names.includes("Perinthalmanna"), "Perinthalmanna must be in town catalog");
  assert.ok(names.includes("Kuttippuram"), "Kuttippuram must be in town catalog");
  assert.ok(names.includes("Kottakkal"), "Kottakkal must be in town catalog");
  assert.ok(names.includes("Malappuram"), "Malappuram must be in town catalog");
  assert.ok(names.includes("Tirur"), "Tirur must be in town catalog");
});

test("Towns Catalog - All towns possess valid Kerala coordinates and districts", () => {
  for (const town of DEFAULT_TOWNS) {
    assert.ok(town.lat > 8 && town.lat < 13, `${town.name} latitude must be in Kerala`);
    assert.ok(town.lng > 74 && town.lng < 78, `${town.name} longitude must be in Kerala`);
    assert.ok(town.district, `${town.name} must specify district`);
    assert.strictEqual(town.state, "Kerala");
  }
});

// ==============================================================================
// 4. Missing Coordinate Resolution Tests (e.g. skpharmacy with null lat/lng)
// ==============================================================================
test("Coordinate Resolution - Preserves existing coordinates when valid", () => {
  const vCare = {
    name: "V Care",
    address: "Valanchery",
    lat: 10.8878,
    lng: 76.0732,
  };
  const resolved = resolvePharmacyCoordinates(vCare, DEFAULT_TOWNS);
  assert.strictEqual(resolved.lat, 10.8878);
  assert.strictEqual(resolved.lng, 76.0732);
});

test("Coordinate Resolution - Accurately infers coordinates for skpharmacy from Perinthalmanna address", () => {
  const skpharmacy = {
    name: "skpharmacy",
    address: "perinthalmanna,ootyroad",
    lat: null,
    lng: null,
  };
  const resolved = resolvePharmacyCoordinates(skpharmacy, DEFAULT_TOWNS);
  assert.strictEqual(resolved.lat, 10.9765, "Latitude must match Perinthalmanna");
  assert.strictEqual(resolved.lng, 76.2269, "Longitude must match Perinthalmanna");
});

test("Coordinate Resolution - Resolves by town_name or town_id when present", () => {
  const newPharm = {
    name: "Kuttippuram Meds",
    address: "Station Road",
    town_name: "Kuttippuram",
    lat: null,
    lng: null,
  };
  const resolved = resolvePharmacyCoordinates(newPharm, DEFAULT_TOWNS);
  assert.strictEqual(resolved.lat, 10.8407);
  assert.strictEqual(resolved.lng, 76.0331);
});

// ==============================================================================
// 5. Strict Town Location Filtering Tests
// ==============================================================================
test("Location Filtering - Selecting 'Perinthalmanna' includes skpharmacy and excludes V Care", () => {
  const vCare = {
    name: "V Care",
    address: "Valanchery",
    lat: 10.8878,
    lng: 76.0732,
  };
  const skpharmacy = {
    name: "skpharmacy",
    address: "perinthalmanna,ootyroad",
    lat: null,
    lng: null,
  };

  const skInPmna = isPharmacyInTown(skpharmacy, "Perinthalmanna", DEFAULT_TOWNS);
  const vCareInPmna = isPharmacyInTown(vCare, "Perinthalmanna", DEFAULT_TOWNS);

  assert.strictEqual(skInPmna, true, "skpharmacy must appear when Perinthalmanna is selected");
  assert.strictEqual(vCareInPmna, false, "V Care must NOT appear when Perinthalmanna is selected");
});

test("Location Filtering - Selecting 'Valanchery' includes V Care and excludes skpharmacy", () => {
  const vCare = {
    name: "V Care",
    address: "Valanchery",
    lat: 10.8878,
    lng: 76.0732,
  };
  const skpharmacy = {
    name: "skpharmacy",
    address: "perinthalmanna,ootyroad",
    lat: null,
    lng: null,
  };

  const vCareInVal = isPharmacyInTown(vCare, "Valanchery", DEFAULT_TOWNS);
  const skInVal = isPharmacyInTown(skpharmacy, "Valanchery", DEFAULT_TOWNS);

  assert.strictEqual(vCareInVal, true, "V Care must appear when Valanchery is selected");
  assert.strictEqual(skInVal, false, "skpharmacy must NOT appear when Valanchery is selected");
});

test("Location Filtering - 'all' or 'current' displays pharmacies across all towns", () => {
  const vCare = { name: "V Care", address: "Valanchery", lat: 10.8878, lng: 76.0732 };
  const skpharmacy = { name: "skpharmacy", address: "perinthalmanna", lat: 10.9765, lng: 76.2269 };

  assert.strictEqual(isPharmacyInTown(vCare, "all", DEFAULT_TOWNS), true);
  assert.strictEqual(isPharmacyInTown(skpharmacy, "all", DEFAULT_TOWNS), true);
  assert.strictEqual(isPharmacyInTown(vCare, "current", DEFAULT_TOWNS), true);
  assert.strictEqual(isPharmacyInTown(skpharmacy, "current", DEFAULT_TOWNS), true);
});

// ==============================================================================
// 6. Closest Town Snapping Tests
// ==============================================================================
test("Town Snapping - Snaps coordinates near Perinthalmanna accurately", () => {
  // Moulana hospital coordinates ~ (10.9760, 76.2270)
  const result = findClosestTown(10.9760, 76.2270, DEFAULT_TOWNS);
  assert.strictEqual(result.town.name, "Perinthalmanna");
  assert.ok(result.distanceKm < 1.0, "Distance to Perinthalmanna town center should be under 1 km");
});

test("Town Snapping - Snaps coordinates near Valanchery accurately", () => {
  // Valanchery bus stand coordinates ~ (10.8880, 76.0730)
  const result = findClosestTown(10.8880, 76.0730, DEFAULT_TOWNS);
  assert.strictEqual(result.town.name, "Valanchery");
  assert.ok(result.distanceKm < 0.5, "Distance to Valanchery town center should be under 0.5 km");
});

