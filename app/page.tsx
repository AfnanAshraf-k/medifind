"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/app/components/NavBar";
import { DEFAULT_TOWNS, Town, findClosestTown } from "@/lib/locations";

export default function HomePage() {
  const router = useRouter();
  const [towns, setTowns] = useState<Town[]>(DEFAULT_TOWNS);

  useEffect(() => {
    async function loadTowns() {
      try {
        const res = await fetch("/api/towns");
        if (res.ok) {
          const data = await res.json();
          if (data.towns && data.towns.length > 0) {
            setTowns(data.towns);
          }
        }
      } catch (e) {
        // Fallback to DEFAULT_TOWNS
      }
    }
    loadTowns();
  }, []);

  const [q, setQ] = useState("");
  const [locating, setLocating] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Current Location");

  const handleGetLocation = () => {
    if (locating) return;
    setLocating(true);
    setLocationStatus("Locating...");

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setGpsLocation({ lat: userLat, lng: userLng });

          // Find closest town from dynamic towns list using km Haversine formula
          const { town, distanceKm } = findClosestTown(userLat, userLng, towns);

          setLocationStatus(`Near ${town.name} (${distanceKm.toFixed(1)} km)`);
          setLocating(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationStatus("Valanchery (Default)");
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocationStatus("Valanchery (Default)");
      setLocating(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let url = `/search?q=${encodeURIComponent(q)}`;
    if (gpsLocation) {
      url += `&lat=${gpsLocation.lat}&lng=${gpsLocation.lng}`;
      const { town } = findClosestTown(gpsLocation.lat, gpsLocation.lng, towns);
      url += `&town=${encodeURIComponent(town.name)}`;
    }
    router.push(url);
  };

  return (
    <div className="bg-background text-on-surface font-body-md">
      <NavBar
        rightIconSlot={
          <button
            onClick={handleGetLocation}
            title="Detect current location"
            className="material-symbols-outlined text-on-surface-variant p-2 hover:bg-surface-variant rounded-full transition-all border-none bg-transparent cursor-pointer"
          >
            location_on
          </button>
        }
      />

      <main>
        <section className="relative min-h-[819px] flex items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop">
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full bg-cover bg-center opacity-10"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDU5O8yGhMccJJEp3XhJ4eK0nSx8g5k5OhrVSaqMZFdqy74811ILQcweQv-kJqOGS9EJ81eZFT43uC-566aUQo_T572sjv0u-zx1ZFUQt1rQXp17x5mT_Orr7EsrQ2ftXVN5QIKjuCs6O8NDGmAfo4O0xXtUQ2SsUFVuFUCkZikDrsfy9GIVfKkpp44w2KFxWfJphkprJpBQXe0DjNDRFqRDWIyUsxRm-W-MT1EoQrS2Y4YdpyihpJl')",
              }}
            ></div>
          </div>
          <div className="relative z-10 max-w-4xl w-full text-center py-xl">
            <span className="inline-block py-1 px-3 rounded-full bg-secondary-container text-on-secondary-container font-label-sm mb-md uppercase tracking-wider">
              Trusted Clinical Network • Kerala, India
            </span>
            <h1 className="font-display text-display text-on-surface mb-lg leading-tight">
              Find critical medication in seconds.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-2xl mx-auto">
              Real-time inventory tracking across certified partner pharmacies in Valanchery, Perinthalmanna, and throughout Kerala. Instant medicine reserve with transparent INR (₹) pricing.
            </p>

            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-3xl mx-auto bg-surface border border-outline-variant p-2 rounded-xl shadow-sm flex flex-col md:flex-row items-stretch gap-2"
            >
              <div className="flex-grow flex items-center px-md gap-md">
                <span className="material-symbols-outlined text-outline">search</span>
                <input
                  name="q"
                  className="w-full border-none focus:ring-0 bg-transparent py-4 text-body-md placeholder:text-outline text-on-surface"
                  placeholder="Search medicine by name or formula (e.g. Paracetamol, Dolo 650, Insulin)..."
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <div className="hidden md:block w-px bg-outline-variant my-2"></div>
              <div
                onClick={handleGetLocation}
                className="flex items-center px-md gap-md group cursor-pointer hover:bg-surface-variant/30 rounded-lg transition-colors py-2 md:py-0"
              >
                <span className={`material-symbols-outlined ${gpsLocation ? "text-primary animate-pulse" : "text-outline"}`}>
                  location_on
                </span>
                <span className="text-body-md text-on-surface-variant whitespace-nowrap group-hover:text-primary">
                  {locationStatus}
                </span>
              </div>
              <button
                type="submit"
                className="bg-primary text-on-primary px-xl py-4 rounded-lg font-headline-md hover:bg-primary/90 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Search
              </button>
            </form>

            <div className="mt-xl flex flex-wrap justify-center gap-lg opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="font-label-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">verified</span> Verified Stock
              </span>
              <span className="font-label-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">schedule</span> Real-time Updates
              </span>
              <span className="font-label-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-sm">health_and_safety</span> Certified Kerala Pharmacies
              </span>
            </div>
          </div>
        </section>

        <section className="py-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
          <div className="mb-xl text-center">
            <h2 className="font-headline-lg text-headline-lg mb-sm">How MediFind works for you</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Our streamlined process ensures you find your prescription with minimum effort and maximum reliability.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            <div
              className="bento-card bg-surface border border-outline-variant rounded-xl p-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-md">Search</h3>
                <p className="text-on-surface-variant">
                  Enter your medication name. Our system cross-references active stock levels across thousands of pharmacies.
                </p>
              </div>
              <div className="mt-xl pt-lg border-t border-outline-variant/30 italic text-label-sm text-outline">
                Over 5,000 medications tracked
              </div>
            </div>

            <div
              className="bento-card bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-between md:scale-105 shadow-xl z-10"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-on-primary/20 flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">map</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-md">Locate</h3>
                <p className="opacity-90">
                  View available stock on an interactive Kerala map. Compare INR (₹) prices and view kilometer distances in one place.
                </p>
              </div>
              <div className="mt-xl pt-lg border-t border-on-primary/20 flex items-center gap-sm">
                <span className="material-symbols-outlined text-sm">flash_on</span>
                <span className="text-label-sm uppercase tracking-widest">Instant Matching</span>
              </div>
            </div>

            <div
              className="bento-card bg-surface border border-outline-variant rounded-xl p-lg flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md">
                  <span className="material-symbols-outlined">bookmark_check</span>
                </div>
                <h3 className="font-headline-md text-headline-md mb-md">Reserve</h3>
                <p className="text-on-surface-variant">
                  Reserve your dose with a click to ensure it's waiting for you when you arrive at the pharmacy.
                </p>
              </div>
              <div className="mt-xl pt-lg border-t border-outline-variant/30 italic text-label-sm text-outline">
                Secure pickup verification
              </div>
            </div>
          </div>
        </section>

        <section className="py-xl bg-surface-container-low border-y border-outline-variant/20">
          <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
            <div className="relative rounded-xl overflow-hidden shadow-2xl aspect-video">
              <img
                className="w-full h-full object-cover"
                alt="Smartphone screen showing map with pharmacy pins"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_0mq0ogMsbrzMa1xDbQjlGF5yjHwAD4q1c7_-ZcNpjBLlyzgbx4SG9C_ViVfAgh348H0yOAVOlpeTa1451EDnJxHIiCQ5jGHj-2Mvjqjg1DBfyh-GZcl4O0yVPmBGU6doqhhZa3ABRgaF9gn1ew4CT2ws7u3A6AiA-R97_pamv4Kr2xrZqxSgmoc30Q1X9qEVBG4zuWORm_5GJkcq94h_0kLZWBfh1-QzrRF74DmjaRZnHwWmo9br"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
            </div>
            <div className="space-y-lg">
              <h2 className="font-headline-lg text-headline-lg">Clinical reliability in the palm of your hand</h2>
              <p className="text-body-lg text-on-surface-variant">
                We understand that getting your medication is not just about convenience—it's about health and peace of mind in acute emergencies.
              </p>
              <ul className="space-y-md">
                <li className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                  <div>
                    <span className="font-headline-md text-headline-md block">Zero Guesswork</span>
                    <span className="text-body-md text-on-surface-variant">
                      Know exactly which pharmacy in Valanchery, Perinthalmanna, or nearby towns has your specific medicine in stock.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                  <div>
                    <span className="font-headline-md text-headline-md block">Price Transparency in INR (₹)</span>
                    <span className="text-body-md text-on-surface-variant">
                      Compare actual pharmacy retail prices in Indian Rupees without hidden surcharges.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-md">
                  <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                  <div>
                    <span className="font-headline-md text-headline-md block">Kilometer Distance Guidance</span>
                    <span className="text-body-md text-on-surface-variant">
                      Accurate driving distances in kilometers and quick turn-by-turn navigation links.
                    </span>
                  </div>
                </li>
              </ul>
              <Link
                href="/login"
                className="inline-block bg-surface text-primary border-2 border-primary px-xl py-md rounded-lg font-label-md hover:bg-primary hover:text-on-primary transition-all text-center"
              >
                Create User Account
              </Link>
            </div>
          </div>
        </section>

        <section className="py-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-md mb-xl">
            <div>
              <h2 className="font-headline-lg text-headline-lg mb-xs">Partner Pharmacies</h2>
              <p className="text-on-surface-variant">
                Connected with verified licensed pharmacies across Valanchery, Perinthalmanna, Kuttippuram, and Malappuram.
              </p>
            </div>
            <Link href="/search?mode=pharmacy" className="text-primary font-label-md flex items-center gap-xs hover:underline">
              View all pharmacies <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
            <div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">local_pharmacy</span>
              </div>
              <span className="font-label-md text-on-surface">V Care Pharmacy</span>
              <span className="text-label-sm text-outline">Valanchery Hub</span>
            </div>
            <div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
              </div>
              <span className="font-label-md text-on-surface">SK Pharmacy</span>
              <span className="text-label-sm text-outline">Perinthalmanna</span>
            </div>
            <div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">medication</span>
              </div>
              <span className="font-label-md text-on-surface">Jan Aushadhi</span>
              <span className="text-label-sm text-outline">Kuttippuram</span>
            </div>
            <div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">emergency</span>
              </div>
              <span className="font-label-md text-on-surface">24/7 Meds</span>
              <span className="text-label-sm text-outline">Malappuram Central</span>
            </div>
          </div>
          <div className="mt-xl p-lg bg-surface-container-highest rounded-2xl flex flex-col md:flex-row items-center justify-between gap-lg">
            <div className="flex items-center gap-lg">
              <p className="text-on-surface-variant font-body-md">Are you a registered retail pharmacy owner in Kerala?</p>
            </div>
            <Link
              href="/login?signup=true"
              className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md whitespace-nowrap shadow-md active:scale-95 transition-all inline-block text-center"
            >
              Register Your Pharmacy
            </Link>
          </div>
        </section>
      </main>

      <footer className="w-full mt-xl bg-surface-container-highest border-t border-outline-variant/30">
        <div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex flex-col md:flex-row items-center gap-lg">
            <div className="text-label-md font-label-md font-bold text-on-surface">MediFind</div>
            <div className="text-body-sm font-body-sm text-on-surface-variant">© 2026 MediFind Clinical Solutions. All rights reserved.</div>
          </div>
          <div className="flex gap-lg">
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
