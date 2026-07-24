"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PharmacyInventoryDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [pharmacyName, setPharmacyName] = useState("City Central Pharmacy");

  useEffect(() => {
    async function loadProfileAndPharmacy() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile
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

        // Fetch pharmacy owned by this owner
        const { data: pharm } = await supabase
          .from("pharmacies")
          .select("name")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (pharm) {
          setPharmacyName(pharm.name);
        }
      }
    }
    loadProfileAndPharmacy();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="bg-surface text-on-surface">
<div className="flex min-h-screen">

<aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-low dark:bg-inverse-surface border-r border-outline-variant dark:border-outline flex flex-col py-md gap-sm z-50">
<div className="px-md mb-xl">
<h1 className="text-headline-sm font-headline-sm text-on-surface dark:text-on-primary-container">{pharmacyName}</h1>
<p className="text-body-sm font-body-sm text-on-surface-variant">Inventory Manager</p>
</div>
<nav className="flex-1 space-y-1">

<a className="bg-secondary-container text-on-secondary-container rounded-full mx-2 px-4 py-3 flex items-center gap-3 active:scale-95 transition-transform duration-150" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="text-label-md font-label-md">Dashboard</span>
</a>

<a className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-3 transition-colors active:scale-95 duration-150" href="#">
<span className="material-symbols-outlined">inventory_2</span>
<span className="text-label-md font-label-md">Inventory</span>
</a>

<a className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-3 transition-colors active:scale-95 duration-150" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="text-label-md font-label-md">Orders</span>
</a>

<a className="text-on-surface-variant hover:bg-surface-variant rounded-full mx-2 px-4 py-3 flex items-center gap-3 transition-colors active:scale-95 duration-150" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="text-label-md font-label-md">Settings</span>
</a>
<button
  onClick={handleLogout}
  className="flex text-error hover:bg-red-50 rounded-full mx-2 px-4 py-3 items-center gap-3 transition-colors active:scale-95 duration-150 text-left w-[calc(100%-1rem)]"
>
  <span className="material-symbols-outlined">logout</span>
  <span className="text-label-md font-label-md font-bold">Sign Out</span>
</button>
</nav>
<div className="px-md mt-auto pt-md">
<button className="w-full bg-primary text-on-primary py-3 rounded-xl flex items-center justify-center gap-2 font-label-md hover:bg-surface-tint transition-all active:scale-95">
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
<span className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim">MediFind</span>
<nav className="hidden md:flex gap-lg items-center">
<a className="text-primary font-label-md border-b-2 border-primary pb-1 hover:text-primary-container transition-colors" href="#">Dashboard</a>
<a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors" href="#">Find Medicine</a>
<a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors" href="#">Pharmacies</a>
</nav>
</div>
<div className="flex items-center gap-md">
<div className="relative hidden lg:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="pl-10 pr-4 py-2 bg-surface-container rounded-full border-none focus:ring-2 focus:ring-primary text-body-sm w-64" placeholder="Quick search inventory..." type="text"/>
</div>
<button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">notifications</button>
<button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">location_on</button>
<div className="h-8 w-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-md">
                            {profile ? profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "JD"}
                        </div>
</div>
</div>
</header>

<div className="p-xl max-w-max-width mx-auto w-full space-y-xl">

<div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h2 className="text-display font-display text-on-surface">Inventory Dashboard</h2>
<p className="text-body-md font-body-md text-on-surface-variant">Manage and monitor your pharmacy's medical stock levels in real-time.</p>
</div>
<div className="flex gap-md">
<button className="flex items-center gap-2 px-md py-3 border border-outline text-on-surface font-label-md rounded-lg hover:bg-surface-container transition-all">
<span className="material-symbols-outlined">download</span>
                            Export Report
                        </button>
<button className="flex items-center gap-2 px-md py-3 bg-primary text-on-primary font-label-md rounded-lg hover:bg-surface-tint shadow-sm transition-all active:scale-95">
<span className="material-symbols-outlined">add</span>
                            New Entry
                        </button>
</div>
</div>

<section className="grid grid-cols-1 md:grid-cols-3 gap-lg">

