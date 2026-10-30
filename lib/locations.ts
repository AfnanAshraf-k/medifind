import { SupabaseClient } from "@supabase/supabase-js";

export interface Town {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  is_active?: boolean;
}

/**
 * Canonical Towns list for Malappuram district & Kerala healthcare hubs.
 * Used as reliable fallback and database seed reference.
 */
export const DEFAULT_TOWNS: Town[] = [
  {
    id: "town-valanchery",
    name: "Valanchery",
    district: "Malappuram",
    state: "Kerala",
    lat: 10.8878,
    lng: 76.0732,
    is_active: true,
  },
  {
    id: "town-perinthalmanna",
    name: "Perinthalmanna",
    district: "Malappuram",
    state: "Kerala",
    lat: 10.9765,
    lng: 76.2269,
    is_active: true,
  },
  {
    id: "town-kuttippuram",
    name: "Kuttippuram",
    district: "Malappuram",
    state: "Kerala",
    lat: 10.8407,
    lng: 76.0331,
    is_active: true,
  },
  {
    id: "town-kottakkal",
    name: "Kottakkal",
    district: "Malappuram",
    state: "Kerala",
    lat: 10.9992,
    lng: 75.9926,
    is_active: true,
  },
  {
    id: "town-malappuram",
    name: "Malappuram",
    district: "Malappuram",
    state: "Kerala",
    lat: 11.0735,
    lng: 76.0740,
    is_active: true,
  },
  {
    id: "town-tirur",
    name: "Tirur",
    district: "Malappuram",
    state: "Kerala",
    lat: 10.9027,
    lng: 75.9238,
    is_active: true,
  },
  {
    id: "town-manjeri",
    name: "Manjeri",
    district: "Malappuram",
    state: "Kerala",
    lat: 11.1215,
    lng: 76.1210,
    is_active: true,
  },
  {
    id: "town-ponnani",
    name: "Ponnani",
    district: "Malappuram",
    state: "Kerala",
    lat: 10.7766,
    lng: 75.9264,
    is_active: true,
  },
];

/**
 * Calculates great-circle distance between two coordinates in Kilometers (km)
 * using the standard Haversine formula with Earth radius = 6371 km.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }

  const R = 6371; // Radius of Earth in Kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats monetary value in Indian Rupees (INR)
 * Example: 100 -> "₹100.00" or "₹100"
 */
