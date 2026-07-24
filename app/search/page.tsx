"use client";

import { useState } from "react";

export default function SearchResultsPage() {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
<header className="w-full top-0 sticky z-50 bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline flat no shadows">
<div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto">
<div className="flex items-center gap-8">
<span className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim cursor-pointer">MediFind</span>
<nav className="hidden md:flex gap-6">
<a className="text-primary font-label-md border-b-2 border-primary pb-1 transition-all cursor-pointer" href="#">Find Medicine</a>
<a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors cursor-pointer" href="#">Pharmacies</a>
<a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors cursor-pointer" href="#">Support</a>
</nav>
</div>
<div className="flex items-center gap-4">
<div className="hidden sm:flex items-center bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant">
<span className="material-symbols-outlined text-on-surface-variant mr-2" style={{fontSize: '20px'}}>search</span>
<input className="bg-transparent border-none focus:ring-0 text-body-sm w-48 text-on-surface" type="text" value="Amoxicillin 500mg"/>
</div>
<div className="flex items-center gap-2">
<button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">location_on</button>
<button className="material-symbols-outlined p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-all">notifications</button>
</div>
<button className="hidden lg:block bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md hover:opacity-90 active:opacity-80 transition-all">Pharmacy Login</button>
</div>
</div>
</header>
<main className="max-w-max-width mx-auto px-gutter py-xl">

<div className="mb-xl flex flex-col md:flex-row md:items-end justify-between gap-md">
<div>
<h1 className="text-headline-lg font-headline-lg text-on-background mb-1">Amoxicillin 500mg</h1>
<p className="text-on-surface-variant text-body-md">Showing 14 pharmacies near <span className="font-semibold text-on-surface">London, UK</span></p>
</div>
<div className="flex items-center gap-sm bg-surface-container rounded-full p-1 border border-outline-variant">
<button
  onClick={() => setView("list")}
  className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all ${view === "list" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-variant"}`}
>
<span className="material-symbols-outlined" style={{fontSize: '18px'}}>list</span> List View
                </button>
<button
  onClick={() => setView("map")}
  className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all ${view === "map" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-variant"}`}
>
<span className="material-symbols-outlined" style={{fontSize: '18px'}}>map</span> Map View
                </button>
</div>
</div>
<div className="flex flex-col lg:flex-row gap-xl">

<aside className="w-full lg:w-72 flex-shrink-0 space-y-xl">
<section className="bg-white p-lg rounded-xl border border-outline-variant">
<h2 className="text-label-md text-on-surface uppercase tracking-wider mb-md">Filters</h2>

<div className="mb-lg">
<label className="flex items-center gap-3 cursor-pointer group">
<input checked className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" type="checkbox"/>
<span className="text-body-md text-on-surface group-hover:text-primary transition-colors">In Stock Only</span>
</label>
</div>
<div className="space-y-lg">

<div>
<div className="flex justify-between items-center mb-sm">
<span className="font-label-md text-on-surface">Distance</span>
<span className="text-label-sm text-primary">5 miles</span>
</div>
<input className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-full cursor-pointer" max="25" min="1" type="range" value="5"/>
</div>

<div>
<div className="flex justify-between items-center mb-sm">
<span className="font-label-md text-on-surface">Max Price</span>
<span className="text-label-sm text-primary">£20.00</span>
</div>
<input className="w-full accent-primary h-1.5 bg-surface-container-highest rounded-full cursor-pointer" max="50" min="5" type="range" value="20"/>
</div>

<div>
<span className="font-label-md text-on-surface block mb-sm">Pharmacy Type</span>
<div className="space-y-base">
<label className="flex items-center gap-3 cursor-pointer group">
<input className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" type="checkbox"/>
<span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Open Now</span>
</label>
<label className="flex items-center gap-3 cursor-pointer group">
<input className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" type="checkbox"/>
<span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">24-Hour Access</span>
</label>
<label className="flex items-center gap-3 cursor-pointer group">
<input className="w-5 h-5 rounded border-outline text-primary focus:ring-primary" type="checkbox"/>
<span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Drive-thru Available</span>
</label>
</div>
</div>
</div>
<button className="w-full mt-xl py-3 border border-primary text-primary rounded-lg font-label-md hover:bg-surface-container transition-all">Clear All Filters</button>
</section>

<div className="bg-primary-container/10 p-md rounded-xl border border-primary/20">
<div className="flex gap-3">
<span className="material-symbols-outlined text-primary">info</span>
<div>
<p className="text-label-md text-primary font-bold">Clinical Advice</p>
<p className="text-body-sm text-on-surface-variant mt-1">Always check your prescription details. Stock levels are updated every 30 minutes by our partner pharmacies.</p>
</div>
</div>
</div>
</aside>

<div className={`flex-grow space-y-md ${view !== "list" ? "hidden" : ""}`}>

<div className="bg-white clinical-card p-lg rounded-xl border border-outline-variant flex flex-col md:flex-row gap-lg">
<div className="w-full md:w-48 h-32 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="A clean, professional photograph of a modern pharmacy storefront with large glass windows showing a brightly lit interior. The branding is minimalist and clinical with a soft blue and white color scheme. The building is part of a contemporary urban streetscape during daylight with clear, soft lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBCAtnmXXIcZgT-iOX2LNNgXmDCl2jFlB-XaVKfi9OzKDX4CSKmmBV8uoKy3Z9ACMieoncmzz-6XT8GcK1bioJ7jmFOPGA0Pbn-ooQSvgGq4dvXOpBI_bEltlaH72yW7bJIdMf36Bxe0tunGkWiUqGDCtJTl-7on_eaRG4lAX3sG3K2cTpLSO9WIDmGk36SJMFZj0pBa4nIZGvNhnQSwSt7IB3cbxMWbj7FN66MwrkejhOejIhyX6VZ"/>
</div>
<div className="flex-grow">
<div className="flex justify-between items-start mb-base">
<div>
<h3 className="text-headline-md text-on-surface">MediLink Central Pharmacy</h3>
<div className="flex items-center gap-2 mt-1">
<span className="text-label-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined" style={{fontSize: '16px'}}>star</span> 4.8 (124 reviews)
                                    </span>
<span className="text-outline">•</span>
<span className="text-label-sm text-on-surface-variant">0.4 miles away</span>
</div>
</div>
<div className="text-right">
<span className="text-headline-md text-primary font-bold">£12.50</span>
<p className="text-label-sm text-on-surface-variant">Estimated Price</p>
</div>
</div>
<div className="mt-md flex flex-wrap gap-sm items-center">
<span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-label-sm font-bold flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-green-500"></span> In Stock
                            </span>
<span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">Updated 12 mins ago</span>
<span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">Open until 9:00 PM</span>
</div>
<div className="mt-lg flex gap-md">
<button className="flex-grow md:flex-none bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all">Reserve Medicine</button>
<button className="flex-grow md:flex-none border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-label-md hover:bg-surface-variant active:scale-95 transition-all">Get Directions</button>
</div>
</div>
</div>

<div className="bg-white clinical-card p-lg rounded-xl border border-outline-variant flex flex-col md:flex-row gap-lg">
<div className="w-full md:w-48 h-32 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="A close-up high-resolution photo of a pharmacy counter interior with organized medical supplies and professional staff in clean white clinical coats in the background. The lighting is bright and even, reflecting a sterile and reliable healthcare environment. The colors are dominated by clinical whites and professional navy blues." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0rYWp4mw0JgrSezLWtKyD1tmuQiUwDVHFzV9KgS1irpFVdXWqYFB7kqdJ4UUM5BsZ_M6t4fMWPeHm8gokjpJFpMn541U0fILHYUFOyZyDficKilB2mY-QM5bS50xORtO6HQaOapJV2Ng7p3AIc4UtY6bTnlIuqEbKnqJJlVA1eCKgX8N2N4U0Ys_-1SBGC4HsyYFWqI5LyGX-nMNVWab0rRL2qxsgPNQDETlUhFxaR_VMQV2su9-_"/>
</div>
<div className="flex-grow">
<div className="flex justify-between items-start mb-base">
<div>
<h3 className="text-headline-md text-on-surface">Boots Clinical Centre</h3>
<div className="flex items-center gap-2 mt-1">
<span className="text-label-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined" style={{fontSize: '16px'}}>star</span> 4.5 (850 reviews)
                                    </span>
<span className="text-outline">•</span>
<span className="text-label-sm text-on-surface-variant">1.2 miles away</span>
</div>
</div>
<div className="text-right">
<span className="text-headline-md text-primary font-bold">£14.99</span>
<p className="text-label-sm text-on-surface-variant">Estimated Price</p>
</div>
</div>
<div className="mt-md flex flex-wrap gap-sm items-center">
<span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-label-sm font-bold flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-orange-500"></span> Low Stock
                            </span>
<span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">Updated 5 mins ago</span>
<span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">Open 24 Hours</span>
</div>
<div className="mt-lg flex gap-md">
<button className="flex-grow md:flex-none bg-primary text-on-primary px-6 py-2.5 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all">Reserve Medicine</button>
<button className="flex-grow md:flex-none border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-label-md hover:bg-surface-variant active:scale-95 transition-all">Get Directions</button>
</div>
</div>
</div>

<div className="bg-white clinical-card p-lg rounded-xl border border-outline-variant flex flex-col md:flex-row gap-lg opacity-75 grayscale-[0.5]">
<div className="w-full md:w-48 h-32 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="An exterior daytime view of a community pharmacy in a suburban neighborhood. The shop front is clean with visible health-related signage. The scene is bright and airy with a natural light aesthetic, conveying a sense of neighborhood reliability and clinical accessibility. The style is modern corporate minimalist." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDv8QRttng6MfoZzNVIFUbZRcoVo3IsjB1M12mMM1HzNql6DXYwbG_8XNBzwKeVScugy0s4VJoukrH2hKQY5tlMGxpyYYH_HZAER1q2a7Mgfi1PNR9HOBgRE7dNIJU9OIQOUBH9v7xG_CisYsTkoJuczyWq_frhZ88a_TAlbNIPY8PTE2P26CMDaNZCFtFcXG9ebGw_60NrTjqbZBBNxu587BUgOLTlB56OnA0H2OXurg8MaT4nDAJr"/>
</div>
<div className="flex-grow">
<div className="flex justify-between items-start mb-base">
<div>
<h3 className="text-headline-md text-on-surface">Community Care Pharma</h3>
<div className="flex items-center gap-2 mt-1">
<span className="text-label-sm text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined" style={{fontSize: '16px'}}>star</span> 4.2 (45 reviews)
                                    </span>
<span className="text-outline">•</span>
<span className="text-label-sm text-on-surface-variant">2.8 miles away</span>
</div>
</div>
<div className="text-right">
<span className="text-headline-md text-on-surface-variant font-bold">£11.00</span>
<p className="text-label-sm text-on-surface-variant">Estimated Price</p>
</div>
</div>
<div className="mt-md flex flex-wrap gap-sm items-center">
<span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-label-sm font-bold flex items-center gap-1">
<span className="w-2 h-2 rounded-full bg-red-500"></span> Out of Stock
                            </span>
<span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-label-sm">Updated 1 hour ago</span>
</div>
<div className="mt-lg flex gap-md">
<button className="flex-grow md:flex-none bg-surface-variant text-on-surface-variant px-6 py-2.5 rounded-lg font-label-md cursor-not-allowed">Out of Stock</button>
<button className="flex-grow md:flex-none border border-outline-variant text-on-surface px-6 py-2.5 rounded-lg font-label-md hover:bg-surface-variant active:scale-95 transition-all">Get Directions</button>
</div>
</div>
</div>

<div className="hidden flex flex-col items-center justify-center py-24 text-center" id="noResults">
<span className="material-symbols-outlined text-outline text-6xl mb-md">location_off</span>
<h3 className="text-headline-md text-on-surface">No pharmacies found</h3>
<p className="text-body-md text-on-surface-variant mt-sm max-w-sm">Try adjusting your filters or search radius to find results further away.</p>
<button className="mt-xl bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md">Reset Filters</button>
</div>
</div>

<div className={`flex-grow h-[600px] rounded-2xl border border-outline-variant overflow-hidden relative ${view !== "map" ? "hidden" : ""}`}>
<div className="absolute inset-0 bg-surface-container-low" data-location="London">

</div>

<div className="absolute top-md left-md space-y-sm">
<button className="bg-white p-2 rounded-lg shadow-md border border-outline-variant flex items-center justify-center material-symbols-outlined">add</button>
<button className="bg-white p-2 rounded-lg shadow-md border border-outline-variant flex items-center justify-center material-symbols-outlined">remove</button>
</div>
</div>
</div>
</main>

<footer className="w-full mt-xl bg-surface-container-highest dark:bg-inverse-surface">
<div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center">
<div className="flex flex-col md:items-start items-center mb-md md:mb-0">
<span className="text-label-md font-label-md font-bold text-on-surface">MediFind</span>
<p className="text-body-sm font-body-sm text-on-surface-variant mt-1">© 2024 MediFind Clinical Solutions. All rights reserved.</p>
</div>
<div className="flex gap-lg flex-wrap justify-center">
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors cursor-pointer" href="#">Privacy Policy</a>
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors cursor-pointer" href="#">Terms of Service</a>
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors cursor-pointer" href="#">Contact Pharmacy Support</a>
</div>
</div>
</footer>

    </div>
  );
}
