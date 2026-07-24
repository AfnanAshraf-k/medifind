"use client";

import { useState } from "react";

export default function PatientDashboardPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
<p className="font-label-md text-label-md text-on-surface">John Doe</p>
<p className="text-xs text-on-surface-variant">Verified Patient</p>
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
<h2 className="font-display text-display text-on-surface">Welcome back, John</h2>
<p className="font-body-md text-on-surface-variant mt-1">Here is a summary of your current health and prescription status.</p>
</div>
<div className="flex gap-md">
<button className="flex items-center gap-2 px-6 py-3 bg-white border border-outline-variant rounded-xl font-label-md text-primary hover:bg-surface-container transition-all clinical-shadow">
<span className="material-symbols-outlined">search</span>
                        Find Medicine
                    </button>
<button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-label-md hover:shadow-lg transition-all">
<span className="material-symbols-outlined">add</span>
                        New Order
                    </button>
</div>
</header>

<div className="bento-grid">

<section className="col-span-12 lg:col-span-8">
<div className="bg-white border border-outline-variant rounded-xl p-6 h-full clinical-shadow">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
<span className="material-symbols-outlined text-primary">pill</span>
                                Active Prescriptions
                            </h3>
<a className="text-primary font-label-md hover:underline" href="#">View All</a>
</div>
<div className="space-y-4">

<div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-outline-variant rounded-lg hover:border-primary-container transition-colors group">
<div className="flex items-center gap-4 mb-3 md:mb-0">
<div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: '\'FILL\' 1'}}>medical_services</span>
</div>
<div>
<p className="font-label-md text-on-surface">Lisinopril 10mg</p>
<p className="text-xs text-on-surface-variant">Take 1 tablet daily</p>
</div>
</div>
<div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Ready for Pickup</span>
<button className="text-primary-container group-hover:translate-x-1 transition-transform">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>

<div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-outline-variant rounded-lg hover:border-primary-container transition-colors group">
<div className="flex items-center gap-4 mb-3 md:mb-0">
<div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl" style={{fontVariationSettings: '\'FILL\' 1'}}>medication</span>
</div>
<div>
<p className="font-label-md text-on-surface">Atorvastatin 20mg</p>
<p className="text-xs text-on-surface-variant">Take at bedtime</p>
</div>
</div>
<div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
<span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">Refill Due (3 days)</span>
<button className="px-4 py-1.5 bg-primary-container text-white rounded-lg text-xs font-bold hover:bg-primary transition-colors">
                                        Refill Now
                                    </button>
</div>
</div>

<div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-outline-variant rounded-lg hover:border-primary-container transition-colors group opacity-75">
<div className="flex items-center gap-4 mb-3 md:mb-0">
<div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl">science</span>
</div>
<div>
<p className="font-label-md text-on-surface">Amoxicillin 500mg</p>
<p className="text-xs text-on-surface-variant">Course completed Aug 12</p>
</div>
</div>
<div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
<span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200">Archived</span>
<button className="text-primary-container group-hover:translate-x-1 transition-transform">
<span className="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
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
                    Connecting patients with the medicine they need through innovative pharmacy networks and patient-first technology.
                </p>
</div>
<div className="flex flex-col md:items-end justify-between gap-4">
<nav className="flex flex-wrap gap-x-6 gap-y-2">
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Privacy Policy</a>
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Terms of Service</a>
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Pharmacy Portal</a>
<a className="text-on-surface-variant dark:text-surface-variant font-body-sm text-body-sm hover:underline decoration-primary transition-all" href="#">Support</a>
</nav>
<p className="font-body-sm text-body-sm text-on-surface-variant dark:text-surface-variant">
                    © 2024 MediFind Healthcare Systems. All rights reserved.
                </p>
</div>
</div>
</footer>

    </div>
  );
}
