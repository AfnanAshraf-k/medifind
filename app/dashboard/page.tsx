"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PatientDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [viewingPrescriptionUrl, setViewingPrescriptionUrl] = useState<string | null>(null);

  const loadReservations = async (userId: string) => {
    setLoadingReservations(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          quantity,
          status,
          created_at,
          prescription_url,
          pharmacy_stock:pharmacy_stock_id(
            price,
            pharmacy:pharmacies(*),
            medicine:medicines(*)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (err) {
      console.error("Error loading reservations:", err);
    } finally {
      setLoadingReservations(false);
    }
  };

  useEffect(() => {
    async function loadProfileAndData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        if (data) {
          setProfile({
            full_name: data.full_name || user.email?.split("@")[0] || "User",
            email: data.email || user.email || "",
          });
        }
        loadReservations(user.id);
      }
    }
    loadProfileAndData();
  }, [supabase]);

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

      // Reload
      const { data: { user } } = await supabase.auth.getUser();
      if (user) loadReservations(user.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to cancel reservation");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="bg-surface text-on-surface">
<header className="md:hidden sticky top-0 z-50 bg-surface border-b border-outline-variant px-margin-mobile h-16 flex items-center justify-between">
<h1 className="font-display text-headline-md text-primary">MediFind</h1>
<button className="material-symbols-outlined text-primary" onClick={() => setMobileNavOpen((open) => !open)}>menu</button>
</header>

<aside className={`h-screen w-64 fixed left-0 top-0 bg-surface-container-low dark:bg-inverse-surface flex-col py-xl border-r border-outline-variant dark:border-outline transition-transform duration-300 md:flex z-[60] ${mobileNavOpen ? "flex w-full" : "hidden"}`}>
<div className="px-6 mb-10">
<h2 className="font-display text-display text-primary">MediFind</h2>
</div>
<div className="px-6 mb-8 flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center overflow-hidden border border-outline-variant">
<img className="w-full h-full object-cover" alt="A professional, high-resolution headshot of a middle-aged man with a friendly expression, wearing a clean white shirt. The background is a soft-focus clinical environment with bright, natural lighting. The visual style is crisp and modern, reflecting a premium healthcare service aesthetic with high clarity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBP3m_RpwgywBCPVlVIIjssTjEVR_n47_M1fg3frbw_vc6rDdY4WHf7vhX6qHBFNbJ3WHOhBggDutfg_uWRWSy0b76BCSMP5j2ofqmVFcN4byu70ucC1VSoNNO-0Yonh8Zc193nK6SUANAcUueNDaVBDKKNnfylx3cTFTddRu_FhYGtdGipB0wikcEQRzQs87Untj1WbE9Xh8Wm2GVdQco8Z_s-kMgxci3MZSvojpZBqJgzYR7k7MveOPnMUrTDfAcG1cMeAMAGQag"/>
</div>
<div>
<p className="font-label-md text-label-md text-on-surface">{profile ? profile.full_name : "Loading..."}</p>
<p className="text-xs text-on-surface-variant">Verified User</p>
</div>
</div>
<nav className="flex-grow flex flex-col gap-1">

<a className="flex items-center gap-3 px-4 py-3 bg-secondary-container dark:bg-secondary text-on-secondary-container dark:text-on-secondary rounded-full mx-2 transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span className="font-label-md text-label-md">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant mx-2 rounded-full transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined" data-icon="medication">medication</span>
<span className="font-label-md text-label-md">Prescriptions</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant mx-2 rounded-full transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined" data-icon="history">history</span>
<span className="font-label-md text-label-md">Order History</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant mx-2 rounded-full transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined" data-icon="local_pharmacy">local_pharmacy</span>
<span className="font-label-md text-label-md">Saved Pharmacies</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant dark:text-surface-variant hover:bg-surface-variant mx-2 rounded-full transition-all cursor-pointer" href="#">
<span className="material-symbols-outlined" data-icon="person">person</span>
<span className="font-label-md text-label-md">Health Profile</span>
</a>
<button
  onClick={handleLogout}
  className="flex items-center gap-3 px-4 py-3 text-error hover:bg-red-50 mx-2 rounded-full transition-all cursor-pointer text-left w-[calc(100%-1rem)] mt-2"
>
  <span className="material-symbols-outlined">logout</span>
  <span className="font-label-md text-label-md font-bold">Sign Out</span>
</button>
</nav>
<div className="px-4 mt-auto">
<button className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl font-label-md hover:bg-primary-container transition-colors shadow-sm">
<span className="material-symbols-outlined">upload_file</span>
                Upload Prescription
            </button>
</div>
</aside>

<main className="md:ml-64 min-h-screen pb-xl">
<div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pt-xl">

<header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="font-display text-display text-on-surface">Welcome back, {profile ? profile.full_name.split(" ")[0] : "User"}</h2>
<p className="font-body-md text-on-surface-variant mt-1">Here is a summary of your current health and prescription status.</p>
</div>
<div className="flex gap-md">
<Link href="/search">
<button className="flex items-center gap-2 px-6 py-3 bg-white border border-outline-variant rounded-xl font-label-md text-primary hover:bg-surface-container transition-all clinical-shadow">
<span className="material-symbols-outlined">search</span>
                        Find Medicine
                    </button>
</Link>
<Link href="/search">
<button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md hover:shadow-lg transition-all">
<span className="material-symbols-outlined">add</span>
                        New Order
                    </button>
</Link>
</div>
</header>

<div className="bento-grid">

<section className="col-span-12 lg:col-span-8">
<div className="bg-white border border-outline-variant rounded-xl p-6 h-full clinical-shadow">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary">receipt_long</span>
                                My Medicine Reservations
                            </h3>
<button 
  onClick={() => {
    async function reload() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) loadReservations(user.id);
    }
    reload();
  }}
  className="text-primary font-label-md hover:underline flex items-center gap-1"
