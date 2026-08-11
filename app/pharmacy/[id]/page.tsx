"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface PharmacyDetailPageProps {
  params: {
    id: string;
  };
}

export default function PharmacyDetailPage({ params }: PharmacyDetailPageProps) {
  const router = useRouter();
  const supabase = createClient();

  const [pharmacy, setPharmacy] = useState<any>(null);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Auth/Reservation states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedItemToReserve, setSelectedItemToReserve] = useState<any>(null);
  const [reserveQuantity, setReserveQuantity] = useState(1);
  const [reservingStatus, setReservingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [reservingError, setReservingError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Fetch pharmacy details
        const { data: pharm, error: pharmErr } = await supabase
          .from("pharmacies")
          .select("*")
          .eq("id", params.id)
          .single();

        if (pharmErr || !pharm) {
          console.error(pharmErr);
          setPharmacy(null);
          setLoading(false);
          return;
        }
        setPharmacy(pharm);

        // Fetch inventory stock
        const { data: stockList, error: stockErr } = await supabase
          .from("pharmacy_stock")
          .select(`
            id,
            quantity,
            price,
            status,
            medicine:medicines(*)
          `)
          .eq("pharmacy_id", params.id);

        if (!stockErr && stockList) {
          setStock(stockList);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id, supabase]);

  const handleConfirmReservation = async () => {
    if (!currentUser) {
      router.push(`/login?redirect=/pharmacy/${params.id}`);
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
      setReservingError(err.message || "Failed to make reservation.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">
        <div className="text-center py-20 text-on-surface-variant">Loading pharmacy profile...</div>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-outline text-6xl mb-md">local_pharmacy</span>
        <h2 className="text-headline-lg font-bold text-on-surface">Pharmacy Profile Not Found</h2>
        <p className="text-body-md text-on-surface-variant mt-sm max-w-sm">
          The pharmacy directory listing you are looking for may have been removed or deactivated.
        </p>
        <Link href="/search" className="mt-xl bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md">
          Return to search
        </Link>
      </div>
    );
  }

  const hours = (pharmacy.hours as any) || {};
  const monFriHours = hours.monday_friday || "08:00 AM - 10:00 PM";
  const satHours = hours.saturday || "09:00 AM - 08:00 PM";
  const sunHours = hours.sunday || "Closed";

  // Filter stock live
  const filteredStock = stock.filter((item) => {
    const medicine = Array.isArray(item.medicine) ? item.medicine[0] : item.medicine;
    if (!medicine) return false;
    return (
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (medicine.generic_name && medicine.generic_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="bg-background text-on-background min-h-screen">
      <nav className="w-full top-0 sticky bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline z-50">
        <div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto">
          <Link href="/" className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim cursor-pointer">
            MediFind
          </Link>
          <div className="hidden md:flex gap-xl items-center">
            <Link className="text-on-surface-variant font-label-md hover:text-primary transition-colors cursor-pointer" href="/search">
              Find Medicine
            </Link>
            <a className="text-primary font-label-md border-b-2 border-primary pb-1 transition-colors cursor-pointer">
              Pharmacies
            </a>
            <Link className="text-on-surface-variant font-label-md hover:text-primary transition-colors cursor-pointer" href="/support">
              Support
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-max-width mx-auto px-gutter py-xl">
        <header className="mb-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
          <div className="flex gap-lg items-center">
            <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center font-display text-display-md flex-shrink-0">
              {pharmacy.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-display font-display text-on-surface">{pharmacy.name}</h1>
              <p className="text-body-md text-on-surface-variant mt-xs">{pharmacy.address}</p>
            </div>
          </div>
          <div className="flex flex-col gap-sm w-full md:w-auto">
            <div className="flex items-center gap-2 self-start md:self-end">
              <span className="text-label-sm text-on-surface-variant flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>{" "}
                {pharmacy.rating || "0.0"} ({pharmacy.review_count || 0} reviews)
              </span>
            </div>
            <div className="flex gap-md w-full">
              <a
                href={`tel:${pharmacy.phone || ""}`}
                className="flex-1 md:flex-none text-center border border-primary text-primary px-lg py-md rounded-lg font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all"
              >
                <span className="material-symbols-outlined mr-xs align-middle">call</span> Call
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${pharmacy.lat || 0},${pharmacy.lng || 0}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none text-center bg-primary text-on-primary px-lg py-md rounded-lg font-label-md hover:bg-surface-tint shadow-lg transition-all active:scale-95"
              >
                Get Directions
              </a>
            </div>
          </div>
        </header>

        <div className="bento-grid">
          <aside className="col-span-12 lg:col-span-4 space-y-lg">
            <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant text-on-surface">
              <div className="flex items-center justify-between mb-md">
                <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Current Status</span>
                {pharmacy.is_open ? (
                  <span className="bg-[#D1FAE5] text-[#065F46] px-md py-xs rounded-full text-label-sm font-bold">
                    OPEN NOW
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-md py-xs rounded-full text-label-sm font-bold">
                    CLOSED
                  </span>
                )}
              </div>
              <div className="space-y-sm">
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Mon - Fri</span>
                  <span className="font-semibold text-on-surface">{monFriHours}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Saturday</span>
                  <span className="font-semibold text-on-surface">{satHours}</span>
                </div>
                <div className="flex justify-between text-body-md">
                  <span className="text-on-surface-variant">Sunday</span>
                  <span
                    className={`font-semibold ${
                      sunHours.toLowerCase().includes("closed") ? "text-error" : "text-on-surface"
                    }`}
                  >
                    {sunHours}
                  </span>
                </div>
              </div>
              <hr className="my-md border-outline-variant" />
              <div className="space-y-md">
                <div className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary">local_shipping</span>
                  <div>
                    <p className="text-label-md text-on-surface">Home Delivery</p>
                    <p className="text-body-sm text-on-surface-variant">Within 5 miles, £5.00 flat fee</p>
                  </div>
                </div>
                <div className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary">clinical_notes</span>
                  <div>
                    <p className="text-label-md text-on-surface">Insurance Accepted</p>
                    <p className="text-body-sm text-on-surface-variant">Medicare, BlueCross, Aetna +15 more</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
              <div className="h-48 w-full bg-surface-variant relative">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${pharmacy.image_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9N4oLeMsO6sY8GDKq9i-zTUJDvDKaYPSZLPZhyWmMImzLyQAckfHtQF4ZT2xhgBNac-vfNiaOMoc7xrJoAsMi6Y0e9XMeTbg06r5S7qTD-6FkXm3CjDVEueIITC_WDKN-XTqKlDVgwA8vk-cK_ik23bMoRYp5ZmhsbzhwWggqclzMbueL-tysCaOamgI21p2QgmFb04CmXqHy6ptrpIPtfoiym39tF0G-GIQFmWWl4e9ybbp_5xNR'})`
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-sm rounded-full shadow-lg">
                    <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                      location_on
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-md">
                <p className="text-body-sm text-on-surface-variant">Located in Downtown Health District</p>
              </div>
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-8">
            <div className="flex items-center justify-between mb-lg">
              <h2 className="text-headline-lg font-headline-lg text-on-surface">Inventory Levels</h2>
              <div className="relative w-1/2 hidden md:block">
                <input
                  className="w-full bg-surface-container-low border border-outline-variant rounded-full py-sm pl-xl pr-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
                  placeholder="Search medicines..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {filteredStock.length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-white border border-outline-variant rounded-xl text-on-surface-variant">
                  {stock.length === 0 ? "No medicine stock registered yet." : "No medicines match your search."}
                </div>
              ) : (
                filteredStock.map((item, idx) => {
                  const medicine: any = Array.isArray(item.medicine) ? item.medicine[0] : item.medicine;
                  if (!medicine) return null;
                  const imageSrc = medicine.image_url || (
                    idx % 2 === 0
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAct7G014GC-w1ErH0expxnATavMY3qxuB5ssd6ob7lruuecDgI1uPApTUk7DKrwYjLjNhfwUkN9a1SB8HZ8dE69u0QJ-Qv2kZGu_zkBdHEWOrJjcPVhE6yDk88VMmlEXq53ILiOVtDnDBYXgFxRLvyxEDonvpdBhOzWdijQVuhesousap3DK1KBTqj7GzJNEo3PUVcLrOBjKQ7UukoggpETGJQuaQNiYhkMAEs1-HKi1egPCN_IYb_"
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuDVN88hsrko5PvEE4w8b3M1AxIKO3VlvQWFX1nyfuP1H_Qjc5c9zzzpvN_loMQNc8fFARqjTexzGipodcsCLBG1O1aYLAzSvEc7xngWoeYKieIE7FeUjrDpmxQh--H7HhlrFuI_5bbvt_Gs664XgNx_F360hQFvGZ7rqTIk3K6TOOXE2NanMXIuKYRlLnqZt95UU9Nu1P3U3M4yVT1XAT6zSPW_OsBrEGjcpPkrgiT4R7ssL6iuMgjn"
                  );

                  return (
                    <div
                      key={item.id}
                      className="bg-white p-md rounded-xl border border-outline-variant flex gap-md hover:border-primary transition-all group text-on-surface"
                    >
                      <div className="w-24 h-24 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
                        <img className="w-full h-full object-cover" alt={medicine.name} src={imageSrc} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-label-md text-on-surface font-bold">{medicine.name}</h3>
                          <p className="text-body-sm text-on-surface-variant">
                            {medicine.generic_name || "Generic"} • {medicine.category || "Uncategorized"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-md">
                          <span
                            className={`text-label-sm px-md py-0.5 rounded-full font-bold ${
                              item.status === "in_stock"
                                ? "bg-green-100 text-green-700"
                                : item.status === "low_stock"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.status === "in_stock"
                              ? "IN STOCK"
                              : item.status === "low_stock"
                              ? `LOW STOCK (${item.quantity})`
                              : "OUT OF STOCK"}
                          </span>
                          <span className="text-headline-md font-bold text-on-surface">£{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <button
                          onClick={() => {
                            if (!currentUser) {
                              router.push(`/login?redirect=/pharmacy/${params.id}`);
                            } else {
                              setSelectedItemToReserve({
                                ...item,
                                pharmacy: pharmacy,
                              });
                              setReserveQuantity(1);
                              setReservingStatus("idle");
                            }
                          }}
                          disabled={item.status === "out_of_stock"}
                          className="bg-surface-container-highest p-sm rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined">add</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-xl bg-primary-container p-xl rounded-2xl relative overflow-hidden text-on-primary-container">
              <div className="relative z-10">
                <h3 className="text-headline-md font-headline-md mb-xs">Fast-Track Your Refill</h3>
                <p className="text-body-md mb-md max-w-md opacity-90">
                  Upload your prescription photo and have it ready for pickup in under 30 minutes.
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="bg-on-primary-container text-primary font-label-md px-xl py-md rounded-lg shadow-md hover:bg-white transition-all active:scale-95"
                >
                  Upload Prescription
                </button>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 -skew-x-12 translate-x-1/2"></div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full mt-xl bg-surface-container-highest dark:bg-inverse-surface">
        <div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center">
          <div className="mb-md md:mb-0">
            <span className="text-label-md font-label-md font-bold text-on-surface">MediFind Clinical Solutions</span>
            <p className="text-body-sm text-on-surface-variant mt-xs">
              © 2026 MediFind Clinical Solutions. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-lg">
            <a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Terms of Service
            </a>
            <Link className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer" href="/support">
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
