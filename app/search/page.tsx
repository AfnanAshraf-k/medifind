"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/app/components/NavBar";
import {
  Town,
  DEFAULT_TOWNS,
  getTowns,
  calculateDistanceKm,
  findClosestTown,
  formatINR,
  formatDistanceKm,
  isPharmacyInTown,
  resolvePharmacyCoordinates,
} from "@/lib/locations";

// Dynamic import for Leaflet map with SSR disabled to prevent window is not defined
const PharmacyMap = dynamic(() => import("@/components/PharmacyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-2xl bg-surface-container-low flex flex-col items-center justify-center border border-outline-variant gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-body-sm text-on-surface-variant font-medium">Loading Interactive Kerala Map...</p>
    </div>
  ),
});

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  return d.toLocaleDateString();
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const searchQuery = searchParams.get("q") || "";
  const paramLat = searchParams.get("lat");
  const paramLng = searchParams.get("lng");
  const paramTown = searchParams.get("town");
  const mode = searchParams.get("mode") || "medicine";

  // Towns list from database
  const [towns, setTowns] = useState<Town[]>(DEFAULT_TOWNS);

  // Auth User state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // View state: list or interactive map
  const [view, setView] = useState<"list" | "map">("list");

  // Reservation states
  const [selectedItemToReserve, setSelectedItemToReserve] = useState<any>(null);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [reservingStatus, setReservingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reservingError, setReservingError] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);

  // Filters state (distances in km, prices in INR ₹)
  const [inStockOnly, setInStockOnly] = useState(true);
  const [maxDistance, setMaxDistance] = useState(25); // 25 km default
  const [maxPrice, setMaxPrice] = useState(1000); // ₹1,000 default
  const [openNow, setOpenNow] = useState(false);
  const [twentyFourHours, setTwentyFourHours] = useState(false);
  const [driveThru, setDriveThru] = useState(false);

  // Search input state
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Data states
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ lat: 10.8878, lng: 76.0732 }); // Default Valanchery
  const [locationLabel, setLocationLabel] = useState("Valanchery Town Center (Default)");
  const [selectedTownFilter, setSelectedTownFilter] = useState<string>("all"); // "all", "current", or town name

  // Fetch dynamic towns from DB
  useEffect(() => {
    async function loadTownsList() {
      try {
        const res = await fetch("/api/towns");
        if (res.ok) {
          const json = await res.json();
          if (json.towns && json.towns.length > 0) {
            setTowns(json.towns);
          }
        }
      } catch (err) {
        // Fallback to DEFAULT_TOWNS
      }
    }
    loadTownsList();
  }, []);

  // Get current user session
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    getUser();
  }, [supabase]);

  // Handle Initial Location (from URL query or browser GPS)
  useEffect(() => {
    if (paramLat && paramLng) {
      const lat = parseFloat(paramLat);
      const lng = parseFloat(paramLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserLocation({ lat, lng });
        if (paramTown) {
          setLocationLabel(paramTown);
          setSelectedTownFilter(paramTown.replace(/^Near\s+/i, ""));
        } else {
          const { town } = findClosestTown(lat, lng, towns);
          setLocationLabel(`Near ${town.name}`);
          setSelectedTownFilter(town.name);
        }
      }
    } else if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const { town, distanceKm } = findClosestTown(userLat, userLng, towns);
          setUserLocation({ lat: userLat, lng: userLng });
          setLocationLabel(`Near ${town.name} (${distanceKm.toFixed(1)} km via GPS)`);
          setSelectedTownFilter("current");
        },
        () => {
          setLocationLabel("Valanchery Town Center (Default)");
          setSelectedTownFilter("all");
        }
      );
    }
  }, [paramLat, paramLng, paramTown, towns]);

  // Fetch and filter results
  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
        let data: any[] = [];
        let queryError: any = null;

        if (mode === "pharmacy") {
          let query = supabase
            .from("pharmacies")
            .select("*")
            .eq("status", "approved")
            .eq("is_suspended", false);

          if (searchQuery) {
            query = query.ilike("name", `%${searchQuery}%`);
          }
          const { data: rawData, error } = await query;
          queryError = error;
          if (!error) {
            data = (rawData || []).map((pharmacy: any) => ({
              id: pharmacy.id,
              pharmacy: pharmacy,
              price: 0,
              status: "in_stock",
              updated_at: pharmacy.created_at,
            }));
          }
        } else {
          let query = supabase
            .from("pharmacy_stock")
            .select(`
              id,
              quantity,
              price,
              status,
              updated_at,
              pharmacy:pharmacies!inner(*),
              medicine:medicines!inner(*)
            `)
            .eq("pharmacy.status", "approved")
            .eq("pharmacy.is_suspended", false);

          if (inStockOnly) {
            query = query.neq("status", "out_of_stock");
          }

          query = query.lte("price", maxPrice);

          const { data: rawData, error } = await query;
          queryError = error;
          if (!error) {
            data = rawData || [];
          }
        }

        if (queryError) {
          console.error("Search query error:", queryError);
          setResults([]);
        } else {
          // Fetch active reservations to hold stock so reserved medicines are hidden from other users
          const activeResMap: Record<string, number> = {};
          try {
            const { data: activeRes } = await supabase
              .from("reservations")
              .select("pharmacy_stock_id, quantity")
              .in("status", ["pending", "ready"]);

            (activeRes || []).forEach((r: any) => {
              activeResMap[r.pharmacy_stock_id] = (activeResMap[r.pharmacy_stock_id] || 0) + (r.quantity || 1);
            });
          } catch (resErr) {
            console.warn("Active reservations fetch error:", resErr);
          }

          // Process coordinates, distances, and active reservation holds
          let processed = (data || []).map((item: any) => {
            const resolvedCoords = resolvePharmacyCoordinates(item.pharmacy, towns);
            const dist = calculateDistanceKm(
              userLocation.lat,
              userLocation.lng,
              resolvedCoords.lat,
              resolvedCoords.lng
            );

            // Deduct active reservation holds so reserved medicines are hidden from other users
            const activeHolds = activeResMap[item.id] || 0;
            const liveQty = Math.max(0, item.quantity - activeHolds);
            const isOutOfStock = liveQty <= 0 || item.status === "out_of_stock";

            return {
              ...item,
              quantity: liveQty,
              status: isOutOfStock ? "out_of_stock" : item.status,
              pharmacy: {
                ...item.pharmacy,
                lat: resolvedCoords.lat,
                lng: resolvedCoords.lng,
              },
              distance: dist,
            };
          });

          // Medicine search query matching across brand name, generic formula, category, and pharmacy
          if (searchQuery) {
            const qLower = searchQuery.toLowerCase().trim();
            processed = processed.filter((item) => {
              if (mode === "pharmacy") {
                return (
                  item.pharmacy?.name?.toLowerCase().includes(qLower) ||
                  item.pharmacy?.address?.toLowerCase().includes(qLower)
                );
              }
              const medName = item.medicine?.name?.toLowerCase() || "";
              const genName = item.medicine?.generic_name?.toLowerCase() || "";
              const catName = item.medicine?.category?.toLowerCase() || "";
              const pharmName = item.pharmacy?.name?.toLowerCase() || "";
              return (
                medName.includes(qLower) ||
                genName.includes(qLower) ||
                catName.includes(qLower) ||
                pharmName.includes(qLower)
              );
            });
          }

          // If inStockOnly is selected, exclude out-of-stock and reserved items
          if (inStockOnly) {
            processed = processed.filter(
              (item) => item.quantity > 0 && item.status !== "out_of_stock"
            );
          }

          // 1. Strict Town Filtering:
          // If user specifically selects a town (e.g. "Perinthalmanna" or "Valanchery"),
          // show only pharmacies in that town!
          if (
            selectedTownFilter &&
            selectedTownFilter !== "all" &&
            selectedTownFilter !== "current"
          ) {
            processed = processed.filter((item) =>
              isPharmacyInTown(item.pharmacy, selectedTownFilter, towns)
            );
          }

          // 2. Filter by max distance in km
          processed = processed.filter((item) => item.distance <= maxDistance);

          // 3. Filter by Open Now
          if (openNow) {
            processed = processed.filter((item) => item.pharmacy.is_open);
          }

          // 4. Filter by 24h / drive-thru
          if (twentyFourHours) {
            processed = processed.filter(
              (item) =>
                item.pharmacy.name?.toLowerCase().includes("24/7") ||
                item.pharmacy.name?.toLowerCase().includes("clinical") ||
                item.pharmacy.hours?.is_24_hours
            );
          }
          if (driveThru) {
            processed = processed.filter(
              (item) =>
                item.pharmacy.name?.toLowerCase().includes("central") ||
                item.pharmacy.name?.toLowerCase().includes("express")
            );
          }

          // Sort by distance (closest first in km)
          processed.sort((a, b) => a.distance - b.distance);

          setResults(processed);
        }
      } catch (err) {
        console.error("Error processing search:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [
    searchQuery,
    mode,
    inStockOnly,
    maxDistance,
    maxPrice,
    openNow,
    twentyFourHours,
    driveThru,
    userLocation,
    selectedTownFilter,
    towns,
    supabase,
  ]);

  // Handle Location Switcher (Town selection or GPS)
  const handleLocationChange = (filterVal: string) => {
    setSelectedTownFilter(filterVal);

    if (filterVal === "all") {
      setLocationLabel("All Kerala Towns (Showing Nearest First)");
      return;
    }

    if (filterVal === "current") {
      if (typeof window !== "undefined" && navigator.geolocation) {
        setLocationLabel("Detecting GPS...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const { town, distanceKm } = findClosestTown(userLat, userLng, towns);
            setUserLocation({ lat: userLat, lng: userLng });
            setLocationLabel(`Near ${town.name} (${distanceKm.toFixed(1)} km via GPS)`);
          },
          () => {
            setUserLocation({ lat: 10.8878, lng: 76.0732 });
            setLocationLabel("Valanchery Town Center (Default)");
          }
        );
      } else {
        setUserLocation({ lat: 10.8878, lng: 76.0732 });
        setLocationLabel("Valanchery Town Center (Default)");
      }
      return;
    }

    // Specific town selected (Valanchery, Perinthalmanna, Kuttippuram, etc.)
    const matchedTown = towns.find(
      (t) => t.name.toLowerCase() === filterVal.toLowerCase()
    );
    if (matchedTown) {
      setUserLocation({ lat: matchedTown.lat, lng: matchedTown.lng });
      setLocationLabel(`${matchedTown.name} Municipality`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = `/search?q=${encodeURIComponent(searchInput)}&mode=${mode}`;
    if (selectedTownFilter && selectedTownFilter !== "all") {
      url += `&town=${encodeURIComponent(selectedTownFilter)}`;
    }
    if (paramLat && paramLng) {
      url += `&lat=${paramLat}&lng=${paramLng}`;
    }
    router.push(url);
  };

  const handleClearFilters = () => {
    setInStockOnly(false);
    setMaxDistance(30);
    setMaxPrice(2000);
    setOpenNow(false);
    setTwentyFourHours(false);
    setDriveThru(false);
    setSelectedTownFilter("all");
    setLocationLabel("All Kerala Towns (Showing Nearest First)");
  };

  const handleConfirmReservation = async () => {
    if (!currentUser) {
      router.push("/login?redirect=/search");
      return;
    }

    setReservingStatus("loading");
    setReservingError("");

    try {
      let rxUrl: string | null = null;
      if (prescriptionFile) {
        try {
          const fileExt = prescriptionFile.name.split(".").pop() || "png";
          const filePath = `${currentUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("prescriptions")
            .upload(filePath, prescriptionFile);

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabase.storage
              .from("prescriptions")
              .getPublicUrl(filePath);
            rxUrl = publicUrlData.publicUrl;
          }
        } catch (uploadErr) {
          console.warn("Prescription upload error (proceeding without URL):", uploadErr);
        }
      }

      const { error } = await supabase.from("reservations").insert({
        user_id: currentUser.id,
        pharmacy_stock_id: selectedItemToReserve.id,
        quantity: reserveQuantity,
        status: "pending",
        prescription_url: rxUrl,
      });

      if (error) {
        setReservingStatus("error");
        setReservingError(error.message);
      } else {
        setReservingStatus("success");

        // Immediately hold stock and remove from active list if inStockOnly
        const newQty = Math.max(0, (selectedItemToReserve.quantity || 1) - reserveQuantity);
        const newStatus = newQty <= 0 ? "out_of_stock" : selectedItemToReserve.status;

        setResults((prev) =>
          prev
            .map((item) =>
              item.id === selectedItemToReserve.id
                ? { ...item, quantity: newQty, status: newStatus }
                : item
            )
            .filter((item) => (inStockOnly ? item.quantity > 0 && item.status !== "out_of_stock" : true))
        );

        setTimeout(() => {
          setSelectedItemToReserve(null);
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err: any) {
      setReservingStatus("error");
      setReservingError(err.message || "Failed to submit reservation.");
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow max-w-max-width w-full mx-auto px-margin-mobile md:px-margin-desktop py-lg">
        {/* Prominent Medicine Search Bar Header */}
        <div className="mb-8 bg-white border border-outline-variant p-2 md:p-3 rounded-2xl shadow-sm">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch gap-2">
            <div className="flex-grow flex items-center px-4 gap-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-outline">search</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search medicine by brand name or formula (e.g. Paracetamol, Dolo 650, Amoxicillin, Insulin)..."
                className="w-full border-none focus:ring-0 bg-transparent py-3.5 text-body-md placeholder:text-outline text-on-surface outline-none"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    router.push(`/search?q=&town=${encodeURIComponent(selectedTownFilter)}&mode=${mode}`);
                  }}
                  className="text-outline hover:text-on-surface p-1 rounded-full transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            {/* Quick Town Filter Selector */}
            <div className="flex items-center px-4 py-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
              <span className="material-symbols-outlined text-primary text-base mr-2">location_on</span>
              <select
                value={selectedTownFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  handleLocationChange(val);
                  let url = `/search?q=${encodeURIComponent(searchInput)}&town=${encodeURIComponent(val)}&mode=${mode}`;
                  router.push(url);
                }}
                className="bg-transparent border-none text-body-sm font-medium text-on-surface focus:ring-0 outline-none cursor-pointer pr-3"
              >
                <option value="all">All Kerala Towns</option>
                <option value="current">Current Location</option>
                {towns.map((t) => (
                  <option key={t.id || t.name} value={t.name}>
                    {t.name} ({t.district})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-headline-sm hover:bg-primary/90 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-bold whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">search</span>
              Search Medicine
            </button>
          </form>
        </div>

        {/* Search header & mode tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-xl">
          <div className="w-full md:w-auto">
            <h1 className="text-display font-display text-on-surface mb-xs">
              {mode === "pharmacy" ? "Registered Pharmacies in Kerala" : "Available Medications"}
            </h1>
            <p className="text-body-md text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              <span>{locationLabel}</span>
              <span className="text-outline mx-1">•</span>
              <span>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
            </p>
          </div>

          {/* View toggle (List vs Interactive OpenStreetMap) */}
          <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-full border border-outline-variant w-full md:w-auto justify-center">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all cursor-pointer ${
                view === "list"
                  ? "bg-white text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">list</span> List View
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all cursor-pointer ${
                view === "map"
                  ? "bg-white text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-base">map</span> Interactive Map
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-xl">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-xl">
            <section className="bg-white p-lg rounded-xl border border-outline-variant shadow-sm">
              <h2 className="text-label-md text-on-surface uppercase tracking-wider mb-md font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">tune</span>
                Location & Filters
              </h2>

              {/* Dynamic Database Town / City Selector */}
              <div className="mb-lg border-b border-outline-variant pb-md">
                <span className="font-label-md text-on-surface block mb-sm font-semibold">
                  Select Town / Municipality
                </span>
                <select
                  className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest text-on-surface text-body-sm mb-2 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer font-medium"
                  value={selectedTownFilter}
                  onChange={(e) => handleLocationChange(e.target.value)}
                >
                  <option value="all">🌐 All Kerala Towns (Nearest First)</option>
                  <option value="current">📍 Current Location (GPS Snapped)</option>
                  <optgroup label="Kerala Municipal Hubs">
                    {towns.map((town) => (
                      <option key={town.id} value={town.name}>
                        🇮🇳 {town.name} ({town.district})
                      </option>
                    ))}
                  </optgroup>
                </select>

                <div className="text-[11px] text-on-surface-variant font-mono bg-surface-container-low p-2 rounded border border-outline-variant/30 leading-relaxed">
                  <p className="truncate"><span className="font-bold">Active:</span> {locationLabel}</p>
                  <p><span className="font-bold">GPS Center:</span> {userLocation.lat.toFixed(4)}° N, {userLocation.lng.toFixed(4)}° E</p>
                </div>
              </div>

              {mode !== "pharmacy" && (
                <div className="mb-lg">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer"
                      type="checkbox"
                    />
                    <span className="text-body-md text-on-surface group-hover:text-primary transition-colors font-medium">
                      In Stock Only
                    </span>
                  </label>
                </div>
              )}

              <div className="space-y-lg">
                <div>
                  <div className="flex justify-between items-center mb-sm">
                    <span className="font-label-md text-on-surface font-semibold">Distance Radius</span>
                    <span className="text-label-sm text-primary font-bold">{maxDistance} km</span>
                  </div>
                  <input
                    className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-full cursor-pointer"
                    max="50"
                    min="1"
                    type="range"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                {mode !== "pharmacy" && (
                  <div>
                    <div className="flex justify-between items-center mb-sm">
                      <span className="font-label-md text-on-surface font-semibold">Max Price</span>
                      <span className="text-label-sm text-primary font-bold">{formatINR(maxPrice)}</span>
                    </div>
                    <input
                      className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-full cursor-pointer"
                      max="2000"
                      min="20"
                      step="20"
                      type="range"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    />
                    <div className="flex justify-between text-[10px] text-on-surface-variant mt-1">
                      <span>₹20</span>
                      <span>₹1,000</span>
                      <span>₹2,000</span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="font-label-md text-on-surface block mb-sm font-semibold">Pharmacy Features</span>
                  <div className="space-y-base">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        checked={openNow}
                        onChange={(e) => setOpenNow(e.target.checked)}
                        className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer"
                        type="checkbox"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">
                        Open Now
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        checked={twentyFourHours}
                        onChange={(e) => setTwentyFourHours(e.target.checked)}
                        className="w-5 h-5 rounded border-outline text-primary focus:ring-primary cursor-pointer"
                        type="checkbox"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">
                        24-Hour Emergency Access
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearFilters}
                className="w-full mt-xl py-2.5 border border-primary text-primary rounded-lg font-label-md hover:bg-surface-container transition-all cursor-pointer font-semibold"
              >
                Clear All Filters
              </button>
            </section>
          </aside>

          {/* Results List View */}
          <div className={`flex-grow space-y-md ${view !== "list" ? "hidden" : ""}`}>
            {loading ? (
              <div className="text-center py-20 text-on-surface-variant flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p>Searching certified pharmacy stocks in Kerala...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-outline-variant p-8">
                <span className="material-symbols-outlined text-outline text-6xl mb-md">location_off</span>
                <h3 className="text-headline-md text-on-surface font-bold">No pharmacies found</h3>
                <p className="text-body-md text-on-surface-variant mt-sm max-w-sm">
                  No registered pharmacies matched{" "}
                  <strong>"{selectedTownFilter !== "all" ? selectedTownFilter : "your filters"}"</strong>{" "}
                  within {maxDistance} km. Try choosing "All Kerala Towns" or expanding your search radius.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md hover:bg-primary/90 transition-all"
                >
                  Show All Nearby Pharmacies
                </button>
              </div>
            ) : (
              results.map((item) => {
                const pharmacy = item.pharmacy;
                const medicine = item.medicine;

                return (
                  <div
                    key={item.id}
                    className="bg-white p-lg rounded-2xl border border-outline-variant hover:border-primary transition-all shadow-sm flex flex-col md:flex-row gap-lg"
                  >
                    <div className="w-full md:w-36 h-36 bg-surface-container-high rounded-xl overflow-hidden flex-shrink-0 relative">
                      <img
                        className="w-full h-full object-cover"
                        alt={pharmacy.name}
                        src={
                          pharmacy.image_url ||
                          "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80"
                        }
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                        {formatDistanceKm(item.distance)}
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-md">
                          <div>
                            <h3 className="text-title-lg font-bold text-on-surface hover:text-primary transition-colors">
                              <Link href={`/pharmacy/${pharmacy.id}`}>{pharmacy.name}</Link>
                            </h3>
                            <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-sm text-outline">location_on</span>
                              <span>{pharmacy.address || "Kerala, India"}</span>
                            </p>
                          </div>
                          {mode !== "pharmacy" && (
                            <div className="text-right">
                              <span className="text-headline-md text-primary font-bold">
                                {formatINR(item.price)}
                              </span>
                              <p className="text-label-sm text-on-surface-variant">Per unit</p>
                            </div>
                          )}
                        </div>

                        {mode !== "pharmacy" && medicine && (
                          <div className="mt-3 p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/40 flex items-center justify-between">
                            <div>
                              <p className="text-body-md font-semibold text-on-surface">{medicine.name}</p>
                              <p className="text-body-xs text-on-surface-variant">
                                {medicine.generic_name || "Prescription item"} • {medicine.category || "General"}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1 ${
                                item.status === "in_stock"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "low_stock"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  item.status === "in_stock"
                                    ? "bg-green-600"
                                    : item.status === "low_stock"
                                    ? "bg-amber-600"
                                    : "bg-red-600"
                                }`}
                              ></span>
                              {item.status === "in_stock"
                                ? "In Stock"
                                : item.status === "low_stock"
                                ? `Low Stock (${item.quantity})`
                                : "Out of Stock"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3 text-body-xs text-on-surface-variant">
                          <span className="font-semibold text-primary">
                            📍 {formatDistanceKm(item.distance)} away
                          </span>
                          <span>•</span>
                          <span>Updated {formatTime(item.updated_at || pharmacy.created_at)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.lat},${pharmacy.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-semibold text-on-surface hover:bg-surface-container transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">directions</span>
                            Directions
                          </a>

                          {mode !== "pharmacy" ? (
                            <button
                              onClick={() => {
                                if (!currentUser) {
                                  router.push(`/login?redirect=/search?q=${encodeURIComponent(searchQuery)}`);
                                } else {
                                  setSelectedItemToReserve(item);
                                  setReserveQuantity(1);
                                  setReservingStatus("idle");
                                }
                              }}
                              className="px-5 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                              Reserve Medicine
                            </button>
                          ) : (
                            <Link
                              href={`/pharmacy/${pharmacy.id}`}
                              className="px-5 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                            >
                              View Catalog
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Interactive OpenStreetMap View */}
          <div className={`flex-grow min-h-[620px] ${view !== "map" ? "hidden" : "block"}`}>
            <PharmacyMap
              userLocation={userLocation}
              locationLabel={locationLabel}
              results={results}
              mode={mode}
              towns={towns}
              onSelectReserve={(item) => {
                if (!currentUser) {
                  router.push(`/login?redirect=/search?q=${encodeURIComponent(searchQuery)}`);
                } else {
                  setSelectedItemToReserve(item);
                  setReserveQuantity(1);
                  setReservingStatus("idle");
                }
              }}
              onSelectTown={(town) => {
                setUserLocation({ lat: town.lat, lng: town.lng });
                setLocationLabel(`${town.name} Municipality`);
                setSelectedTownFilter(town.name);
              }}
            />
          </div>
        </div>
      </main>

      {/* Reservation Confirmation Modal */}
      {selectedItemToReserve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg border border-outline-variant shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-on-surface">
            <h3 className="text-headline-md font-bold mb-sm">Confirm Reservation</h3>
            <p className="text-body-md text-on-surface-variant mb-md">
              You are reserving <span className="font-semibold text-on-surface">{selectedItemToReserve.medicine?.name}</span> from <span className="font-semibold text-on-surface">{selectedItemToReserve.pharmacy.name}</span>.
            </p>

            <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/50 mb-md space-y-sm">
              <div className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant">Price per unit:</span>
                <span className="font-semibold text-on-surface">{formatINR(selectedItemToReserve.price)}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={reserveQuantity <= 1}
                    onClick={() => setReserveQuantity((q) => q - 1)}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high disabled:opacity-50 font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-semibold text-on-surface px-2 w-6 text-center">{reserveQuantity}</span>
                  <button
                    disabled={reserveQuantity >= selectedItemToReserve.quantity}
                    onClick={() => setReserveQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high disabled:opacity-50 font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="border-t border-outline-variant/30 pt-sm mt-sm flex justify-between text-body-md font-bold">
                <span className="text-on-surface">Total Estimated:</span>
                <span className="text-primary">{formatINR(selectedItemToReserve.price * reserveQuantity)}</span>
              </div>
            </div>

            {/* Prescription Upload Section */}
            <div className="mb-md">
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">description</span>
                Attach Prescription (Optional)
              </label>
              {prescriptionFile ? (
                <div className="p-sm bg-surface-container rounded-xl border border-outline-variant text-body-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <span className="truncate max-w-[200px] font-medium text-on-surface">{prescriptionFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPrescriptionFile(null);
                        setPrescriptionPreview(null);
                      }}
                      className="text-red-600 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  {prescriptionPreview && (
                    <div className="mt-2 relative rounded-lg overflow-hidden border border-outline-variant/50 max-h-32 bg-black/5 flex items-center justify-center">
                      <img src={prescriptionPreview} alt="Prescription Preview" className="max-h-32 object-contain" />
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-outline-variant hover:border-primary rounded-xl cursor-pointer bg-surface-container-lowest transition-all hover:bg-primary-fixed/20 text-center group">
                  <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">upload_file</span>
                  <span className="text-body-xs font-semibold text-on-surface mt-1">Upload Rx (.png, .jpg, .pdf)</span>
                  <span className="text-[11px] text-on-surface-variant">Required for restricted medicines</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPrescriptionFile(file);
                        if (file.type.startsWith("image/")) {
                          setPrescriptionPreview(URL.createObjectURL(file));
                        } else {
                          setPrescriptionPreview(null);
                        }
                      }
                    }}
                  />
                </label>
              )}
            </div>

            {reservingStatus === "success" && (
              <div className="mb-md p-md bg-green-50 text-green-700 text-body-sm rounded-xl border border-green-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>Reservation placed successfully! Redirecting...</span>
              </div>
            )}

            {reservingStatus === "error" && (
              <div className="mb-md p-md bg-red-50 text-red-700 text-body-sm rounded-xl border border-red-200 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span className="truncate">{reservingError}</span>
              </div>
            )}

            <div className="flex gap-md">
              <button
                disabled={reservingStatus === "loading" || reservingStatus === "success"}
                onClick={() => setSelectedItemToReserve(null)}
                className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container transition-all font-label-md active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={reservingStatus === "loading" || reservingStatus === "success"}
                onClick={handleConfirmReservation}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary/95 transition-all font-label-md active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                {reservingStatus === "loading" ? "Reserving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full mt-xl bg-surface-container-highest">
        <div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex flex-col md:items-start items-center">
            <span className="text-label-md font-label-md font-bold text-on-surface">MediFind</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              © 2026 MediFind Clinical Solutions. All rights reserved.
            </p>
          </div>
          <div className="flex gap-lg flex-wrap justify-center">
            <Link className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="/support">
              Privacy Policy
            </Link>
            <Link className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="/support">
              Terms of Service
            </Link>
            <Link className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="/support">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading search interface...</div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