export function formatINR(amount: number, showDecimals: boolean = true): string {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0.00";
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats distance in kilometers (km)
 * Example: 1.234 -> "1.2 km"
 */
export function formatDistanceKm(distance: number): string {
  if (typeof distance !== "number" || isNaN(distance)) return "0.0 km";
  return `${distance.toFixed(1)} km`;
}

/**
 * Finds the nearest town from a list of towns for given GPS coordinates.
 */
export function findClosestTown(
  userLat: number,
  userLng: number,
  townList: Town[] = DEFAULT_TOWNS
): { town: Town; distanceKm: number } {
  const towns = townList.length > 0 ? townList : DEFAULT_TOWNS;
  let closestTown = towns[0];
  let minDistance = Infinity;

  for (const town of towns) {
    const d = calculateDistanceKm(userLat, userLng, town.lat, town.lng);
    if (d < minDistance) {
      minDistance = d;
      closestTown = town;
    }
  }

  return { town: closestTown, distanceKm: minDistance };
}

/**
 * Resolves valid latitude and longitude coordinates for a pharmacy.
 * If coordinates are missing or null in the database (e.g. skpharmacy),
 * it scans town_name, town_id, or address to infer the correct town coordinates.
 */
export function resolvePharmacyCoordinates(
  pharmacy: {
    lat?: number | null;
    lng?: number | null;
    address?: string | null;
    town_name?: string | null;
    town_id?: string | null;
  },
  townList: Town[] = DEFAULT_TOWNS
): { lat: number; lng: number; resolvedFromTown?: string } {
  // 1. If valid numeric coordinates already exist
  if (
    typeof pharmacy.lat === "number" &&
    !isNaN(pharmacy.lat) &&
    typeof pharmacy.lng === "number" &&
    !isNaN(pharmacy.lng) &&
    pharmacy.lat !== 0 &&
    pharmacy.lng !== 0
  ) {
    return { lat: pharmacy.lat, lng: pharmacy.lng };
  }

  const towns = townList.length > 0 ? townList : DEFAULT_TOWNS;

  // 2. Try match by town_name or town_id
  if (pharmacy.town_name) {
    const matched = towns.find(
      (t) => t.name.toLowerCase() === pharmacy.town_name?.toLowerCase()
    );
    if (matched) {
      return { lat: matched.lat, lng: matched.lng, resolvedFromTown: matched.name };
    }
  }

  if (pharmacy.town_id) {
    const matched = towns.find((t) => t.id === pharmacy.town_id);
    if (matched) {
      return { lat: matched.lat, lng: matched.lng, resolvedFromTown: matched.name };
    }
  }

  // 3. Try match from address text (e.g. "perinthalmanna,ootyroad")
  if (pharmacy.address) {
    const addr = pharmacy.address.toLowerCase();
    for (const town of towns) {
      if (addr.includes(town.name.toLowerCase())) {
        return { lat: town.lat, lng: town.lng, resolvedFromTown: town.name };
      }
    }
  }

  // 4. Default fallback to Valanchery (primary hub)
  return { lat: 10.8878, lng: 76.0732, resolvedFromTown: "Valanchery (Default)" };
}

/**
 * Checks whether a pharmacy belongs to a specific town.
 * Supports exact town_name matching, address containment, and distance boundary.
 */
export function isPharmacyInTown(
  pharmacy: {
    address?: string | null;
    town_name?: string | null;
    town_id?: string | null;
    lat?: number | null;
    lng?: number | null;
  },
  selectedTownName: string,
  townList: Town[] = DEFAULT_TOWNS
): boolean {
  if (
    !selectedTownName ||
    selectedTownName === "all" ||
    selectedTownName.toLowerCase().includes("all") ||
    selectedTownName.toLowerCase().includes("current")
  ) {
    return true;
  }

  const normTarget = selectedTownName.trim().toLowerCase();

  // Match by town_name
  if (pharmacy.town_name && pharmacy.town_name.trim().toLowerCase() === normTarget) {
    return true;
  }

  // Match by address text
  if (pharmacy.address && pharmacy.address.toLowerCase().includes(normTarget)) {
    return true;
  }

  // Match by proximity to the target town (e.g. within 12 km municipal perimeter)
  const towns = townList.length > 0 ? townList : DEFAULT_TOWNS;
  const targetTown = towns.find((t) => t.name.toLowerCase() === normTarget);
  if (targetTown) {
    const coords = resolvePharmacyCoordinates(pharmacy, towns);
    const dist = calculateDistanceKm(targetTown.lat, targetTown.lng, coords.lat, coords.lng);
    // If pharmacy coordinates are within 10 km of target town center
    if (dist <= 10) {
      return true;
    }
  }

  return false;
}

/**
 * Fetches towns dynamically from Supabase database `towns` table.
 * Deduplicates and falls back gracefully to DEFAULT_TOWNS if table is not yet created.
 */
export async function getTowns(supabase?: SupabaseClient | null): Promise<Town[]> {
  if (!supabase) {
    return DEFAULT_TOWNS;
  }

  try {
    const { data, error } = await supabase
      .from("towns")
      .select("id, name, district, state, lat, lng, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      // Deduplicate by lowercase town name
      const seen = new Set<string>();
      const deduped: Town[] = [];
      for (const item of data) {
        const key = item.name.trim().toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push({
            id: item.id || `town-${key}`,
            name: item.name.trim(),
            district: item.district || "Malappuram",
            state: item.state || "Kerala",
            lat: typeof item.lat === "number" ? item.lat : 10.8878,
            lng: typeof item.lng === "number" ? item.lng : 76.0732,
            is_active: item.is_active !== false,
          });
        }
      }
      return deduped;
    }
  } catch (err) {
    console.warn("Could not query 'towns' table from database, using fallback towns:", err);
  }

  return DEFAULT_TOWNS;
}

