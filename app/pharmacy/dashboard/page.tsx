"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function PharmacyInventoryDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"inventory" | "orders">("inventory");
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile and pharmacy states
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [myPharmacy, setMyPharmacy] = useState<any>(null);
  const [pharmacyLoading, setPharmacyLoading] = useState(true);

  // Pharmacy creation form states
  const [newPharmName, setNewPharmName] = useState("");
  const [newPharmAddress, setNewPharmAddress] = useState("");
  const [newPharmPhone, setNewPharmPhone] = useState("");
  const [newPharmLat, setNewPharmLat] = useState("10.8878");
  const [newPharmLng, setNewPharmLng] = useState("76.0732");
  const [actionLoading, setActionLoading] = useState(false);

  // Inventory lists
  const [stockList, setStockList] = useState<any[]>([]);
  const [medicineCatalog, setMedicineCatalog] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [price, setPrice] = useState("10.00");
  const [errorMsg, setErrorMsg] = useState("");

  // Custom medicine states
  const [customName, setCustomName] = useState("");
  const [customGeneric, setCustomGeneric] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Rx Preview Modal state
  const [viewingRx, setViewingRx] = useState<{ url: string; userName: string; medName: string } | null>(null);

  const loadProfileAndPharmacy = async () => {
    setPharmacyLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || user.email?.split("@")[0] || "User",
          email: profileData.email || user.email || "",
        });
      }

      const { data: pharm } = await supabase
        .from("pharmacies")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (pharm) {
        setMyPharmacy(pharm);
        setNewPharmName(pharm.name);
      }
    }
    setPharmacyLoading(false);
  };

  const loadInventory = async () => {
    if (!myPharmacy?.id) return;
    setInventoryLoading(true);
    const { data, error } = await supabase
      .from("pharmacy_stock")
      .select(`
        id,
        quantity,
        price,
        status,
        updated_at,
        medicine:medicines(*)
      `)
      .eq("pharmacy_id", myPharmacy.id);

    if (!error && data) {
      setStockList(data);
    }
    setInventoryLoading(false);
  };

  const loadOrders = async () => {
    if (!myPharmacy?.id) return;
    setOrdersLoading(true);
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          quantity,
          status,
          created_at,
          prescription_url,
          user:profiles(id, full_name, email),
          pharmacy_stock:pharmacy_stock_id!inner(
            id,
            price,
            medicine:medicines(*)
          )
        `)
        .eq("pharmacy_stock.pharmacy_id", myPharmacy.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrdersList(data || []);
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      loadOrders();
      loadInventory();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update order status");
    }
  };

  const loadMedicinesCatalog = async () => {
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .order("name");
    if (!error && data) {
      setMedicineCatalog(data);
    }
  };

  useEffect(() => {
    loadProfileAndPharmacy();
  }, [supabase]);

  useEffect(() => {
    if (myPharmacy?.id) {
      loadInventory();
      loadMedicinesCatalog();
      loadOrders();
    }
  }, [myPharmacy?.id, activeTab]);

  // Realtime subscription setup
  useEffect(() => {
    if (!myPharmacy?.id) return;

    const channel = supabase
      .channel("stock-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pharmacy_stock",
          filter: `pharmacy_id=eq.${myPharmacy.id}`,
        },
        () => {
          loadInventory();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        () => {
          loadOrders();
          loadInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ordersChannel);
    };
  }, [myPharmacy?.id, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleCreatePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("pharmacies")
        .insert({
          owner_id: user.id,
          name: newPharmName,
          address: newPharmAddress,
          phone: newPharmPhone,
          lat: parseFloat(newPharmLat) || 10.8878,
          lng: parseFloat(newPharmLng) || 76.0732,
          hours: {
            monday_friday: "08:00 AM - 10:00 PM",
            saturday: "09:00 AM - 08:00 PM",
            sunday: "Closed",
          },
          rating: 4.5,
          review_count: 1,
          is_open: true,
        })
        .select()
        .single();

      if (error) throw error;
      setMyPharmacy(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create pharmacy profile.");
    } finally {
      setActionLoading(false);
    }
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedMedId("");
    setQuantity("100");
    setPrice("10.00");
    setCustomName("");
    setCustomGeneric("");
    setCustomCategory("");
    setErrorMsg("");
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setModalMode("edit");
    setEditingItem(item);
    setQuantity(item.quantity.toString());
    setPrice(item.price.toString());
    setErrorMsg("");
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      if (modalMode === "create") {
        let medicineId = selectedMedId;

        if (!medicineId) {
          setErrorMsg("Please select a medicine or add a custom one.");
          return;
        }

        if (medicineId === "custom") {
          if (!customName) {
            setErrorMsg("Custom medicine name is required.");
            return;
          }
          // Insert medicine first
          const { data: newMed, error: medErr } = await supabase
            .from("medicines")
            .insert({
              name: customName,
              generic_name: customGeneric || null,
              category: customCategory || null,
            })
            .select()
            .single();

          if (medErr) throw medErr;
          medicineId = newMed.id;
        }

        // Insert stock entry
        const { error: stockErr } = await supabase.from("pharmacy_stock").insert({
          pharmacy_id: myPharmacy.id,
          medicine_id: medicineId,
          quantity: parseInt(quantity) || 0,
          price: parseFloat(price) || 0,
        });

        if (stockErr) throw stockErr;
      } else {
        // Edit flow
        const { error: stockErr } = await supabase
          .from("pharmacy_stock")
          .update({
            quantity: parseInt(quantity) || 0,
            price: parseFloat(price) || 0,
          })
          .eq("id", editingItem.id);

        if (stockErr) throw stockErr;
      }

      setShowModal(false);
      loadInventory();
      loadMedicinesCatalog();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update inventory.");
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    if (!confirm("Are you sure you want to delete this stock entry?")) return;
    try {
      const { error } = await supabase.from("pharmacy_stock").delete().eq("id", stockId);
      if (error) throw error;
      loadInventory();
    } catch (err: any) {
      alert(err.message || "Failed to delete entry.");
    }
  };

  if (pharmacyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-on-surface-variant font-body-md">Loading pharmacy configuration...</p>
      </div>
    );
  }

  // Pharmacy owner must have registered a pharmacy first
  if (!myPharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-white border border-outline-variant p-8 rounded-xl shadow-sm space-y-4">
          <h2 className="text-headline-lg font-display text-on-surface mb-2">Register Your Pharmacy</h2>
          <p className="text-body-md text-on-surface-variant mb-6">
            Create your pharmacy profile to start managing inventory.
          </p>
          {errorMsg && <p className="text-error text-body-sm">{errorMsg}</p>}
          <form onSubmit={handleCreatePharmacy} className="space-y-4">
            <div>
              <label className="block text-label-md font-bold mb-1">Pharmacy Name</label>
              <input
                required
                type="text"
                className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest"
                placeholder="City Central Pharmacy"
                value={newPharmName}
                onChange={(e) => setNewPharmName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-label-md font-bold mb-1">Address</label>
              <input
                required
                type="text"
                className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest"
                placeholder="123 Health Ave, London"
                value={newPharmAddress}
                onChange={(e) => setNewPharmAddress(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-label-md font-bold mb-1">Phone Number</label>
              <input
                required
                type="text"
                className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest"
                placeholder="+44 20 7946 0958"
                value={newPharmPhone}
                onChange={(e) => setNewPharmPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-label-md font-bold mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest"
                  value={newPharmLat}
                  onChange={(e) => setNewPharmLat(e.target.value)}
                  placeholder="10.8878"
                />
              </div>
              <div>
                <label className="block text-label-md font-bold mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest"
                  value={newPharmLng}
                  onChange={(e) => setNewPharmLng(e.target.value)}
                  placeholder="76.0732"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md hover:bg-surface-tint transition-all"
              disabled={actionLoading}
            >
              {actionLoading ? "Registering..." : "Register Pharmacy"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate stats dynamically
  const totalItems = stockList.reduce((acc, item) => acc + item.quantity, 0);
  const outOfStockAlerts = stockList.filter((item) => item.status === "out_of_stock").length;

  return (
    <div className="bg-surface text-on-surface">
      <div className="flex min-h-screen">
        <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low dark:bg-inverse-surface border-r border-outline-variant dark:border-outline flex flex-col py-md gap-sm z-50">
          <div className="px-md mb-xl">
            <h1 className="text-headline-sm font-headline-sm text-on-surface dark:text-on-primary-container">
              {myPharmacy.name}
            </h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">Inventory Manager</p>
          </div>
          <nav className="flex-grow space-y-1">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-[calc(100%-1rem)] rounded-full mx-2 px-4 py-3 flex items-center gap-3 active:scale-95 transition-transform duration-150 text-left ${
                activeTab === "inventory"
                  ? "bg-secondary-container text-on-secondary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">inventory_2</span>
              <span className="text-label-md font-label-md">Inventory Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`w-[calc(100%-1rem)] rounded-full mx-2 px-4 py-3 flex items-center gap-3 active:scale-95 transition-transform duration-150 text-left ${
                activeTab === "orders"
                  ? "bg-secondary-container text-on-secondary-container font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="text-label-md font-label-md">User Reservations</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex text-error hover:bg-red-50 rounded-full mx-2 px-4 py-3 items-center gap-3 transition-colors active:scale-95 duration-150 text-left w-[calc(100%-1rem)] mt-2"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-label-md font-label-md font-bold">Sign Out</span>
            </button>
          </nav>
          <div className="px-md mt-auto pt-md">
            <button
              onClick={openCreateModal}
              className="w-full bg-primary text-on-primary py-3 rounded-xl flex items-center justify-center gap-2 font-label-md hover:bg-surface-tint transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">add</span>
              Update Stock
            </button>
            <div className="mt-md flex items-center justify-between p-3 bg-surface rounded-lg border border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-label-sm font-label-sm">Sync with POS</span>
              </div>
              <span className="material-symbols-outlined text-label-md text-on-surface-variant">sync</span>
            </div>
          </div>
        </aside>

        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          <header className="w-full top-0 sticky z-40 bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline flat no shadows">
            <div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto">
              <div className="flex items-center gap-xl">
                <span className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">
                  MediFind
                </span>
                <nav className="hidden md:flex gap-lg items-center">
                  <a
                    className="text-primary font-label-md border-b-2 border-primary pb-1 hover:text-primary-container transition-colors"
                    href="#"
                  >
                    Dashboard
                  </a>
                  <a
                    className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors"
                    href="/search"
                  >
                    Find Medicine
                  </a>
                  <a
                    className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors"
                    href="#"
                  >
                    Pharmacies
                  </a>
                </nav>
              </div>
              <div className="flex items-center gap-md">
                <div className="relative hidden lg:block">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    search
                  </span>
                  <input
                    className="pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-body-sm w-64"
                    placeholder="Quick search inventory..."
                    type="text"
                  />
                </div>
                <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
                  notifications
                </button>
                <button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
                  location_on
                </button>
                <div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md">
                  {profile
                    ? profile.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "JD"}
                </div>
              </div>
            </div>
          </header>

          <div className="p-xl max-w-max-width mx-auto w-full space-y-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
              <div>
                <h2 className="text-display font-display text-on-surface">Inventory Dashboard</h2>
                <p className="text-body-md font-body-md text-on-surface-variant">
                  Manage and monitor your pharmacy's medical stock levels in real-time.
                </p>
              </div>
              <div className="flex gap-md">
                <button className="flex items-center gap-2 px-md py-3 border border-outline text-on-surface font-label-md rounded-lg hover:bg-surface-container transition-all">
                  <span className="material-symbols-outlined">download</span>
                  Export Report
                </button>
                <button
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-md py-3 bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint shadow-sm transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined">add</span>
                  New Entry
                </button>
              </div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              <div className="p-xl bg-surface border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-sm transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
                      Total Items
                    </p>
                    <h3 className="text-display font-display mt-sm">
                      {inventoryLoading ? "..." : totalItems.toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-3 bg-primary-fixed text-on-primary-fixed rounded-xl">
                    <span className="material-symbols-outlined">inventory</span>
                  </div>
                </div>
                <div className="mt-xl flex items-center gap-2 text-green-600 font-label-sm">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span>{stockList.length} distinct medicines registered</span>
                </div>
              </div>

              <div className="p-xl bg-error-container text-on-error-container border border-error/20 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-label-md font-label-md text-on-error-container opacity-80 uppercase tracking-wider">
                      Out of Stock Alerts
                    </p>
                    <h3 className="text-display font-display mt-sm text-on-error-container">
                      {inventoryLoading ? "..." : outOfStockAlerts}
                    </h3>
                  </div>
                  <div className="p-3 bg-error text-on-error rounded-xl">
                    <span className="material-symbols-outlined">warning</span>
                  </div>
                </div>
                <div className="mt-xl">
                  <button className="text-label-sm font-label-sm underline decoration-2 underline-offset-4 decoration-error/30 hover:decoration-error transition-all">
                    Review critical shortages
                  </button>
                </div>
              </div>

              <div className="p-xl bg-surface-container-high border border-outline-variant rounded-xl overflow-hidden relative">
                <div className="relative z-10">
                  <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">
                    Recent Searches
                  </p>
                  <div className="mt-md space-y-sm">
                    <div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg text-body-sm">
                      <span className="material-symbols-outlined text-sm">history</span>
                      <span>Amoxicillin 500mg</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg text-body-sm">
                      <span className="material-symbols-outlined text-sm">history</span>
                      <span>Lantus Solostar</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg text-body-sm">
                      <span className="material-symbols-outlined text-sm">history</span>
                      <span>Atorvastatin</span>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-[120px]">search</span>
                </div>
              </div>
            </section>

            <section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm text-on-surface">
              <div className="px-xl py-lg border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-container-low">
                <h4 className="text-headline-md font-headline-md">
                  {activeTab === "inventory" ? "Inventory Master List" : "Active Medicine Reservations"}
                </h4>
                <div className="flex gap-sm">
                  <button className="px-md py-2 bg-surface border border-outline rounded-lg text-body-sm flex items-center gap-2 hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    Filter
                  </button>
                  <button 
                    onClick={() => {
                      if (activeTab === "inventory") loadInventory();
                      else loadOrders();
                    }}
                    className="px-md py-2 bg-surface border border-outline rounded-lg text-body-sm flex items-center gap-2 hover:bg-surface-container transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Refresh
                  </button>
                </div>
              </div>

              {activeTab === "inventory" ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-highest border-b border-outline-variant">
                          <th className="px-xl py-md text-label-md font-label-md text-on-surface-variant">Medicine Name</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">SKU</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Category</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Stock Level</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Last Updated</th>
                          <th className="px-xl py-md text-label-md font-label-md text-on-surface-variant text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-body-sm divide-y divide-outline-variant">
                        {inventoryLoading ? (
                          <tr>
                            <td colSpan={6} className="px-xl py-8 text-center text-on-surface-variant">
                              Loading inventory...
                            </td>
                          </tr>
                        ) : stockList.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-xl py-8 text-center text-on-surface-variant">
                              No items in inventory. Click "New Entry" to add medicine stock.
                            </td>
                          </tr>
                        ) : (
                          stockList.map((item) => (
                            <tr key={item.id} className="zebra-row hover:bg-primary-fixed/30 transition-colors">
                              <td className="px-xl py-md">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center animate-in fade-in">
                                    <span className="material-symbols-outlined text-secondary">
                                      {item.medicine.category?.toLowerCase().includes("diabet") ||
                                      item.medicine.category?.toLowerCase().includes("insulin")
                                        ? "vaccines"
                                        : "pill"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-bold text-on-surface">{item.medicine.name}</p>
                                    <p className="text-xs text-on-surface-variant">
                                      {item.medicine.generic_name || "Generic"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-md py-md font-mono text-xs">{item.id.slice(0, 8).toUpperCase()}</td>
                              <td className="px-md py-md">
                                <span className="px-2 py-1 bg-surface-container-high rounded text-label-sm">
                                  {item.medicine.category || "Uncategorized"}
                                </span>
                              </td>
                              <td className="px-md py-md">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{item.quantity} units</span>
                                    <span
                                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                                        item.status === "in_stock"
                                          ? "bg-green-100 text-green-700"
                                          : item.status === "low_stock"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-error-container text-on-error-container"
                                      }`}
                                    >
                                      {item.status === "in_stock"
                                        ? "Optimal"
                                        : item.status === "low_stock"
                                        ? "Low Stock"
                                        : "Out of Stock"}
                                    </span>
                                  </div>
                                  <div className="w-32 bg-outline-variant rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        item.status === "in_stock"
                                          ? "bg-green-500"
                                          : item.status === "low_stock"
                                          ? "bg-amber-500"
                                          : "bg-error"
                                      }`}
                                      style={{ width: `${Math.min(100, Math.max(5, (item.quantity / 500) * 100))}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-md py-md text-on-surface-variant">{formatTime(item.updated_at)}</td>
                              <td className="px-xl py-md text-right">
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                                >
                                  edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStock(item.id)}
                                  className="material-symbols-outlined text-on-surface-variant hover:text-error ml-2 transition-colors"
                                >
                                  delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-xl py-md border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
                    <span className="text-body-sm text-on-surface-variant">
                      Showing 1-{stockList.length} of {stockList.length} items
                    </span>
                    <div className="flex items-center gap-sm">
                      <button className="p-2 border border-outline rounded hover:bg-surface-container transition-colors disabled:opacity-50" disabled>
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button className="px-4 py-2 bg-primary text-on-primary rounded font-label-sm">1</button>
                      <button className="p-2 border border-outline rounded hover:bg-surface-container transition-colors" disabled>
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="overflow-x-auto animate-in fade-in duration-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-highest border-b border-outline-variant">
                          <th className="px-xl py-md text-label-md font-label-md text-on-surface-variant">User Name</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Medicine Name</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Quantity</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Total Price</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Prescription</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Reserved Date</th>
                          <th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Status</th>
                          <th className="px-xl py-md text-label-md font-label-md text-on-surface-variant text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-body-sm divide-y divide-outline-variant">
                        {ordersLoading ? (
                          <tr>
                            <td colSpan={8} className="px-xl py-8 text-center text-on-surface-variant">
                              Loading reservations...
                            </td>
                          </tr>
                        ) : ordersList.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-xl py-8 text-center text-on-surface-variant">
                              No active reservations found for your pharmacy.
                            </td>
                          </tr>
                        ) : (
                          ordersList.map((order) => {
                            const stock = order.pharmacy_stock;
                            const medicine = Array.isArray(stock?.medicine) ? stock.medicine[0] : stock?.medicine;
                            const patient = order.user;

                            if (!medicine) return null;

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
                              <tr key={order.id} className="zebra-row hover:bg-primary-fixed/30 transition-colors">
                                <td className="px-xl py-md font-semibold">
                                  {patient?.full_name || patient?.email || "Unknown User"}
                                </td>
                                <td className="px-md py-md font-bold text-primary">{medicine.name}</td>
                                <td className="px-md py-md font-bold">{order.quantity} units</td>
                                <td className="px-md py-md font-bold text-on-surface">
                                  £{(stock.price * order.quantity).toFixed(2)}
                                </td>
                                <td className="px-md py-md">
                                  {order.prescription_url ? (
                                    <button
                                      onClick={() => setViewingRx({
                                        url: order.prescription_url,
                                        userName: patient?.full_name || patient?.email || "User",
                                        medName: medicine.name
                                      })}
                                      className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-primary/20"
                                    >
                                      <span className="material-symbols-outlined text-xs">description</span> View Rx
                                    </button>
                                  ) : (
                                    <span className="text-xs text-on-surface-variant italic">No Rx Attached</span>
                                  )}
                                </td>
                                <td className="px-md py-md text-on-surface-variant">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-md py-md">
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[order.status] || "bg-amber-100 text-amber-700"}`}>
                                    {statusLabels[order.status] || order.status}
                                  </span>
                                </td>
                                <td className="px-xl py-md text-right space-x-2">
                                  {order.status === "pending" && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                                      className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-all active:scale-95"
                                    >
                                      Ready
                                    </button>
                                  )}
                                  {order.status === "ready" && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, "collected")}
                                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-all active:scale-95"
                                    >
                                      Collected
                                    </button>
                                  )}
                                  {(order.status === "pending" || order.status === "ready") && (
                                    <button
                                      onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                      className="px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded text-xs font-bold transition-all active:scale-95"
                                    >
                                      Cancel
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
                  <div className="px-xl py-md border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
                    <span className="text-body-sm text-on-surface-variant">
                      Showing 1-{ordersList.length} of {ordersList.length} reservations
                    </span>
                  </div>
                </>
              )}
            </section>

            <footer className="w-full mt-xl bg-surface-container-highest dark:bg-inverse-surface flat no shadows">
              <div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center">
                <div className="mb-md md:mb-0">
                  <span className="text-label-md font-label-md font-bold text-on-surface">MediFind</span>
                  <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                    © 2026 MediFind Clinical Solutions. All rights reserved.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-lg">
                  <a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">
                    Privacy Policy
                  </a>
                  <a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">
                    Terms of Service
                  </a>
                  <Link className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="/support">
                    Contact Pharmacy Support
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </main>

        {/* Prescription Verification Modal for Pharmacy Staff */}
        {viewingRx && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-xl w-full p-lg border border-outline-variant shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center pb-md border-b border-outline-variant">
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">clinical_notes</span>
                    Prescription Document
                  </h3>
                  <p className="text-body-xs text-on-surface-variant mt-0.5">
                    For: <span className="font-semibold text-on-surface">{viewingRx.userName}</span> • Medicine: <span className="font-semibold text-primary">{viewingRx.medName}</span>
                  </p>
                </div>
                <button
                  onClick={() => setViewingRx(null)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-auto py-md flex items-center justify-center bg-black/5 rounded-xl my-md">
                {viewingRx.url.startsWith("data:application/pdf") || viewingRx.url.endsWith(".pdf") ? (
                  <iframe src={viewingRx.url} className="w-full h-96 rounded-lg" title="Prescription Document" />
                ) : (
                  <img
                    src={viewingRx.url}
                    alt="Prescription"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-sm border-t border-outline-variant">
                <span className="text-body-xs text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-green-600">verified</span> Verified document upload
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingRx.url}
                    target="_blank"
                    rel="noreferrer"
                    download="prescription"
                    className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md rounded-xl border border-outline-variant flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span> Download
                  </a>
                  <button
                    onClick={() => setViewingRx(null)}
                    className="px-5 py-2 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary/95 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New/Edit Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white border border-outline-variant rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-headline-md font-display text-on-surface">
              {modalMode === "create" ? "New Inventory Entry" : "Edit Stock Entry"}
            </h3>
            {errorMsg && <p className="text-error text-body-sm">{errorMsg}</p>}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {modalMode === "create" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-label-sm font-bold mb-1">Select Medicine</label>
                    <select
                      className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest text-on-surface"
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose from Catalog --</option>
                      {medicineCatalog.map((med) => (
                        <option key={med.id} value={med.id}>
                          {med.name} ({med.category || "Uncategorized"})
                        </option>
                      ))}
                      <option value="custom">-- Add Custom Medicine --</option>
                    </select>
                  </div>

                  {selectedMedId === "custom" && (
                    <div className="p-3 bg-surface-container-low rounded-lg space-y-3 border border-outline-variant">
                      <div>
                        <label className="block text-body-xs font-bold mb-1">Medicine Name</label>
                        <input
                          required
                          type="text"
                          className="w-full border border-outline-variant rounded-lg p-2 bg-white text-on-surface placeholder:text-outline"
                          placeholder="e.g. Ibuprofen 400mg"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-body-xs font-bold mb-1">Generic Name</label>
                        <input
                          type="text"
                          className="w-full border border-outline-variant rounded-lg p-2 bg-white text-on-surface placeholder:text-outline"
                          placeholder="e.g. Ibuprofen"
                          value={customGeneric}
                          onChange={(e) => setCustomGeneric(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-body-xs font-bold mb-1">Category</label>
                        <input
                          type="text"
                          className="w-full border border-outline-variant rounded-lg p-2 bg-white text-on-surface placeholder:text-outline"
                          placeholder="e.g. Pain Reliever"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-label-sm font-bold mb-1">Medicine</label>
                  <p className="font-semibold text-lg text-on-surface">{editingItem?.medicine?.name}</p>
                </div>
              )}

              <div>
                <label className="block text-label-sm font-bold mb-1">Quantity</label>
                <input
                  required
                  type="number"
                  min="0"
                  className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest text-on-surface"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-label-sm font-bold mb-1">Price (£)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest text-on-surface"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline rounded-lg text-body-sm font-bold text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-body-sm font-bold hover:bg-surface-tint active:scale-95 transition-all"
                >
                  {modalMode === "create" ? "Add Stock" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
