import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PharmacyDetailPageProps {
  params: {
    id: string;
  };
}

export default async function PharmacyDetailPage({ params }: PharmacyDetailPageProps) {
  const supabase = createClient();

  // Fetch pharmacy
  const { data: pharmacy, error: pharmErr } = await supabase
    .from("pharmacies")
    .select("*")
    .eq("id", params.id)
    .single();

  if (pharmErr || !pharmacy) {
    notFound();
  }

  // Fetch pharmacy stock with medicines details
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

  const stock = stockList || [];

  const hours = (pharmacy.hours as any) || {};
  const monFriHours = hours.monday_friday || "08:00 AM - 10:00 PM";
  const satHours = hours.saturday || "09:00 AM - 08:00 PM";
  const sunHours = hours.sunday || "Closed";

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
            <a className="text-on-surface-variant font-label-md hover:text-primary transition-colors cursor-pointer">
              Support
            </a>
          </div>
          <div className="flex items-center gap-md">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
              notifications
            </span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">
              location_on
            </span>
            <Link href="/login" className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md hover:bg-surface-tint transition-all active:opacity-80">
              Pharmacy Login
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl">
        <header className="mb-xl">
          <div className="flex flex-col md:flex-row gap-lg items-start md:items-center justify-between">
            <div>
              <h1 className="text-display font-display text-on-surface mb-xs">{pharmacy.name}</h1>
              <div className="flex flex-wrap items-center gap-md text-on-surface-variant">
                <div className="flex items-center gap-xs">
                  <span
                    className="material-symbols-outlined text-[#F59E0B]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-label-md text-on-surface">{pharmacy.rating || "0.0"}</span>
                  <span className="text-body-sm">({pharmacy.review_count || 0} Reviews)</span>
                </div>
                <span className="hidden md:block">•</span>
                <div className="flex items-center gap-xs">
                  <span className="material-symbols-outlined">location_on</span>
                  <span className="text-body-md">{pharmacy.address}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-md w-full md:w-auto">
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
            <div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant">
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
                    <p className="text-body-sm text-on-surface-variant">Within 5 miles, $5.00 flat fee</p>
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
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9N4oLeMsO6sY8GDKq9i-zTUJDvDKaYPSZLPZhyWmMImzLyQAckfHtQF4ZT2xhgBNac-vfNiaOMoc7xrJoAsMi6Y0e9XMeTbg06r5S7qTD-6FkXm3CjDVEueIITC_WDKN-XTqKlDVgwA8vk-cK_ik23bMoRYp5ZmhsbzhwWggqclzMbueL-tysCaOamgI21p2QgmFb04CmXqHy6ptrpIPtfoiym39tF0G-GIQFmWWl4e9ybbp_5xNR')",
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
                />
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {stock.length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-white border border-outline-variant rounded-xl text-on-surface-variant">
                  No medicine stock registered yet for this pharmacy.
                </div>
              ) : (
                stock.map((item, idx) => {
                  const medicine: any = Array.isArray(item.medicine) ? item.medicine[0] : item.medicine;
                  if (!medicine) return null;
                  const imageSrc =
                    idx % 2 === 0
                      ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAct7G014GC-w1ErH0expxnATavMY3qxuB5ssd6ob7lruuecDgI1uPApTUk7DKrwYjLjNhfwUkN9a1SB8HZ8dE69u0QJ-Qv2kZGu_zkBdHEWOrJjcPVhE6yDk88VMmlEXq53ILiOVtDnDBYXgFxRLvyxEDonvpdBhOzWdijQVuhesousap3DK1KBTqj7GzJNEo3PUVcLrOBjKQ7UukoggpETGJQuaQNiYhkMAEs1-HKi1egPCN_IYb_"
                      : "https://lh3.googleusercontent.com/aida-public/AB6AXuDVN88hsrko5PvEE4w8b3M1AxIKO3VlvQWFX1nyfuP1H_Qjc5c9zzzpvN_loMQNc8fFARqjTexzGipodcsCLBG1O1aYLAzSvEc7xngWoeYKieIE7FeUjrDpmxQh--H7HhlrFuI_5bbvt_Gs664XgNx_F360hQFvGZ7rqTIk3K6TOOXE2NanMXIuKYRlLnqZt95UU9Nu1P3U3M4yVT1XAT6zSPW_OsBrEGjcpPkrgiT4R7ssL6iuMgjn";

                  return (
                    <div
                      key={item.id}
                      className="bg-white p-md rounded-xl border border-outline-variant flex gap-md hover:border-primary transition-all group"
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
                        <button className="bg-surface-container-highest p-sm rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all">
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
                <button className="bg-on-primary-container text-primary font-label-md px-xl py-md rounded-lg shadow-md hover:bg-white transition-all">
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
              © 2024 MediFind Clinical Solutions. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-lg">
            <a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Terms of Service
            </a>
            <a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">
              Contact Pharmacy Support
            </a>
          </div>
        </div>
      </footer>

      <button className="md:hidden fixed bottom-md right-md bg-primary text-on-primary p-md rounded-full shadow-2xl active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-[32px]">shopping_cart</span>
      </button>
    </div>
  );
}