>
  <span className="material-symbols-outlined text-sm">refresh</span> Refresh
</button>
</div>
<div className="space-y-4">

{loadingReservations ? (
  <div className="text-center py-8 text-on-surface-variant text-body-sm">Loading your reservations...</div>
) : reservations.length === 0 ? (
  <div className="text-center py-8 text-on-surface-variant text-body-sm border border-dashed border-outline-variant rounded-lg p-md">
    <p>No reservations placed yet.</p>
    <Link
      href="/search"
      className="text-primary font-label-sm hover:underline mt-2 inline-block"
    >
      Find medicine and reserve now &rarr;
    </Link>
  </div>
) : (
  reservations.map((res: any) => {
    const stock = res.pharmacy_stock;
    const medicine = Array.isArray(stock?.medicine) ? stock.medicine[0] : stock?.medicine;
    const pharmacy = Array.isArray(stock?.pharmacy) ? stock.pharmacy[0] : stock?.pharmacy;

    if (!medicine || !pharmacy) return null;

    const statusColors: any = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      ready: "bg-green-100 text-green-700 border-green-200",
      collected: "bg-blue-100 text-blue-700 border-blue-200",
      cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    };

    const statusLabels: any = {
      pending: "Pending Review",
      ready: "Ready for Pickup",
      collected: "Collected",
      cancelled: "Cancelled",
    };

    return (
      <div
        key={res.id}
        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-outline-variant rounded-lg hover:border-primary-container transition-colors group gap-3 text-on-surface"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
          </div>
          <div>
            <p className="font-label-md text-on-surface font-semibold">{medicine.name}</p>
            <p className="text-xs text-on-surface-variant">
              From: {pharmacy.name} • Qty: {res.quantity}
            </p>
            <p className="text-[10px] text-outline mt-0.5">
              Reserved on {new Date(res.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right mr-2 hidden md:block">
            <span className="font-semibold text-on-surface text-body-sm">£{(stock.price * res.quantity).toFixed(2)}</span>
            <p className="text-[10px] text-on-surface-variant">Total Price</p>
          </div>
          {res.prescription_url && (
            <button
              onClick={() => setViewingPrescriptionUrl(res.prescription_url)}
              className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-xs font-semibold flex items-center gap-1 border border-outline-variant transition-colors"
            >
              <span className="material-symbols-outlined text-sm">description</span>
              View Rx
            </button>
          )}
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[res.status] || statusColors.pending}`}>
            {statusLabels[res.status] || res.status}
          </span>
          
          {(res.status === "pending" || res.status === "ready") && (
            <button
              onClick={() => handleCancelReservation(res.id)}
              className="px-3 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors active:scale-95"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  })
)}

</div>
</div>
</section>

<section className="col-span-12 lg:col-span-4">
<div className="bg-white border border-outline-variant rounded-xl p-6 h-full clinical-shadow">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary">store</span>
                                Primary Pharmacy
                            </h3>
</div>
<div className="rounded-xl overflow-hidden mb-4 border border-outline-variant relative h-32">
<div className="w-full h-full bg-cover bg-center" data-alt="A clean, high-tech map interface of a suburban neighborhood with a prominent pharmacy pin. The map design is minimalist with soft grays and blues, highlighting the location of 'City Care Pharmacy'. The lighting is bright and architectural, suggesting a precise and reliable healthcare navigation system." style={{backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuAw1k9cE-Az6bdwr9tTiaGST8aZgSa4PTJPOCHEQMuWGYYgqnZ0ZkHiinVtNFeagiv6uU84lCfWTwA_4I-Inii_yhewwEhO6i-cNtz1I8GQBVpi_SGntFDyP4SoEfMnLHCPL9FnF5w1DlT1wqPNMXDuuKWx-gIJv3CElVcZyH83upHLMOajYXzyw7vGEv4yl2IuYVRgOj6sSquVC9gPU49uOaxbbeTL5gsYJ2naT5Y-PveVT7BbXytSVaHPiuARXF6NSMsNGRBe0UY\')'}}></div>
<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
<div className="absolute bottom-2 left-3 text-white">
<p className="text-xs font-bold">1.2 miles away</p>
</div>
</div>
<div className="space-y-4">
<div>
<h4 className="font-label-md text-on-surface">City Care Pharmacy</h4>
<p className="text-xs text-on-surface-variant">123 Health Ave, Medical District</p>
</div>
<div className="flex items-center gap-2 py-2 px-3 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Currently Open until 9:00 PM
                            </div>
<div className="flex gap-2">
<button className="flex-1 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold hover:bg-surface-variant transition-all">
                                    Call
                                </button>
<button className="flex-1 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-xs font-bold hover:bg-surface-variant transition-all">
                                    Directions
                                </button>
</div>
</div>
</div>
</section>

<section className="col-span-12 lg:col-span-6">
<div className="bg-white border border-outline-variant rounded-xl p-6 clinical-shadow h-full">
<h3 className="font-headline-md text-headline-md text-on-surface mb-6">Recent Activity</h3>
<ul className="space-y-6">
<li className="flex gap-4">
<div className="relative">
<div className="w-8 h-8 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-sm">search</span>
</div>
<div className="absolute top-10 left-4 w-[1px] h-6 bg-outline-variant"></div>
</div>
<div>
<p className="font-label-md text-on-surface">Searched for "Insulin Pen"</p>
<p className="text-xs text-on-surface-variant">Yesterday at 4:30 PM</p>
</div>
</li>
<li className="flex gap-4">
<div className="relative">
<div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
<span className="material-symbols-outlined text-sm">check_circle</span>
</div>
<div className="absolute top-10 left-4 w-[1px] h-6 bg-outline-variant"></div>
</div>
<div>
<p className="font-label-md text-on-surface">Prescription Refill Request Accepted</p>
<p className="text-xs text-on-surface-variant">Aug 18, 2024</p>
</div>
</li>
<li className="flex gap-4">
<div>
<div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
<span className="material-symbols-outlined text-sm">description</span>
</div>
</div>
<div>
<p className="font-label-md text-on-surface">Health Profile Updated</p>
<p className="text-xs text-on-surface-variant">Aug 15, 2024</p>
</div>
</li>
</ul>
</div>
</section>

<section className="col-span-12 lg:col-span-6">
<div className="bg-primary text-on-primary rounded-xl p-6 clinical-shadow relative overflow-hidden h-full">

<div className="relative z-10">
<h3 className="font-headline-md text-headline-md mb-6">Health Insights</h3>
<div className="grid grid-cols-2 gap-4">
<div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
<p className="text-xs uppercase tracking-wider opacity-80 mb-1">Adherence</p>
<p className="text-2xl font-bold">94%</p>
<div className="w-full bg-white/20 h-1 mt-2 rounded-full">
<div className="bg-white h-full rounded-full" style={{width: '94%'}}></div>
</div>
</div>
<div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
<p className="text-xs uppercase tracking-wider opacity-80 mb-1">Next Check-up</p>
<p className="text-2xl font-bold">12 Days</p>
<p className="text-[10px] mt-1 opacity-70">Dr. Sarah Jenkins</p>
</div>
</div>
<button className="mt-6 w-full py-2 bg-white text-primary rounded-lg font-label-md hover:bg-surface-container transition-all">
                                View Full Health Report
                            </button>
</div>
</div>
</section>
</div>
</div>
</main>

<footer className="bg-surface-container-highest dark:bg-inverse-surface border-t border-outline-variant dark:border-outline mt-auto w-full md:ml-64 md:w-[calc(100%-16rem)]">
<div className="py-xl px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-max-width mx-auto">
<div className="space-y-4">
<h3 className="font-headline-lg text-headline-lg text-primary">MediFind</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                    Connecting users with the medicine they need through innovative pharmacy networks and user-first technology.
                </p>
</div>
<div className="flex flex-col md:items-end justify-between gap-4">
<nav className="flex flex-wrap gap-x-6 gap-y-2">
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Privacy Policy</a>
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Terms of Service</a>
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Pharmacy Portal</a>
<Link className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="/support">Support</Link>
</nav>
<p className="font-body-sm text-body-sm text-on-surface-variant dark:text-surface-variant">
                    © 2026 MediFind Healthcare Systems. All rights reserved.
                </p>
</div>
</div>
</footer>

      {/* Prescription Preview Modal */}
      {viewingPrescriptionUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-lg border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                <h3 className="text-title-lg font-bold text-on-surface">Attached Prescription</h3>
              </div>
              <button
                onClick={() => setViewingPrescriptionUrl(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto py-md flex items-center justify-center bg-black/5 rounded-xl my-md">
              {viewingPrescriptionUrl.startsWith("data:application/pdf") || viewingPrescriptionUrl.endsWith(".pdf") ? (
                <iframe src={viewingPrescriptionUrl} className="w-full h-96 rounded-lg" title="Prescription Document" />
              ) : (
                <img
                  src={viewingPrescriptionUrl}
                  alt="Uploaded Prescription"
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
            <div className="flex justify-end gap-3 pt-sm border-t border-outline-variant">
              <a
                href={viewingPrescriptionUrl}
                target="_blank"
                rel="noreferrer"
                download="prescription"
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md rounded-xl border border-outline-variant flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">download</span> Download File
              </a>
              <button
                onClick={() => setViewingPrescriptionUrl(null)}
                className="px-5 py-2 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary/95 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