<div className="p-xl bg-surface border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-sm transition-shadow">
<div className="flex justify-between items-start">
<div>
<p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Total Items</p>
<h3 className="text-display font-display mt-sm">2,842</h3>
</div>
<div className="p-3 bg-primary-fixed text-on-primary-fixed rounded-xl">
<span className="material-symbols-outlined">inventory</span>
</div>
</div>
<div className="mt-xl flex items-center gap-2 text-green-600 font-label-sm">
<span className="material-symbols-outlined text-sm">trending_up</span>
<span className="">+12 new products this week</span>
</div>
</div>

<div className="p-xl bg-error-container text-on-error-container border border-error/20 rounded-xl flex flex-col justify-between">
<div className="flex justify-between items-start">
<div>
<p className="text-label-md font-label-md text-on-error-container opacity-80 uppercase tracking-wider">Out of Stock Alerts</p>
<h3 className="text-display font-display mt-sm text-on-error-container">14</h3>
</div>
<div className="p-3 bg-error text-on-error rounded-xl">
<span className="material-symbols-outlined">warning</span>
</div>
</div>
<div className="mt-xl">
<button className="text-label-sm font-label-sm underline decoration-2 underline-offset-4 decoration-error/30 hover:decoration-error transition-all">Review critical shortages</button>
</div>
</div>

<div className="p-xl bg-surface-container-high border border-outline-variant rounded-xl overflow-hidden relative">
<div className="relative z-10">
<p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Recent Searches</p>
<div className="mt-md space-y-sm">
<div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg text-body-sm">
<span className="material-symbols-outlined text-sm">history</span>
<span className="">Amoxicillin 500mg</span>
</div>
<div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg text-body-sm">
<span className="material-symbols-outlined text-sm">history</span>
<span className="">Insulin Glargine</span>
</div>
<div className="flex items-center gap-3 p-2 bg-surface/50 rounded-lg text-body-sm">
<span className="material-symbols-outlined text-sm">history</span>
<span className="">Atorvastatin</span>
</div>
</div>
</div>
<div className="absolute -right-4 -bottom-4 opacity-10">
<span className="material-symbols-outlined text-[120px]">search</span>
</div>
</div>
</section>

<section className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
<div className="px-xl py-lg border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-container-low">
<h4 className="text-headline-md font-headline-md">Inventory Master List</h4>
<div className="flex gap-sm">
<button className="px-md py-2 bg-surface border border-outline rounded-lg text-body-sm flex items-center gap-2 hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[18px]">filter_list</span>
                                Filter
                            </button>
<button className="px-md py-2 bg-surface border border-outline rounded-lg text-body-sm flex items-center gap-2 hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[18px]">sort</span>
                                Sort
                            </button>
