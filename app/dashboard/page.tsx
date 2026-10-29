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
      if (!user) {
        router.push("/login");
        return;
      }
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
    loadProfileAndData();
  }, []);

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to cancel this reservation?")) return;
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

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

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    ready: "bg-green-100 text-green-700 border-green-200",
    collected: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending Review",
    ready: "Ready for Pickup",
    collected: "Collected",
    cancelled: "Cancelled",
  };

  const activeReservations = reservations.filter(r => r.status === "pending" || r.status === "ready");
  const completedReservations = reservations.filter(r => r.status === "collected" || r.status === "cancelled");

  return (
    <div className="bg-surface text-on-surface">
      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-50 bg-surface border-b border-outline-variant px-margin-mobile h-16 flex items-center justify-between">
        <h1 className="font-display text-headline-md text-primary">MediFind</h1>
        <button
          className="material-symbols-outlined text-primary"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          menu
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`h-screen w-64 fixed left-0 top-0 bg-surface-container-low flex-col py-xl border-r border-outline-variant transition-transform duration-300 md:flex z-[60] ${mobileNavOpen ? "flex w-full" : "hidden"}`}>
        <div className="px-6 mb-8">
          <h2 className="font-display text-display text-primary">MediFind</h2>
        </div>

        {/* User info */}
        <div className="px-6 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="overflow-hidden">
            <p className="font-label-md text-on-surface truncate">{profile ? profile.full_name : "Loading..."}</p>
            <p className="text-xs text-on-surface-variant truncate">{profile?.email}</p>
          </div>
        </div>

        <nav className="flex-grow flex flex-col gap-1 px-2">
          <a
            className="flex items-center gap-3 px-4 py-3 bg-secondary-container text-on-secondary-container rounded-full transition-all cursor-pointer"
            href="#"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md">Dashboard</span>
          </a>
          <Link
            href="/search"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all"
          >
            <span className="material-symbols-outlined">search</span>
            <span className="font-label-md">Find Medicine</span>
          </Link>
          <Link
            href="/support"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all"
          >
            <span className="material-symbols-outlined">support_agent</span>
            <span className="font-label-md">Support</span>
          </Link>
        </nav>

        {/* Sign out at bottom */}
        <div className="px-2 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-error hover:bg-red-50 rounded-full transition-all text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 min-h-screen pb-xl">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop pt-xl">

          {/* Page header */}
          <header className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
            <div>
              <h2 className="font-display text-display text-on-surface">
                Welcome back, {profile ? profile.full_name.split(" ")[0] : "..."}
              </h2>
              <p className="font-body-md text-on-surface-variant mt-1">
                Track your medicine reservations and find new medications.
              </p>
            </div>
            <div className="flex gap-md">
              <Link
                href="/search"
                className="flex items-center gap-2 px-6 py-3 bg-white border border-outline-variant rounded-xl font-label-md text-primary hover:bg-surface-container transition-all clinical-shadow"
              >
                <span className="material-symbols-outlined">search</span>
                Find Medicine
              </Link>
              <Link
                href="/search"
                className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md hover:shadow-lg transition-all"
              >
                <span className="material-symbols-outlined">add</span>
                New Reservation
              </Link>
            </div>
          </header>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-xl">
            <div className="bg-white border border-outline-variant rounded-xl p-4 clinical-shadow">
              <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Total Reservations</p>
              <p className="text-2xl font-bold text-on-surface">{loadingReservations ? "—" : reservations.length}</p>
            </div>
            <div className="bg-white border border-outline-variant rounded-xl p-4 clinical-shadow">
              <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Active</p>
              <p className="text-2xl font-bold text-amber-600">{loadingReservations ? "—" : activeReservations.length}</p>
            </div>
            <div className="bg-white border border-outline-variant rounded-xl p-4 clinical-shadow">
              <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Collected</p>
              <p className="text-2xl font-bold text-green-600">
                {loadingReservations ? "—" : reservations.filter(r => r.status === "collected").length}
              </p>
            </div>
            <div className="bg-white border border-outline-variant rounded-xl p-4 clinical-shadow">
              <p className="text-xs text-on-surface-variant uppercase tracking-wide mb-1">Cancelled</p>
              <p className="text-2xl font-bold text-slate-500">
                {loadingReservations ? "—" : reservations.filter(r => r.status === "cancelled").length}
              </p>
            </div>
          </div>

          {/* Reservations list */}
          <section className="bg-white border border-outline-variant rounded-xl p-6 clinical-shadow">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                My Medicine Reservations
              </h3>
              <button
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) loadReservations(user.id);
                }}
                className="text-primary font-label-md hover:underline flex items-center gap-1 text-sm"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Refresh
              </button>
            </div>

            {loadingReservations ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl animate-spin block mb-2">progress_activity</span>
                Loading your reservations...
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant border border-dashed border-outline-variant rounded-xl">
                <span className="material-symbols-outlined text-4xl text-outline mb-3 block">receipt_long</span>
                <p className="font-label-md text-on-surface mb-1">No reservations yet</p>
                <p className="text-sm text-on-surface-variant mb-4">Find a medicine and reserve it from a nearby pharmacy.</p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1 text-primary font-label-sm hover:underline"
                >
                  Search for medicine →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map((res: any) => {
                  const stock = res.pharmacy_stock;
                  const medicine = Array.isArray(stock?.medicine) ? stock.medicine[0] : stock?.medicine;
                  const pharmacy = Array.isArray(stock?.pharmacy) ? stock.pharmacy[0] : stock?.pharmacy;

                  if (!medicine || !pharmacy) return null;

                  return (
                    <div
                      key={res.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-outline-variant rounded-xl hover:border-primary/30 hover:bg-surface-container-low transition-colors gap-3"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-primary flex-shrink-0">
                          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                            medication
                          </span>
                        </div>
                        <div>
                          <p className="font-label-md text-on-surface font-semibold">{medicine.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {pharmacy.name} · Qty: {res.quantity}
                          </p>
                          <p className="text-[10px] text-outline mt-0.5">
                            Reserved on {new Date(res.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                        {stock?.price != null && (
                          <div className="text-right hidden md:block mr-1">
                            <span className="font-semibold text-on-surface text-sm">
                              ₹{(stock.price * res.quantity).toFixed(2)}
                            </span>
                            <p className="text-[10px] text-on-surface-variant">Total</p>
                          </div>
                        )}
                        {res.prescription_url && (
                          <button
                            onClick={() => setViewingPrescriptionUrl(res.prescription_url)}
                            className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high text-primary rounded-lg text-xs font-semibold flex items-center gap-1 border border-outline-variant transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">description</span>
                            View Rx
                          </button>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[res.status] ?? statusColors.pending}`}>
                          {statusLabels[res.status] ?? res.status}
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
                })}
              </div>
            )}
          </section>

        </div>
      </main>

      {/* Prescription Preview Modal */}
      {viewingPrescriptionUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-lg border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center pb-md border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">description</span>
                <h3 className="font-bold text-on-surface">Attached Prescription</h3>
              </div>
              <button
                onClick={() => setViewingPrescriptionUrl(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto py-md flex items-center justify-center bg-black/5 rounded-xl my-md">
              {viewingPrescriptionUrl.endsWith(".pdf") || viewingPrescriptionUrl.startsWith("data:application/pdf") ? (
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
                <span className="material-symbols-outlined text-sm">download</span>
                Download
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
