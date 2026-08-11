"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
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

  // Auth User state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // View state
  const [view, setView] = useState<"list" | "map">("list");

  // Reservation states
  const [selectedItemToReserve, setSelectedItemToReserve] = useState<any>(null);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [reservingStatus, setReservingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reservingError, setReservingError] = useState("");

  // Get current user session
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    getUser();
  }, [supabase]);

  // Filters state
  const [inStockOnly, setInStockOnly] = useState(true);
  const [maxDistance, setMaxDistance] = useState(10);
  const [maxPrice, setMaxPrice] = useState(50);
  const [openNow, setOpenNow] = useState(false);
  const [twentyFourHours, setTwentyFourHours] = useState(false);
  const [driveThru, setDriveThru] = useState(false);

  // Search input state
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Data states
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({ lat: 51.5074, lng: -0.1278 }); // Default London
  const [locationLabel, setLocationLabel] = useState("London Center (Default)");
  const [mockLocationType, setMockLocationType] = useState("current");

  // Load initial coordinates from parameters or browser geolocation
  useEffect(() => {
    if (paramLat && paramLng) {
      setUserLocation({
        lat: parseFloat(paramLat),
        lng: parseFloat(paramLng),
      });
      setLocationLabel("GPS Coordinates (from Landing Page)");
      setMockLocationType("current");
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationLabel("Your Current GPS Location");
        },
        () => {
          console.log("Using default location coordinates.");
          setLocationLabel("London Center (Default)");
        }
      );
    }
  }, [paramLat, paramLng]);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      try {
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
          `);

        if (searchQuery) {
          query = query.textSearch("medicine.name", searchQuery);
        }

        if (inStockOnly) {
          query = query.neq("status", "out_of_stock");
        }

        query = query.lte("price", maxPrice);

        const { data, error } = await query;
        if (error) {
          console.error(error);
          setResults([]);
        } else {
          // Client side calculations (distance and mock attributes)
          let processed = (data || []).map((item: any) => {
            const dist = getDistance(
              userLocation.lat,
              userLocation.lng,
              item.pharmacy.lat || 51.5074,
              item.pharmacy.lng || -0.1278
            );
            return {
              ...item,
              distance: dist,
            };
          });

          // Filter by distance
          processed = processed.filter((item) => item.distance <= maxDistance);

          // Filter by open now
          if (openNow) {
            processed = processed.filter((item) => item.pharmacy.is_open);
          }

          // Filter by twentyFourHours/driveThru (Mock values based on pharmacy name / ID)
          if (twentyFourHours) {
            processed = processed.filter(
              (item) =>
                item.pharmacy.name.toLowerCase().includes("clinical") ||
                item.pharmacy.name.toLowerCase().includes("24/7") ||
                item.pharmacy.hours?.is_24_hours
            );
          }
          if (driveThru) {
            processed = processed.filter(
              (item) =>
                item.pharmacy.name.toLowerCase().includes("boots") ||
                item.pharmacy.name.toLowerCase().includes("central")
            );
          }

          // Sort by distance (closest first)
          processed.sort((a, b) => a.distance - b.distance);

          setResults(processed);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [searchQuery, inStockOnly, maxDistance, maxPrice, openNow, twentyFourHours, driveThru, userLocation, supabase]);

  const handleMockLocationChange = (type: string) => {
    setMockLocationType(type);
    if (type === "london") {
      setUserLocation({ lat: 51.5074, lng: -0.1278 });
      setLocationLabel("London Center Mock");
    } else if (type === "birmingham") {
      setUserLocation({ lat: 52.4862, lng: -1.8904 });
      setLocationLabel("Birmingham Mock");
    } else if (type === "manchester") {
      setUserLocation({ lat: 53.4808, lng: -2.2426 });
      setLocationLabel("Manchester Mock");
    } else if (type === "current") {
      if (navigator.geolocation) {
        setLocationLabel("Locating browser GPS...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setLocationLabel("Your Current GPS Location");
          },
          () => {
            setUserLocation({ lat: 51.5074, lng: -0.1278 });
            setLocationLabel("London Center (Fallback)");
          }
        );
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchInput)}`);
  };

  const handleClearFilters = () => {
    setInStockOnly(false);
    setMaxDistance(25);
    setMaxPrice(50);
    setOpenNow(false);
    setTwentyFourHours(false);
    setDriveThru(false);
  };

  const handleConfirmReservation = async () => {
    if (!currentUser) {
      router.push("/login?redirect=/search");
      return;
    }

    setReservingStatus("loading");
    setReservingError("");

    try {
      const { data, error } = await supabase
        .from("reservations")
        .insert({
          user_id: currentUser.id,
          pharmacy_stock_id: selectedItemToReserve.id,
          quantity: reserveQuantity,
          status: "pending",
        })
        .select();

      if (error) {
        throw new Error(error.message);
      }

      setReservingStatus("success");
      setTimeout(() => {
        setSelectedItemToReserve(null);
        setReservingStatus("idle");
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setReservingStatus("error");
      setReservingError(err.message || "Failed to make reservation. Check if database tables are applied.");
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
      <header className="w-full top-0 sticky z-50 bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline flat no shadows">
        <div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim cursor-pointer">
              MediFind
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link className="text-primary font-label-md border-b-2 border-primary pb-1 transition-all cursor-pointer" href="/search">
                Find Medicine
              </Link>
              <a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors cursor-pointer" href="#">
                Pharmacies
              </a>
              <Link className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors cursor-pointer" href="/support">
                Support
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant">
              <span className="material-symbols-outlined text-on-surface-variant mr-2" style={{ fontSize: "20px" }}>
                search
              </span>
              <input
                className="bg-transparent border-none focus:ring-0 text-body-sm w-48 text-on-surface"
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search medicines..."
              />
            </form>
            <div className="flex items-center gap-2">
              <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
                location_on
              </button>
              <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">
                notifications
              </button>
            </div>
            <Link href="/login" className="hidden lg:block bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md hover:opacity-90 active:opacity-80 transition-all">
              Login / Sign Up
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-max-width mx-auto px-gutter py-xl">
        <div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-background mb-1">
              {searchQuery || "All Medicines"}
            </h1>
            <p className="text-on-surface-variant text-body-md">
              Showing {results.length} {results.length === 1 ? "pharmacy" : "pharmacies"} near{" "}
              <span className="font-semibold text-on-surface">{locationLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-sm bg-surface-container rounded-full p-1 border border-outline-variant">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all ${
                view === "list"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                list
              </span>{" "}
              List View
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all ${
                view === "map"
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                map
              </span>{" "}
              Map View
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-xl">
          <aside className="w-full lg:w-72 flex-shrink-0 space-y-xl">
            <section className="bg-white p-lg rounded-xl border border-outline-variant">
              <h2 className="text-label-md text-on-surface uppercase tracking-wider mb-md">Filters</h2>

              {/* GPS Coordinate Mocking Selector */}
              <div className="mb-lg border-b border-outline-variant pb-md">
                <span className="font-label-md text-on-surface block mb-sm">GPS Location Mock</span>
                <select
                  className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest text-on-surface text-body-sm mb-2 focus:ring-1 focus:ring-primary"
                  value={mockLocationType}
                  onChange={(e) => handleMockLocationChange(e.target.value)}
                >
                  <option value="current">📍 Browser Geolocation</option>
                  <option value="london">🇬🇧 London Center (51.5074, -0.1278)</option>
                  <option value="birmingham">🇬🇧 Birmingham (52.4862, -1.8904)</option>
                  <option value="manchester">🇬🇧 Manchester (53.4808, -2.2426)</option>
                </select>
                <div className="text-[10px] text-on-surface-variant font-mono bg-surface-container-low p-2 rounded border border-outline-variant/30 leading-relaxed">
                  <p className="truncate"><span className="font-bold">Label:</span> {locationLabel}</p>
                  <p><span className="font-bold">Lat:</span> {userLocation.lat.toFixed(4)}</p>
                  <p><span className="font-bold">Lng:</span> {userLocation.lng.toFixed(4)}</p>
                </div>
              </div>

              <div className="mb-lg">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                    type="checkbox"
                  />
                  <span className="text-body-md text-on-surface group-hover:text-primary transition-colors">
                    In Stock Only
                  </span>
                </label>
              </div>

              <div className="space-y-lg">
                <div>
                  <div className="flex justify-between items-center mb-sm">
                    <span className="font-label-md text-on-surface">Distance</span>
                    <span className="text-label-sm text-primary">{maxDistance} miles</span>
                  </div>
                  <input
                    className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-full cursor-pointer"
                    max="25"
                    min="1"
                    type="range"
                    value={maxDistance}
                    onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-sm">
                    <span className="font-label-md text-on-surface">Max Price</span>
                    <span className="text-label-sm text-primary">£{maxPrice.toFixed(2)}</span>
                  </div>
                  <input
                    className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-full cursor-pointer"
                    max="150"
                    min="5"
                    type="range"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <span className="font-label-md text-on-surface block mb-sm">Pharmacy Type</span>
                  <div className="space-y-base">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        checked={openNow}
                        onChange={(e) => setOpenNow(e.target.checked)}
                        className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
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
                        className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                        type="checkbox"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">
                        24-Hour Access
                      </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        checked={driveThru}
                        onChange={(e) => setDriveThru(e.target.checked)}
                        className="w-5 h-5 rounded border-outline text-primary focus:ring-primary"
                        type="checkbox"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">
                        Drive-thru Available
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClearFilters}
                className="w-full mt-xl py-3 border border-primary text-primary rounded-lg font-label-md hover:bg-surface-container transition-all"
              >
                Clear All Filters
              </button>
            </section>

            <div className="bg-primary-container/10 p-md rounded-xl border border-primary/20">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                <div>
                  <p className="text-label-md text-primary font-bold">Clinical Advice</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Always check your prescription details. Stock levels are updated in real-time by our partner pharmacies.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* List View */}
          <div className={`flex-grow space-y-md ${view !== "list" ? "hidden" : ""}`}>
            {loading ? (
              <div className="text-center py-20 text-on-surface-variant">Searching database stock...</div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-outline text-6xl mb-md">location_off</span>
                <h3 className="text-headline-md text-on-surface">No pharmacies found</h3>
                <p className="text-body-md text-on-surface-variant mt-sm max-w-sm">
                  Try adjusting your filters or search radius to find results further away.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="mt-xl bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              results.map((item, idx) => {
                const pharmacy = item.pharmacy;
                const medicine = item.medicine;
                const imageSrc =
                  idx % 2 === 0
                    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuBCAtnmXXIcZgT-iOX2LNNgXmDCl2jFlB-XaVKfi9OzKDX4CSKmmBV8uoKy3Z9ACMieoncmzz-6XT8GcK1bioJ7jmFOPGA0Pbn-ooQSvgGq4dvXOpBI_bEltlaH72yW7bJIdMf36Bxe0tunGkWiUqGDCtJTl-7on_eaRG4lAX3sG3K2cTpLSO9WIDmGk36SJMFZj0pBa4nIZGvNhnQSwSt7IB3cbxMWbj7FN66MwrkejhOejIhyX6VZ"
                    : "https://lh3.googleusercontent.com/aida-public/AB6AXuC0rYWp4mw0JgrSezLWtKyD1tmuQiUwDVHFzV9KgS1irpFVdXWqYFB7kqdJ4UUM5BsZ_M6t4fMWPeHm8gokjpJFpMn541U0fILHYUFOyZyDficKilB2mY-QM5bS50xORtO6HQaOapJV2Ng7p3AIc4UtY6bTnlIuqEbKnqJJlVA1eCKgX8N2N4U0Ys_-1SBGC4HsyYFWqI5LyGX-nMNVWab0rRL2qxsgPNQDETlUhFxaR_VMQV2su9-_";

                return (
                  <div
                    key={item.id}
                    className="bg-white clinical-card p-lg rounded-xl border border-outline-variant flex flex-col md:flex-row gap-lg"
                  >
                    <div className="w-full md:w-48 h-32 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" alt={pharmacy.name} src={imageSrc} />
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-base">
                        <div>
                          <h3 className="text-headline-md text-on-surface">{pharmacy.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-label-sm text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1" }}>
                                star
                              </span>{" "}
                              {pharmacy.rating || "0.0"} ({pharmacy.review_count || 0} reviews)
                            </span>
                            <span className="text-outline">•</span>
                            <span className="text-label-sm text-on-surface-variant">
                              {item.distance.toFixed(1)} miles away
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {medicine.name} ({medicine.category})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-headline-md text-primary font-bold">£{item.price.toFixed(2)}</span>
                          <p className="text-label-sm text-on-surface-variant">Estimated Price</p>
                        </div>
                      </div>
                      <div className="mt-md flex flex-wrap gap-sm items-center">
                        <span
                          className={`px-3 py-1 rounded-full text-label-sm font-bold flex items-center gap-1 ${
                            item.status === "in_stock"
                              ? "bg-green-100 text-green-700"
                              : item.status === "low_stock"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.status === "in_stock"
                                ? "bg-green-500"
                                : item.status === "low_stock"
                                ? "bg-orange-500"
                                : "bg-red-500"
                            }`}
                          ></span>{" "}
                          {item.status === "in_stock"
                            ? "In Stock"
                            : item.status === "low_stock"
                            ? "Low Stock"
                            : "Out of Stock"}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">
                          Updated {formatTime(item.updated_at)}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">
                          {pharmacy.is_open ? "Open Now" : "Closed"}
                        </span>
                      </div>
                      <div className="mt-lg flex gap-md flex-wrap">
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
                          disabled={item.status === "out_of_stock"}
                          className="flex-grow md:flex-none text-center bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-55 shadow"
                        >
                          {item.status === "out_of_stock" ? "Out of Stock" : "Reserve Medicine"}
                        </button>
                        <Link
                          href={`/pharmacy/${pharmacy.id}`}
                          className="flex-grow md:flex-none text-center border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-label-md hover:bg-surface-variant active:scale-95 transition-all"
                        >
                          View Pharmacy Detail
                        </Link>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.lat || 0},${pharmacy.lng || 0}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-grow md:flex-none text-center border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-label-md hover:bg-surface-variant active:scale-95 transition-all"
                        >
                          Get Directions
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Map View */}
          <div
            className={`flex-grow h-[600px] rounded-2xl border border-outline-variant overflow-hidden relative ${
              view !== "map" ? "hidden" : ""
            }`}
          >
            <div className="absolute inset-0 bg-surface-container-low flex items-center justify-center relative bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAw1k9cE-Az6bdwr9tTiaGST8aZgSa4PTJPOCHEQMuWGYYgqnZ0ZkHiinVtNFeagiv6uU84lCfWTwA_4I-Inii_yhewwEhO6i-cNtz1I8GQBVpi_SGntFDyP4SoEfMnLHCPL9FnF5w1DlT1wqPNMXDuuKWx-gIJv3CElVcZyH83upHLMOajYXzyw7vGEv4yl2IuYVRgOj6sSquVC9gPU49uOaxbbeTL5gsYJ2naT5Y-PveVT7BbXytSVaHPiuARXF6NSMsNGRBe0UY')] bg-cover bg-center">
              {/* Pulsing "You Are Here" center pin */}
              <div
                style={{ top: "50%", left: "50%" }}
                className="absolute flex flex-col items-center z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
              >
                <div className="bg-primary text-on-primary px-2 py-0.5 rounded shadow text-[9px] font-bold whitespace-nowrap mb-1">
                  You Are Here
                </div>
                <div className="w-5 h-5 bg-primary border-2 border-white rounded-full flex items-center justify-center animate-ping absolute opacity-70"></div>
                <div className="w-3.5 h-3.5 bg-primary border-2 border-white rounded-full"></div>
              </div>

              {results.map((item, idx) => {
                // Lat/lng offset mapping from userLocation center
                const latDiff = (item.pharmacy.lat || 51.5074) - userLocation.lat;
                const lngDiff = (item.pharmacy.lng || -0.1278) - userLocation.lng;

                // Scale offset percentages relative to map center
                const topVal = Math.max(10, Math.min(90, 50 - latDiff * 450));
                const leftVal = Math.max(10, Math.min(90, 50 + lngDiff * 600));

                return (
                  <div
                    key={item.id}
                    style={{ top: `${topVal}%`, left: `${leftVal}%` }}
                    className="absolute group flex flex-col items-center"
                  >
                    <div className="bg-white px-2 py-1 rounded shadow-md border border-outline-variant text-[10px] font-bold text-on-surface whitespace-nowrap hidden group-hover:block z-20">
                      {item.pharmacy.name} - £{item.price.toFixed(2)} ({item.distance.toFixed(1)}m away)
                    </div>
                    <span className="material-symbols-outlined text-primary text-3xl cursor-pointer hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="absolute top-md left-md space-y-sm z-10">
              <button className="bg-white p-2 rounded-lg shadow-md border border-outline-variant flex items-center justify-center material-symbols-outlined">
                add
              </button>
              <button className="bg-white p-2 rounded-lg shadow-md border border-outline-variant flex items-center justify-center material-symbols-outlined">
                remove
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full mt-xl bg-surface-container-highest dark:bg-inverse-surface">
        <div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col md:items-start items-center mb-md md:mb-0">
            <span className="text-label-md font-label-md font-bold text-on-surface">MediFind</span>
            <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
              © 2024 MediFind Clinical Solutions. All rights reserved.
            </p>
          </div>
          <div className="flex gap-lg flex-wrap justify-center">
            <a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Terms of Service
            </a>
            <Link className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors cursor-pointer" href="/support">
              Contact Pharmacy Support
            </Link>
          </div>
        </div>
      </footer>

      {/* Reservation Confirmation Modal */}
      {selectedItemToReserve && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg border border-outline-variant shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-on-surface">
            <h3 className="text-headline-md font-bold mb-sm">Confirm Reservation</h3>
            <p className="text-body-md text-on-surface-variant mb-md">
              You are reserving <span className="font-semibold text-on-surface">{selectedItemToReserve.medicine.name}</span> from <span className="font-semibold text-on-surface">{selectedItemToReserve.pharmacy.name}</span>.
            </p>

            <div className="bg-surface-container-low p-md rounded-xl border border-outline-variant/50 mb-md space-y-sm">
              <div className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant">Price per unit:</span>
                <span className="font-semibold text-on-surface">£{selectedItemToReserve.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-body-sm">
                <span className="text-on-surface-variant">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={reserveQuantity <= 1}
                    onClick={() => setReserveQuantity(q => q - 1)}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high disabled:opacity-50 font-bold"
                  >
                    -
                  </button>
                  <span className="font-semibold text-on-surface px-2 w-6 text-center">{reserveQuantity}</span>
                  <button
                    disabled={reserveQuantity >= selectedItemToReserve.quantity}
                    onClick={() => setReserveQuantity(q => q + 1)}
                    className="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface-container-high disabled:opacity-50 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="border-t border-outline-variant/30 pt-sm mt-sm flex justify-between text-body-md font-bold">
                <span className="text-on-surface">Total Estimated:</span>
                <span className="text-primary">£{(selectedItemToReserve.price * reserveQuantity).toFixed(2)}</span>
              </div>
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
                className="flex-1 py-3 border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container transition-all font-label-md active:scale-95"
              >
                Cancel
              </button>
              <button
                disabled={reservingStatus === "loading" || reservingStatus === "success"}
                onClick={handleConfirmReservation}
                className="flex-1 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary/95 transition-all font-label-md active:scale-95 shadow-md flex items-center justify-center gap-2"
              >
                {reservingStatus === "loading" ? "Reserving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
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