</div>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="bg-surface-container-highest border-b border-outline-variant">
<th className="px-xl py-md text-label-md font-label-md text-on-surface-variant">Medicine Name</th>
<th className="px-md py-md text-label-md font-label-md text-on-surface-variant">SKU</th>
<th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Category</th>
<th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Stock Level</th>
<th className="px-md py-md text-label-md font-label-md text-on-surface-variant">Last Updated</th>
<th className="px-xl py-md text-label-md font-label-md text-on-surface-variant text-right">Actions</th>
</tr>
</thead>
<tbody className="text-body-sm divide-y divide-outline-variant">
<tr className="zebra-row hover:bg-primary-fixed/30 transition-colors">
<td className="px-xl py-md">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-secondary">pill</span>
</div>
<div>
<p className="font-bold text-on-surface">Amoxicillin 500mg</p>
<p className="text-xs text-on-surface-variant">Capsule • 30ct</p>
</div>
</div>
</td>
<td className="px-md py-md font-mono text-xs">AMX-500-CAP</td>
<td className="px-md py-md">
<span className="px-2 py-1 bg-surface-container-high rounded text-label-sm">Antibiotics</span>
</td>
<td className="px-md py-md">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="font-bold">420 units</span>
<span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full font-bold uppercase">Optimal</span>
</div>
<div className="w-32 bg-outline-variant rounded-full h-1.5 overflow-hidden">
<div className="bg-green-500 h-full" style={{width: '85%'}}></div>
</div>
</div>
</td>
<td className="px-md py-md text-on-surface-variant">2 hours ago</td>
<td className="px-xl py-md text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">edit</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-error ml-2 transition-colors">delete</button>
</td>
</tr>
<tr className="zebra-row hover:bg-primary-fixed/30 transition-colors">
<td className="px-xl py-md">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-secondary">vaccines</span>
</div>
<div>
<p className="font-bold text-on-surface">Lantus Solostar</p>
<p className="text-xs text-on-surface-variant">Insulin Injection • 5-Pack</p>
</div>
</div>
</td>
<td className="px-md py-md font-mono text-xs">LNT-SS-5PK</td>
<td className="px-md py-md">
<span className="px-2 py-1 bg-surface-container-high rounded text-label-sm">Diabetes</span>
</td>
<td className="px-md py-md">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="font-bold">8 units</span>
<span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] rounded-full font-bold uppercase">Critical</span>
</div>
<div className="w-32 bg-outline-variant rounded-full h-1.5 overflow-hidden">
<div className="bg-error h-full" style={{width: '15%'}}></div>
</div>
</div>
</td>
<td className="px-md py-md text-on-surface-variant">6 hours ago</td>
<td className="px-xl py-md text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">edit</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-error ml-2 transition-colors">delete</button>
</td>
</tr>
<tr className="zebra-row hover:bg-primary-fixed/30 transition-colors">
<td className="px-xl py-md">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded bg-secondary-container flex items-center justify-center">
<span className="material-symbols-outlined text-secondary">medical_services</span>
</div>
<div>
<p className="font-bold text-on-surface">Atorvastatin 20mg</p>
<p className="text-xs text-on-surface-variant">Tablet • 90ct</p>
</div>
</div>
</td>
<td className="px-md py-md font-mono text-xs">ATR-V20-90T</td>
<td className="px-md py-md">
<span className="px-2 py-1 bg-surface-container-high rounded text-label-sm">Cholesterol</span>
</td>
<td className="px-md py-md">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="font-bold">1,200 units</span>
<span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] rounded-full font-bold uppercase">Normal</span>
</div>
<div className="w-32 bg-outline-variant rounded-full h-1.5 overflow-hidden">
<div className="bg-secondary h-full" style={{width: '60%'}}></div>
</div>
</div>
</td>
<td className="px-md py-md text-on-surface-variant">Yesterday</td>
<td className="px-xl py-md text-right">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">edit</button>
<button className="material-symbols-outlined text-on-surface-variant hover:text-error ml-2 transition-colors">delete</button>
</td>
</tr>
</tbody>
</table>
</div>
<div className="px-xl py-md border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
<span className="text-body-sm text-on-surface-variant">Showing 1-10 of 2,842 items</span>
<div className="flex items-center gap-sm">
<button className="p-2 border border-outline rounded hover:bg-surface-container transition-colors disabled:opacity-50" disabled>
<span className="material-symbols-outlined">chevron_left</span>
</button>
<button className="px-4 py-2 bg-primary text-on-primary rounded font-label-sm">1</button>
<button className="px-4 py-2 hover:bg-surface-container rounded font-label-sm">2</button>
<button className="px-4 py-2 hover:bg-surface-container rounded font-label-sm">3</button>
<span className="px-2">...</span>
<button className="px-4 py-2 hover:bg-surface-container rounded font-label-sm">285</button>
<button className="p-2 border border-outline rounded hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</section>

<footer className="w-full mt-xl bg-surface-container-highest dark:bg-inverse-surface flat no shadows">
<div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center">
<div className="mb-md md:mb-0">
<span className="text-label-md font-label-md font-bold text-on-surface">MediFind</span>
<p className="text-body-sm font-body-sm text-on-surface-variant mt-1">© 2024 MediFind Clinical Solutions. All rights reserved.</p>
</div>
<div className="flex flex-wrap justify-center gap-lg">
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">Terms of Service</a>
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">Contact Pharmacy Support</a>
</div>
</div>
</footer>
</div>
</main>
</div>

    </div>
  );
}
