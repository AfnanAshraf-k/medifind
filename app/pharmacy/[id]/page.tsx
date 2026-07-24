export default function PharmacyDetailPage() {
  return (
    <div className="bg-background text-on-background min-h-screen">
<nav className="w-full top-0 sticky bg-surface dark:bg-surface-dim border-b border-outline-variant dark:border-outline z-50">
<div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto">
<div className="text-headline-md font-headline-md text-primary dark:text-primary-fixed-dim cursor-pointer">MediFind</div>
<div className="hidden md:flex gap-xl items-center">
<a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors cursor-pointer">Find Medicine</a>
<a className="text-primary font-label-md border-b-2 border-primary pb-1 transition-colors cursor-pointer">Pharmacies</a>
<a className="text-on-surface-variant font-label-md hover:text-primary-container transition-colors cursor-pointer">Support</a>
</div>
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">notifications</span>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors">location_on</span>
<button className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md hover:bg-surface-tint transition-all active:opacity-80">
                    Pharmacy Login
                </button>
</div>
</div>
</nav>
<main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl">

<header className="mb-xl">
<div className="flex flex-col md:flex-row gap-lg items-start md:items-center justify-between">
<div>
<h1 className="text-display font-display text-on-surface mb-xs">City Central Pharmacy</h1>
<div className="flex flex-wrap items-center gap-md text-on-surface-variant">
<div className="flex items-center gap-xs">
<span className="material-symbols-outlined text-[#F59E0B]" style={{fontVariationSettings: '\'FILL\' 1'}}>star</span>
<span className="font-label-md text-on-surface">4.8</span>
<span className="text-body-sm">(1,240 Reviews)</span>
</div>
<span className="hidden md:block">•</span>
<div className="flex items-center gap-xs">
<span className="material-symbols-outlined">location_on</span>
<span className="text-body-md">742 Medical Plaza, Suite 10, Downtown Health District</span>
</div>
</div>
</div>
<div className="flex gap-md w-full md:w-auto">
<button className="flex-1 md:flex-none border border-primary text-primary px-lg py-md rounded-lg font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all">
<span className="material-symbols-outlined mr-xs">call</span> Contact
                    </button>
<button className="flex-1 md:flex-none bg-primary text-on-primary px-lg py-md rounded-lg font-label-md hover:bg-surface-tint shadow-lg transition-all active:scale-95">
                        Order for Pickup
                    </button>
</div>
</div>
</header>

<div className="bento-grid">

<aside className="col-span-12 lg:col-span-4 space-y-lg">

<div className="bg-surface-container-low p-lg rounded-xl border border-outline-variant">
<div className="flex items-center justify-between mb-md">
<span className="text-label-md text-on-surface-variant uppercase tracking-wider">Current Status</span>
<span className="bg-[#D1FAE5] text-[#065F46] px-md py-xs rounded-full text-label-sm font-bold">OPEN NOW</span>
</div>
<div className="space-y-sm">
<div className="flex justify-between text-body-md">
<span className="text-on-surface-variant">Mon - Fri</span>
<span className="font-semibold text-on-surface">08:00 AM - 10:00 PM</span>
</div>
<div className="flex justify-between text-body-md">
<span className="text-on-surface-variant">Saturday</span>
<span className="font-semibold text-on-surface">09:00 AM - 08:00 PM</span>
</div>
<div className="flex justify-between text-body-md">
<span className="text-on-surface-variant">Sunday</span>
<span className="font-semibold text-on-surface text-error">Closed</span>
</div>
</div>
<hr className="my-md border-outline-variant"/>
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
<div className="w-full h-full bg-cover bg-center" data-alt="A high-quality clinical map graphic showing a healthcare district in a modern, minimal aesthetic. The map uses Medical Blue and Slate Gray tones with soft lighting and clear typography markers, maintaining a professional and clean clinical feel." data-location="New York City Health District" style={{backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuB9N4oLeMsO6sY8GDKq9i-zTUJDvDKaYPSZLPZhyWmMImzLyQAckfHtQF4ZT2xhgBNac-vfNiaOMoc7xrJoAsMi6Y0e9XMeTbg06r5S7qTD-6FkXm3CjDVEueIITC_WDKN-XTqKlDVgwA8vk-cK_ik23bMoRYp5ZmhsbzhwWggqclzMbueL-tysCaOamgI21p2QgmFb04CmXqHy6ptrpIPtfoiym39tF0G-GIQFmWWl4e9ybbp_5xNR\')'}}></div>
<div className="absolute inset-0 flex items-center justify-center">
<div className="bg-white p-sm rounded-full shadow-lg">
<span className="material-symbols-outlined text-error" style={{fontVariationSettings: '\'FILL\' 1'}}>location_on</span>
</div>
</div>
</div>
<div className="p-md">
<p className="text-body-sm text-on-surface-variant">Estimated drive time: 12 mins from your location</p>
</div>
</div>
</aside>

<section className="col-span-12 lg:col-span-8">
<div className="flex items-center justify-between mb-lg">
<h2 className="text-headline-lg font-headline-lg text-on-surface">Inventory Levels</h2>
<div className="relative w-1/2 hidden md:block">
<input className="w-full bg-surface-container-low border border-outline-variant rounded-full py-sm pl-xl pr-md text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Search medicines..." type="text"/>
<span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-md">

<div className="bg-white p-md rounded-xl border border-outline-variant flex gap-md hover:border-primary transition-all group">
<div className="w-24 h-24 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="Close-up professional product shot of a pharmaceutical medicine bottle on a white, clean, clinical background. The lighting is soft and bright with clinical blue highlights, focusing on the high-quality packaging and labeling for a modern healthcare application." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAct7G014GC-w1ErH0expxnATavMY3qxuB5ssd6ob7lruuecDgI1uPApTUk7DKrwYjLjNhfwUkN9a1SB8HZ8dE69u0QJ-Qv2kZGu_zkBdHEWOrJjcPVhE6yDk88VMmlEXq53ILiOVtDnDBYXgFxRLvyxEDonvpdBhOzWdijQVuhesousap3DK1KBTqj7GzJNEo3PUVcLrOBjKQ7UukoggpETGJQuaQNiYhkMAEs1-HKi1egPCN_IYb_"/>
</div>
<div className="flex-1 flex flex-col justify-between">
<div>
<h3 className="text-label-md text-on-surface">Amoxicillin 500mg</h3>
<p className="text-body-sm text-on-surface-variant">Antibiotic • 30 Capsules</p>
</div>
<div className="flex items-center justify-between mt-md">
<span className="text-label-sm px-md py-0.5 rounded-full bg-green-100 text-green-700 font-bold">IN STOCK</span>
<span className="text-headline-md font-bold text-on-surface">$14.50</span>
</div>
</div>
<div className="flex flex-col justify-center">
<button className="bg-surface-container-highest p-sm rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all">
<span className="material-symbols-outlined">add</span>
</button>
</div>
</div>

<div className="bg-white p-md rounded-xl border border-outline-variant flex gap-md hover:border-primary transition-all group">
<div className="w-24 h-24 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="High-resolution photography of a medical blister pack containing white pills. The setting is a minimalist, high-key pharmacy environment with soft shadows and a professional corporate aesthetic using shades of light blue and slate gray." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVN88hsrko5PvEE4w8b3M1AxIKO3VlvQWFX1nyfuP1H_Qjc5c9zzzpvN_loMQNc8fFARqjTexzGipodcsCLBG1O1aYLAzSvEc7xngWoeYKieIE7FeUjrDpmxQh--H7HhlrFuI_5bbvt_Gs664XgNx_F360hQFvGZ7rqTIk3K6TOOXE2NanMXIuKYRlLnqZt95UU9Nu1P3U3M4yVT1XAT6zSPW_OsBrEGjcpPkrgiT4R7ssL6iuMgjn"/>
</div>
<div className="flex-1 flex flex-col justify-between">
<div>
<h3 className="text-label-md text-on-surface">Lisinopril 10mg</h3>
<p className="text-body-sm text-on-surface-variant">Blood Pressure • 90 Tablets</p>
</div>
<div className="flex items-center justify-between mt-md">
<span className="text-label-sm px-md py-0.5 rounded-full bg-green-100 text-green-700 font-bold">IN STOCK</span>
<span className="text-headline-md font-bold text-on-surface">$22.00</span>
</div>
</div>
<div className="flex flex-col justify-center">
<button className="bg-surface-container-highest p-sm rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all">
<span className="material-symbols-outlined">add</span>
</button>
</div>
</div>

<div className="bg-white p-md rounded-xl border border-outline-variant flex gap-md hover:border-primary transition-all group">
<div className="w-24 h-24 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="Macro photography of a small glass vial for medical injection. The background is a blurred laboratory setting with clean clinical lighting. The overall mood is precise, reliable, and technologically advanced, aligned with a modern medical brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBO7zOcod8m4q5einSLz48R5Gs1wKlTngIZ__YUoX66ju9p-lkv-RKmGthotLS5e2zIj_bEf6tXTnQ8md_FSeeCoAW2Q7w_uo8_nGR87Wo9mCBXJcS9LPfTBjZcRXwOC5_PyDVQ9gddgG8khDcr0q_PpVNGLvnAT3HbsJ4ZDyT3PZsugifhFfrtYEslRzTvTsH5mTYxfMkX4iNXNXciN7c7_NeAXJP5sf7K5SGKOKrShssi6Nnb8_Bl"/>
</div>
<div className="flex-1 flex flex-col justify-between">
<div>
<h3 className="text-label-md text-on-surface">Insulin Aspart</h3>
<p className="text-body-sm text-on-surface-variant">Diabetes • 10ml Vial</p>
</div>
<div className="flex items-center justify-between mt-md">
<span className="text-label-sm px-md py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold uppercase">Low Stock (2)</span>
<span className="text-headline-md font-bold text-on-surface">$98.00</span>
</div>
</div>
<div className="flex flex-col justify-center">
<button className="bg-surface-container-highest p-sm rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all">
<span className="material-symbols-outlined">add</span>
</button>
</div>
</div>

<div className="bg-white p-md rounded-xl border border-outline-variant flex gap-md hover:border-primary transition-all group">
<div className="w-24 h-24 bg-surface-container-high rounded-lg overflow-hidden flex-shrink-0">
<img className="w-full h-full object-cover" alt="Product shot of a white inhaler device on a clean, professional surface. Bright, high-key studio lighting creates a modern clinical feel. The color palette is dominated by pure whites and subtle medical blue accents, signifying health and breathability." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbGUBiuZjW9WEQqIqwqtywepw6-ReW8LJ1rgcl2iDYJp9GmsFMZDQ-rTg57ivyyPixa1xjd7Z8kBHMOLYPqHthieuizXD8Q9jo-BDRccg_9rtIx8lYDWUIAaazI67G8VoWzHSqZt9GV_Tk9hOyDELy1azKscKktEI78VL4VV3LmKpl3_G-Cj5S0hmycgHwNZ6xHU-P4epC0HgNkG-26i3ULxA_sevSwSFt2AWUTzat0wW7JdtDFCeU"/>
</div>
<div className="flex-1 flex flex-col justify-between">
<div>
<h3 className="text-label-md text-on-surface">Albuterol Inhaler</h3>
<p className="text-body-sm text-on-surface-variant">Asthma • 18g Canister</p>
</div>
<div className="flex items-center justify-between mt-md">
<span className="text-label-sm px-md py-0.5 rounded-full bg-green-100 text-green-700 font-bold">IN STOCK</span>
<span className="text-headline-md font-bold text-on-surface">$45.00</span>
</div>
</div>
<div className="flex flex-col justify-center">
<button className="bg-surface-container-highest p-sm rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all">
<span className="material-symbols-outlined">add</span>
</button>
</div>
</div>
</div>

<div className="mt-xl bg-primary-container p-xl rounded-2xl relative overflow-hidden text-on-primary-container">
<div className="relative z-10">
<h3 className="text-headline-md font-headline-md mb-xs">Fast-Track Your Refill</h3>
<p className="text-body-md mb-md max-w-md opacity-90">Upload your prescription photo and have it ready for pickup in under 30 minutes.</p>
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
<p className="text-body-sm text-on-surface-variant mt-xs">© 2024 MediFind Clinical Solutions. All rights reserved.</p>
</div>
<div className="flex flex-wrap justify-center gap-lg">
<a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">Privacy Policy</a>
<a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">Terms of Service</a>
<a className="text-on-surface-variant font-label-sm hover:text-on-surface transition-colors cursor-pointer">Contact Pharmacy Support</a>
</div>
</div>
</footer>

<button className="md:hidden fixed bottom-md right-md bg-primary text-on-primary p-md rounded-full shadow-2xl active:scale-90 transition-transform">
<span className="material-symbols-outlined text-[32px]">shopping_cart</span>
</button>

    </div>
  );
}
