"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type AdminTab = "overview" | "approvals" | "pharmacies" | "users" | "reservations" | "medicines" | "audit";

export default function MasterAdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Platform stats
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalCustomers: 0,
    totalPharmacies: 0,
    pendingApprovals: 0,
    approvedPharmacies: 0,
    rejectedPharmacies: 0,
    activeReservations: 0,
    expiredReservations: 0,
    collectedReservations: 0,
    cancelledReservations: 0,
    totalMedicines: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Tab data states
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [pharmaciesList, setPharmaciesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reservationsList, setReservationsList] = useState<any[]>([]);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modal / Action states
  const [rejectModal, setRejectModal] = useState<{ open: boolean; pharmacy: any; reason: string }>({
    open: false,
    pharmacy: null,
    reason: "",
  });
  const [pharmacyDetailModal, setPharmacyDetailModal] = useState<any>(null);
  const [medicineModal, setMedicineModal] = useState<{ open: boolean; mode: "create" | "edit"; data: any }>({
    open: false,
    mode: "create",
    data: { name: "", generic_name: "", category: "Antibiotics", image_url: "" },
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Notification / expiry cron status
  const [expiryRunning, setExpiryRunning] = useState(false);

  // 1. Initial Authentication & Verification
  useEffect(() => {
    async function checkAdmin() {
      setLoadingAdmin(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_suspended")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin" || profile.is_suspended) {
        window.location.href = "/admin/login?error=unauthorized";
        return;
      }

      setAdminUser(profile);
      setLoadingAdmin(false);
      loadStats();
    }

    checkAdmin();
  }, []);

  // 2. Load tab data whenever activeTab changes
  useEffect(() => {
    if (!loadingAdmin) {
      setSearchQuery("");
      setFilterStatus("all");
      loadTabData(activeTab);
    }
  }, [activeTab, loadingAdmin]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTabData = async (tab: AdminTab, search = "", status = "all") => {
    setTabLoading(true);
    try {
      if (tab === "overview") {
        await loadStats();
        // Also fetch top 5 pending approvals for overview card
        const res = await fetch("/api/admin/pharmacies?status=pending&limit=5");
        if (res.ok) {
          const data = await res.json();
          setPendingList(data.pharmacies || []);
        }
      } else if (tab === "approvals") {
        const res = await fetch("/api/admin/pharmacies?status=pending");
        if (res.ok) {
          const data = await res.json();
          setPendingList(data.pharmacies || []);
        }
      } else if (tab === "pharmacies") {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "all") params.set("status", status);
        const res = await fetch(`/api/admin/pharmacies?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPharmaciesList(data.pharmacies || []);
        }
      } else if (tab === "users") {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "all") params.set("role", status);
        const res = await fetch(`/api/admin/users?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setUsersList(data.users || []);
        }
      } else if (tab === "reservations") {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        const res = await fetch(`/api/admin/reservations?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setReservationsList(data.reservations || []);
        }
      } else if (tab === "medicines") {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/medicines?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMedicinesList(data.medicines || []);
        }
      } else if (tab === "audit") {
        const params = new URLSearchParams();
        if (status !== "all") params.set("action", status);
        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAuditLogsList(data.logs || []);
        }
      }
    } catch (err: any) {
      console.error(`Error loading ${tab}:`, err);
    } finally {
      setTabLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setBannerNotice({ type, message });
    setTimeout(() => setBannerNotice(null), 5000);
  };

  // -------------------------------------------------------------
  // Admin Action Handlers
  // -------------------------------------------------------------
  const handleApprovePharmacy = async (pharmacyId: string, name: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", pharmacyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showNotification("success", `Pharmacy "${name}" has been approved successfully.`);
      loadStats();
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to approve pharmacy.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal.pharmacy) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          pharmacyId: rejectModal.pharmacy.id,
          reason: rejectModal.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showNotification("success", `Pharmacy "${rejectModal.pharmacy.name}" has been rejected.`);
      setRejectModal({ open: false, pharmacy: null, reason: "" });
      loadStats();
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to reject pharmacy.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePharmacySuspension = async (pharmacy: any) => {
    const action = pharmacy.is_suspended ? "reactivate" : "suspend";
    const promptMsg = pharmacy.is_suspended
      ? `Reactivate pharmacy "${pharmacy.name}"?`
      : `Are you sure you want to suspend pharmacy "${pharmacy.name}"? Their listings will be hidden from customer search results.`;

    if (!confirm(promptMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, pharmacyId: pharmacy.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showNotification("success", data.message);
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePharmacy = async (pharmacy: any) => {
    if (!confirm(`CAUTION: Permanently delete pharmacy "${pharmacy.name}" and all its inventory listings? This action cannot be undone.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/pharmacies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", pharmacyId: pharmacy.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPharmaciesList((prev) => prev.filter((p) => p.id !== pharmacy.id));
      showNotification("success", data.message);
      loadStats();
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserSuspension = async (user: any) => {
    const action = user.is_suspended ? "reactivate" : "suspend";
    const promptMsg = user.is_suspended
      ? `Reactivate account for ${user.email}?`
      : `Are you sure you want to suspend user ${user.email}? They will be blocked from logging in.`;

    if (!confirm(promptMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showNotification("success", data.message);
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete account for ${user.email}? This action is permanent.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsersList((prev) => prev.filter((u) => u.id !== user.id));
      showNotification("success", data.message);
      loadStats();
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async (resItem: any) => {
    const reason = prompt("Enter cancellation reason for customer & pharmacy notification:", "Administrative oversight cancellation");
    if (reason === null) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reservationId: resItem.id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showNotification("success", data.message);
      loadStats();
      loadTabData(activeTab);
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload: any = {
        action: medicineModal.mode === "edit" ? "update" : medicineModal.mode,
        name: medicineModal.data.name,
        genericName: medicineModal.data.generic_name,
        category: medicineModal.data.category,
        imageUrl: medicineModal.data.image_url,
      };
      if (medicineModal.mode === "edit") {
        payload.medicineId = medicineModal.data.id;
      }

      const res = await fetch("/api/admin/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (medicineModal.mode === "create" && data.medicine) {
        setMedicinesList((prev) => [data.medicine, ...prev]);
      } else if (data.medicine) {
        setMedicinesList((prev) => prev.map((m) => (m.id === data.medicine.id ? data.medicine : m)));
      }

      showNotification("success", `Medicine catalog updated successfully.`);
      setMedicineModal({ open: false, mode: "create", data: {} });
      loadTabData("medicines");
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMedicine = async (med: any) => {
    if (!confirm(`Delete "${med.name}" from the global medicine catalog? Existing stock entries referencing it will be affected.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", medicineId: med.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMedicinesList((prev) => prev.filter((m) => m.id !== med.id));
      showNotification("success", data.message);
      loadTabData("medicines");
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunExpiryEngine = async () => {
    setExpiryRunning(true);
    try {
      const res = await fetch("/api/cron/expire-reservations", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showNotification("success", `Expiry Engine executed: ${data.expiredCount} overdue reservation(s) marked as expired and stock released.`);
      loadStats();
      if (activeTab === "reservations" || activeTab === "overview") {
        loadTabData(activeTab);
      }
    } catch (err: any) {
      showNotification("error", err.message || "Failed to trigger expiry engine.");
    } finally {
      setExpiryRunning(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  if (loadingAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin">progress_activity</span>
          <p className="text-sm font-medium tracking-wide text-slate-300">Verifying administrative security clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      {/* Top Banner Alert */}
      {bannerNotice && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium border animate-in slide-in-from-top ${
            bannerNotice.type === "success" ? "bg-emerald-900 text-emerald-100 border-emerald-700" : "bg-red-900 text-red-100 border-red-700"
          }`}
        >
          <span className="material-symbols-outlined text-lg">{bannerNotice.type === "success" ? "check_circle" : "error"}</span>
          <span>{bannerNotice.message}</span>
          <button onClick={() => setBannerNotice(null)} className="ml-2 hover:opacity-75">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Admin Top Navigation */}
      <header className="bg-slate-900 text-white h-16 border-b border-slate-800 sticky top-0 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
            <span className="font-display font-bold text-lg text-white">MediFind Master Control</span>
          </Link>
          <span className="hidden md:inline-block text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
            SUPER-ADMIN
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleRunExpiryEngine}
            disabled={expiryRunning}
            title="Execute reservation expiry sweep immediately"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all"
          >
            <span className={`material-symbols-outlined text-sm ${expiryRunning ? "animate-spin text-amber-400" : "text-amber-400"}`}>
              schedule
            </span>
            {expiryRunning ? "Running Sweep..." : "Run Expiry Engine"}
          </button>

          <Link
            href="/"
            target="_blank"
            className="hidden lg:flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span>Live Site</span>
            <span className="material-symbols-outlined text-xs">open_in_new</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-slate-900 font-bold text-xs flex items-center justify-center">
              {adminUser?.full_name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight text-white">{adminUser?.full_name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{adminUser?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of master admin portal"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col py-4 flex-shrink-0">
          <nav className="flex-1 px-3 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "overview" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Overview & Stats</span>
            </button>

            <button
              onClick={() => setActiveTab("approvals")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "approvals" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Pharmacy Approvals</span>
              </div>
              {stats.pendingApprovals > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats.pendingApprovals}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("pharmacies")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "pharmacies" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">local_pharmacy</span>
              <span>Pharmacy Network</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "users" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">people</span>
              <span>User Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab("reservations")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "reservations" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>Reservations</span>
              </div>
              {stats.activeReservations > 0 && (
                <span className="bg-slate-700 text-slate-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {stats.activeReservations}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("medicines")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "medicines" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">medication</span>
              <span>Medicine Catalog</span>
            </button>

            <div className="pt-3 pb-1">
              <div className="h-px bg-slate-800 mx-2" />
            </div>

            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "audit" ? "bg-primary text-slate-950 shadow-md font-bold" : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="material-symbols-outlined text-base">history</span>
              <span>Security Audit Log</span>
            </button>
          </nav>

          <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-400">MediFind Engine v2.4</p>
            <p>Database: Live Cloud</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Overview</h1>
                <p className="text-xs text-slate-500 mt-1">Real-time status across patient network, pharmacy partners, and order lifecycles.</p>
              </div>

              {/* Top Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
                    <span className="material-symbols-outlined text-primary text-xl">group</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.totalUsers}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{stats.totalCustomers} Patients registered</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Pharmacies</span>
                    <span className="material-symbols-outlined text-emerald-600 text-xl">store</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{stats.totalPharmacies}</p>
                  <p className="text-[11px] text-emerald-600 mt-1">{stats.approvedPharmacies} Approved & active</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  {stats.pendingApprovals > 0 && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500 m-2 animate-ping" />}
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
                    <span className="material-symbols-outlined text-amber-500 text-xl">hourglass_empty</span>
                  </div>
                  <p className="text-3xl font-extrabold text-amber-600">{stats.pendingApprovals}</p>
                  <button
                    onClick={() => setActiveTab("approvals")}
                    className="text-[11px] text-primary font-semibold hover:underline mt-1 block"
                  >
                    Review requests &rarr;
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Orders</span>
                    <span className="material-symbols-outlined text-blue-600 text-xl">pending_actions</span>
                  </div>
                  <p className="text-3xl font-extrabold text-blue-600">{stats.activeReservations}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{stats.collectedReservations} Picked up successfully</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Expired Orders</span>
                    <span className="material-symbols-outlined text-slate-400 text-xl">timer_off</span>
                  </div>
                  <p className="text-3xl font-extrabold text-slate-700">{stats.expiredReservations}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Stock auto-released</p>
                </div>
              </div>

              {/* Action Banner for Pending Approvals */}
              {stats.pendingApprovals > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">notifications_active</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-amber-900">
                        {stats.pendingApprovals} Pharmacy Registration Request{stats.pendingApprovals > 1 ? "s" : ""} Awaiting Approval
                      </h3>
                      <p className="text-xs text-amber-700 mt-0.5">
                        New pharmacy partners cannot log in or publish medicine stock until verified by super-admin oversight.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("approvals")}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
                  >
                    Open Approval Queue
                  </button>
                </div>
              )}

              {/* Quick Actions & Recent Pending Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">verified_user</span>
                      Recent Registration Queue
                    </h2>
                    <button
                      onClick={() => setActiveTab("approvals")}
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {pendingList.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl">
                      <span className="material-symbols-outlined text-3xl text-slate-300 block mb-1">task_alt</span>
                      All pharmacy registration requests are reviewed and up to date!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {pendingList.slice(0, 5).map((pharm) => (
                        <div key={pharm.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{pharm.name}</p>
                            <p className="text-xs text-slate-500 truncate">
                              License: <span className="font-mono text-slate-700">{pharm.license_number || "Not Submitted"}</span> • {pharm.address}
                            </p>
                            <p className="text-[10px] text-slate-400">Owner: {pharm.owner?.email || "Unknown"}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleApprovePharmacy(pharm.id, pharm.name)}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, pharmacy: pharm, reason: "" })}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-200 rounded-lg text-xs font-bold transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expiry Engine & Policy Control Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-amber-500 text-xl">auto_timer</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Reservation Expiry Engine</h3>
                      <p className="text-[11px] text-slate-500">Automated stock recovery scheduler</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2">
                    <p>
                      Overdue medicine reservations (past their <span className="font-mono font-bold">expires_at</span> window) are marked as <span className="font-bold text-amber-600">EXPIRED</span> and their held stock is automatically released back to the pharmacy inventory.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                      <p className="font-semibold text-slate-700">Platform Expiry Policy:</p>
                      <p>• Default window: 24 hours</p>
                      <p>• Allowed pharmacy range: 1 to 72 hours</p>
                      <p>• Cron endpoint: <span className="font-mono text-slate-600">/api/cron/expire-reservations</span></p>
                    </div>
                  </div>

                  <button
                    onClick={handleRunExpiryEngine}
                    disabled={expiryRunning}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className={`material-symbols-outlined text-sm ${expiryRunning ? "animate-spin" : ""}`}>
                      {expiryRunning ? "progress_activity" : "bolt"}
                    </span>
                    {expiryRunning ? "Releasing Overdue Stock..." : "Trigger Manual Sweep Now"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHARMACY APPROVAL QUEUE */}
          {activeTab === "approvals" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pharmacy Approval Requests</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Every registering pharmacy must be approved before it can log in or list inventory in search results.
                  </p>
                </div>
                <button
                  onClick={() => loadTabData("approvals")}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5 self-start"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Refresh List
                </button>
              </div>

              {tabLoading ? (
                <div className="py-20 text-center text-slate-500 text-xs">
                  <span className="material-symbols-outlined text-3xl animate-spin text-primary block mb-2">progress_activity</span>
                  Loading registration requests...
                </div>
              ) : pendingList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-3xl">done_all</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Zero Pending Registrations</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    All pharmacy requests have been verified. New registrations will automatically appear here for approval.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingList.map((pharm) => (
                    <div key={pharm.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 mb-1.5">
                              Awaiting Approval
                            </span>
                            <h3 className="text-base font-bold text-slate-900">{pharm.name}</h3>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Applied {new Date(pharm.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                          <p className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                            <span className="font-semibold text-slate-700">License Number:</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded text-slate-900">
                              {pharm.license_number || "Not Provided"}
                            </span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                            <span className="truncate">{pharm.address}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">call</span>
                            <span>{pharm.phone || "No phone entered"}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                            <span>Owner: {pharm.owner?.full_name} ({pharm.owner?.email})</span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => setRejectModal({ open: true, pharmacy: pharm, reason: "" })}
                          disabled={actionLoading}
                          className="px-4 py-2 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition-all"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleApprovePharmacy(pharm.id, pharm.name)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          Approve Pharmacy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PHARMACY MANAGEMENT */}
          {activeTab === "pharmacies" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pharmacy Network Management</h1>
                  <p className="text-xs text-slate-500 mt-1">Oversight over registered pharmacy listings, verification statuses, and compliance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search name, phone, license..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadTabData("pharmacies", searchQuery, filterStatus)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-primary w-48 sm:w-60"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      loadTabData("pharmacies", searchQuery, e.target.value);
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved Only</option>
                    <option value="pending">Pending Approval</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={() => loadTabData("pharmacies", searchQuery, filterStatus)}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Filter
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Pharmacy</th>
                        <th className="px-5 py-3.5">License & Contact</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Expiry Window</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabLoading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">Loading pharmacies...</td>
                        </tr>
                      ) : pharmaciesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">No pharmacies found.</td>
                        </tr>
                      ) : (
                        pharmaciesList.map((pharm) => (
                          <tr key={pharm.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900 text-sm">{pharm.name}</p>
                              <p className="text-slate-500 text-[11px] truncate max-w-xs">{pharm.address}</p>
                              <p className="text-[10px] text-slate-400">Owner: {pharm.owner?.email}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-mono text-slate-800">{pharm.license_number || "—"}</p>
                              <p className="text-slate-500 text-[11px]">{pharm.phone || "No phone"}</p>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    pharm.status === "approved"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : pharm.status === "pending"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {pharm.status}
                                </span>
                                {pharm.is_suspended && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-white">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono text-slate-700">
                              {pharm.reservation_expiry_hours || 24} hours
                            </td>
                            <td className="px-5 py-4 text-right space-x-1.5">
                              {pharm.status === "pending" && (
                                <button
                                  onClick={() => handleApprovePharmacy(pharm.id, pharm.name)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleTogglePharmacySuspension(pharm)}
                                className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                                  pharm.is_suspended
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                                }`}
                              >
                                {pharm.is_suspended ? "Unsuspend" : "Suspend"}
                              </button>
                              <button
                                onClick={() => handleDeletePharmacy(pharm)}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Accounts Directory</h1>
                  <p className="text-xs text-slate-500 mt-1">View, search, suspend, reactivate, and manage customer and partner profiles.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadTabData("users", searchQuery, filterStatus)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-primary w-48 sm:w-60"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      loadTabData("users", searchQuery, e.target.value);
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Patients Only</option>
                    <option value="pharmacy">Pharmacy Staff</option>
                    <option value="admin">Administrators</option>
                  </select>
                  <button
                    onClick={() => loadTabData("users", searchQuery, filterStatus)}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Filter
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">User</th>
                        <th className="px-5 py-3.5">Role</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Joined Date</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabLoading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">Loading user accounts...</td>
                        </tr>
                      ) : usersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">No users found.</td>
                        </tr>
                      ) : (
                        usersList.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{user.full_name || "No name"}</p>
                              <p className="text-slate-500 text-[11px] font-mono">{user.email}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  user.role === "admin"
                                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                                    : user.role === "pharmacy"
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {user.is_suspended ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                                  Suspended
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-500 text-[11px]">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4 text-right space-x-1.5">
                              {user.id !== adminUser?.id && (
                                <>
                                  <button
                                    onClick={() => handleToggleUserSuspension(user)}
                                    className={`px-2.5 py-1 rounded text-xs font-bold border transition-colors ${
                                      user.is_suspended
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                                        : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                                    }`}
                                  >
                                    {user.is_suspended ? "Reactivate" : "Suspend"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-colors"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RESERVATIONS OVERSIGHT */}
          {activeTab === "reservations" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Reservations Oversight</h1>
                  <p className="text-xs text-slate-500 mt-1">Monitor, review, and cancel any patient reservation across the network.</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      loadTabData("reservations", "", e.target.value);
                    }}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="ready">Ready for Pickup</option>
                    <option value="collected">Collected</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => loadTabData("reservations", "", filterStatus)}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Medicine & Pharmacy</th>
                        <th className="px-5 py-3.5">Customer</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Expiry Time</th>
                        <th className="px-5 py-3.5">Prescription</th>
                        <th className="px-5 py-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabLoading ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">Loading reservations...</td>
                        </tr>
                      ) : reservationsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">No reservations found.</td>
                        </tr>
                      ) : (
                        reservationsList.map((resItem) => {
                          const med = (resItem.pharmacy_stock as any)?.medicine;
                          const pharm = (resItem.pharmacy_stock as any)?.pharmacy;
                          const isExpired = resItem.expires_at && new Date(resItem.expires_at) <= new Date() && (resItem.status === "pending" || resItem.status === "ready");

                          return (
                            <tr key={resItem.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4">
                                <p className="font-bold text-slate-900">{med?.name || "Medicine"}</p>
                                <p className="text-slate-500 text-[11px]">{pharm?.name} • Qty: {resItem.quantity}</p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-800">{resItem.user?.full_name || "Patient"}</p>
                                <p className="text-slate-400 text-[11px] font-mono">{resItem.user?.email}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                    resItem.status === "ready"
                                      ? "bg-green-100 text-green-800 border-green-200"
                                      : resItem.status === "collected"
                                      ? "bg-blue-100 text-blue-800 border-blue-200"
                                      : resItem.status === "expired" || isExpired
                                      ? "bg-slate-100 text-slate-600 border-slate-300"
                                      : resItem.status === "cancelled"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : "bg-amber-100 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  {isExpired ? "EXPIRED (PENDING SWEEP)" : resItem.status}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-slate-600">
                                {resItem.expires_at ? (
                                  <div>
                                    <p className="font-mono text-[11px]">{new Date(resItem.expires_at).toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400">
                                      {new Date(resItem.expires_at) > new Date()
                                        ? `Expires in ${Math.round((new Date(resItem.expires_at).getTime() - Date.now()) / (1000 * 60 * 60))}h`
                                        : "Past deadline"}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                {resItem.prescription_url ? (
                                  <a
                                    href={resItem.prescription_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
                                  >
                                    <span className="material-symbols-outlined text-xs">description</span> View Rx
                                  </a>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">No Rx Required</span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {(resItem.status === "pending" || resItem.status === "ready") && (
                                  <button
                                    onClick={() => handleCancelReservation(resItem)}
                                    className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded text-xs font-bold transition-all"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MEDICINE CATALOG MODERATION */}
          {activeTab === "medicines" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medicine Catalog Moderation</h1>
                  <p className="text-xs text-slate-500 mt-1">Manage platform medications, generic naming, and categorization standards.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search medication name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && loadTabData("medicines", searchQuery)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-primary w-48 sm:w-60"
                  />
                  <button
                    onClick={() => {
                      setMedicineModal({
                        open: true,
                        mode: "create",
                        data: { name: "", generic_name: "", category: "Antibiotics", image_url: "" },
                      });
                    }}
                    className="px-4 py-2 bg-primary text-slate-950 font-bold rounded-xl text-xs shadow-sm hover:bg-primary/90 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> Add Medicine
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Medicine Name</th>
                        <th className="px-5 py-3.5">Generic Chemical Name</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tabLoading ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">Loading catalog...</td>
                        </tr>
                      ) : medicinesList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">No medicines found.</td>
                        </tr>
                      ) : (
                        medicinesList.map((med) => (
                          <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-900">{med.name}</td>
                            <td className="px-5 py-4 text-slate-600 font-mono">{med.generic_name || "—"}</td>
                            <td className="px-5 py-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {med.category || "General"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right space-x-2">
                              <button
                                onClick={() => setMedicineModal({ open: true, mode: "edit", data: med })}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(med)}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY AUDIT LOG */}
          {activeTab === "audit" && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Administrative Audit Log</h1>
                  <p className="text-xs text-slate-500 mt-1">Immutable trail of administrative overrides, approvals, and moderation actions.</p>
                </div>
                <button
                  onClick={() => loadTabData("audit")}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3.5">Timestamp</th>
                        <th className="px-5 py-3.5">Administrator</th>
                        <th className="px-5 py-3.5">Action Executed</th>
                        <th className="px-5 py-3.5">Target</th>
                        <th className="px-5 py-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {tabLoading ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">Loading audit entries...</td>
                        </tr>
                      ) : auditLogsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">No audit events recorded yet.</td>
                        </tr>
                      ) : (
                        auditLogsList.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-slate-800 font-semibold">{log.admin_email}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-900 border border-slate-300">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600">
                              {log.target_type} ({log.target_id ? log.target_id.slice(0, 8) : "—"})
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 truncate max-w-xs font-sans text-xs">
                              {JSON.stringify(log.details)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-xl">block</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Pharmacy Registration</h3>
                <p className="text-xs text-slate-500">For {rejectModal.pharmacy?.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Please state why this registration is being rejected. This reason will be saved in the record and shown to the pharmacy owner when they attempt to sign in.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                placeholder="e.g. License number is unverified with the medical licensing registry."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, pharmacy: null, reason: "" })}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MEDICINE MODAL */}
      {medicineModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {medicineModal.mode === "create" ? "Add New Medicine to Catalog" : "Edit Medicine"}
            </h3>

            <form onSubmit={handleSaveMedicine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name / Dosage *</label>
                <input
                  required
                  type="text"
                  value={medicineModal.data.name || ""}
                  onChange={(e) => setMedicineModal({ ...medicineModal, data: { ...medicineModal.data, name: e.target.value } })}
                  placeholder="e.g. Amoxicillin 500mg"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Generic Chemical Name</label>
                <input
                  type="text"
                  value={medicineModal.data.generic_name || ""}
                  onChange={(e) => setMedicineModal({ ...medicineModal, data: { ...medicineModal.data, generic_name: e.target.value } })}
                  placeholder="e.g. Amoxicillin Trihydrate"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={medicineModal.data.category || ""}
                  onChange={(e) => setMedicineModal({ ...medicineModal, data: { ...medicineModal.data, category: e.target.value } })}
                  placeholder="e.g. Antibiotics, Blood Pressure, Diabetes"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMedicineModal({ open: false, mode: "create", data: {} })}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {actionLoading ? "Saving..." : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

