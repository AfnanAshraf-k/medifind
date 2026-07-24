import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-background text-on-surface font-body-md">
<header className="w-full top-0 sticky z-50 bg-surface/80 glass-header border-b border-outline-variant">
<div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto">
<div className="text-headline-md font-headline-md text-primary">MediFind</div>
<nav className="hidden md:flex items-center gap-xl">
<a className="text-on-surface-variant font-label-md hover:text-primary transition-colors" href="#">Find Medicine</a>
<a className="text-on-surface-variant font-label-md hover:text-primary transition-colors" href="#">Pharmacies</a>
<a className="text-on-surface-variant font-label-md hover:text-primary transition-colors" href="#">Support</a>
</nav>
<div className="flex items-center gap-md">
<div className="flex items-center gap-sm">
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer p-2 hover:bg-surface-variant rounded-full transition-all">notifications</span>
<span className="material-symbols-outlined text-on-surface-variant cursor-pointer p-2 hover:bg-surface-variant rounded-full transition-all">location_on</span>
</div>
<button className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all">
                    Pharmacy Login
                </button>
</div>
</div>
</header>
<main>

<section className="relative min-h-[819px] flex items-center justify-center overflow-hidden px-margin-mobile md:px-margin-desktop">
<div className="absolute inset-0 z-0">
<div className="w-full h-full bg-cover bg-center opacity-10" data-alt="A clean, sterile pharmacy environment with organized shelves of medication under soft, bright clinical lighting. The aesthetic is professional and high-trust, featuring a shallow depth of field focusing on modern medical packaging. Soft blue and white tones dominate the scene, creating a sense of reliability and healthcare excellence." style={{backgroundImage: 'url(\'https://lh3.googleusercontent.com/aida-public/AB6AXuDU5O8yGhMccJJEp3XhJ4eK0nSx8g5k5OhrVSaqMZFdqy74811ILQcweQv-kJqOGS9EJ81eZFT43uC-566aUQo_T572sjv0u-zx1ZFUQt1rQXp17x5mT_Orr7EsrQ2ftXVN5QIKjuCs6O8NDGmAfo4O0xXtUQ2SsUFVuFUCkZikDrsfy9GIVfKkpp44w2KFxWfJphkprJpBQXe0DjNDRFqRDWIyUsxRm-W-MT1EoQrS2Y4YdpyihpJl\')'}}></div>
</div>
<div className="relative z-10 max-w-4xl w-full text-center py-xl">
<span className="inline-block py-1 px-3 rounded-full bg-secondary-container text-on-secondary-container font-label-sm mb-md uppercase tracking-wider">Trusted Clinical Network</span>
<h1 className="font-display text-display text-on-surface mb-lg leading-tight">Find critical medication in seconds.</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-xl max-w-2xl mx-auto">Real-time inventory tracking across our network of certified partner pharmacies. No more calling around or unnecessary trips.</p>

<form action="/search" method="GET" className="w-full max-w-3xl mx-auto bg-surface border border-outline-variant p-2 rounded-xl shadow-sm flex flex-col md:flex-row items-stretch gap-2">
<div className="flex-grow flex items-center px-md gap-md">
<span className="material-symbols-outlined text-outline">search</span>
<input name="q" className="w-full border-none focus:ring-0 bg-transparent py-4 text-body-md placeholder:text-outline" placeholder="Search for medicine, brand, or pharmacy..." type="text"/>
</div>
<div className="hidden md:block w-px bg-outline-variant my-2"></div>
<div className="flex items-center px-md gap-md group cursor-pointer">
<span className="material-symbols-outlined text-outline">location_on</span>
<span className="text-body-md text-on-surface-variant whitespace-nowrap">Current Location</span>
</div>
<button type="submit" className="bg-primary text-on-primary px-xl py-4 rounded-lg font-headline-md hover:bg-primary/90 transition-all shadow-md">
                        Search
                    </button>
</form>
<div className="mt-xl flex flex-wrap justify-center gap-lg opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
<span className="font-label-md flex items-center gap-xs"><span className="material-symbols-outlined text-sm">verified</span> Verified Stock</span>
<span className="font-label-md flex items-center gap-xs"><span className="material-symbols-outlined text-sm">schedule</span> Real-time Updates</span>
<span className="font-label-md flex items-center gap-xs"><span className="material-symbols-outlined text-sm">health_and_safety</span> Certified Pharmacies</span>
</div>
</div>
</section>

<section className="py-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
<div className="mb-xl text-center">
<h2 className="font-headline-lg text-headline-lg mb-sm">How MediFind works for you</h2>
<p className="text-on-surface-variant max-w-xl mx-auto">Our streamlined process ensures you find your prescription with minimum effort and maximum reliability.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-lg">

<div className="bento-card bg-surface border border-outline-variant rounded-xl p-lg flex flex-col justify-between" style={{opacity: '1', transform: 'translateY(0px)', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'}}>
<div>
<div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md">
<span className="material-symbols-outlined">search</span>
</div>
<h3 className="font-headline-md text-headline-md mb-md">Search</h3>
<p className="text-on-surface-variant">Enter your medication name. Our system cross-references active stock levels across thousands of pharmacies.</p>
</div>
<div className="mt-xl pt-lg border-t border-outline-variant/30 italic text-label-sm text-outline">
                        Over 5,000 medications tracked
                    </div>
</div>

<div className="bento-card bg-primary text-on-primary rounded-xl p-lg flex flex-col justify-between md:scale-105 shadow-xl z-10" style={{opacity: '1', transform: 'translateY(0px)', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'}}>
<div>
<div className="w-12 h-12 rounded-full bg-on-primary/20 flex items-center justify-center mb-md">
<span className="material-symbols-outlined">map</span>
</div>
<h3 className="font-headline-md text-headline-md mb-md">Locate</h3>
<p className="opacity-90">View available stock on an interactive map. Compare prices and check pharmacy hours in one place.</p>
</div>
<div className="mt-xl pt-lg border-t border-on-primary/20 flex items-center gap-sm">
<span className="material-symbols-outlined text-sm">flash_on</span>
<span className="text-label-sm uppercase tracking-widest">Instant Matching</span>
</div>
</div>

<div className="bento-card bg-surface border border-outline-variant rounded-xl p-lg flex flex-col justify-between" style={{opacity: '1', transform: 'translateY(0px)', transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'}}>
<div>
<div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md">
<span className="material-symbols-outlined">bookmark_check</span>
</div>
<h3 className="font-headline-md text-headline-md mb-md">Reserve</h3>
<p className="text-on-surface-variant">Reserve your dose with a click to ensure it's waiting for you when you arrive at the pharmacy.</p>
</div>
<div className="mt-xl pt-lg border-t border-outline-variant/30 italic text-label-sm text-outline">
                        Secure checkout available
                    </div>
</div>
</div>
</section>

<section className="py-xl bg-surface-container-low border-y border-outline-variant/20">
<div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
<div className="relative rounded-xl overflow-hidden shadow-2xl aspect-video">
<img className="w-full h-full object-cover" alt="A focused close-up of a high-resolution smartphone screen displaying the MedCheck application interface. The app shows a clear map with pharmacy pins and medication availability status. In the blurred background, a modern medical professional in a white coat is consulting with a patient in a bright, airy clinic environment, emphasizing trust and professional guidance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_0mq0ogMsbrzMa1xDbQjlGF5yjHwAD4q1c7_-ZcNpjBLlyzgbx4SG9C_ViVfAgh348H0yOAVOlpeTa1451EDnJxHIiCQ5jGHj-2Mvjqjg1DBfyh-GZcl4O0yVPmBGU6doqhhZa3ABRgaF9gn1ew4CT2ws7u3A6AiA-R97_pamv4Kr2xrZqxSgmoc30Q1X9qEVBG4zuWORm_5GJkcq94h_0kLZWBfh1-QzrRF74DmjaRZnHwWmo9br"/>
<div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
</div>
<div className="space-y-lg">
<h2 className="font-headline-lg text-headline-lg">Clinical reliability in the palm of your hand</h2>
<p className="text-body-lg text-on-surface-variant">We understand that getting your medication is not just about convenience—it's about health and peace of mind.</p>
<ul className="space-y-md">
<li className="flex items-start gap-md">
<span className="material-symbols-outlined text-primary mt-1">check_circle</span>
<div>
<span className="font-headline-md text-headline-md block">Zero Guesswork</span>
<span className="text-body-md text-on-surface-variant">Know exactly which pharmacy has your specific brand and dosage in stock.</span>
</div>
</li>
<li className="flex items-start gap-md">
<span className="material-symbols-outlined text-primary mt-1">check_circle</span>
<div>
<span className="font-headline-md text-headline-md block">Price Transparency</span>
<span className="text-body-md text-on-surface-variant">Compare pharmacy prices and find the most cost-effective option for your prescription.</span>
</div>
</li>
<li className="flex items-start gap-md">
<span className="material-symbols-outlined text-primary mt-1">check_circle</span>
<div>
<span className="font-headline-md text-headline-md block">Critical Alerts</span>
<span className="text-body-md text-on-surface-variant">Get notified the moment a rare or backordered medication becomes available near you.</span>
</div>
</li>
</ul>
<button className="bg-surface text-primary border-2 border-primary px-xl py-md rounded-lg font-label-md hover:bg-primary hover:text-on-primary transition-all">
                        Create Patient Account
                    </button>
</div>
</div>
</section>

<section className="py-xl px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
<div className="flex flex-col md:flex-row justify-between items-end gap-md mb-xl">
<div>
<h2 className="font-headline-lg text-headline-lg mb-xs">Partner Pharmacies</h2>
<p className="text-on-surface-variant">We partner with over 2,500 licensed pharmacies to provide accurate inventory data.</p>
</div>
<button className="text-primary font-label-md flex items-center gap-xs hover:underline">
                    View full directory <span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
<div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
<div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
<span className="material-symbols-outlined text-primary text-3xl">local_pharmacy</span>
</div>
<span className="font-label-md text-on-surface">City Central</span>
<span className="text-label-sm text-outline">12 Locations</span>
</div>
<div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
<div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
<span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
</div>
<span className="font-label-md text-on-surface">HealthLink Rx</span>
<span className="text-label-sm text-outline">National Partner</span>
</div>
<div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
<div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
<span className="material-symbols-outlined text-primary text-3xl">medication</span>
</div>
<span className="font-label-md text-on-surface">PharmaDirect</span>
<span className="text-label-sm text-outline">Premium Network</span>
</div>
<div className="bg-surface border border-outline-variant p-xl rounded-xl flex flex-col items-center justify-center text-center">
<div className="w-16 h-16 bg-surface-variant rounded-full mb-md flex items-center justify-center">
<span className="material-symbols-outlined text-primary text-3xl">emergency</span>
</div>
<span className="font-label-md text-on-surface">24/7 Meds</span>
<span className="text-label-sm text-outline">Emergency Care</span>
</div>
</div>
<div className="mt-xl p-lg bg-surface-container-highest rounded-2xl flex flex-col md:flex-row items-center justify-between gap-lg">
<div className="flex items-center gap-lg">
<div className="flex -space-x-3">
<img className="w-12 h-12 rounded-full border-2 border-surface object-cover" alt="A professional pharmacist in a crisp white coat smiling warmly, captured in a brightly lit modern pharmacy. The image represents expertise and care in a medical setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxQCgm9S5ruSs1ArXUosX5UxqlmXqTpa6WYm6YMMvYMxs7Ld7bk7bUs3ZcD5GlWuuiCM9BurcdUQF47ma8nUODDEpss_3klme2Fwcj7efW7L07wFTy9vi0XvgRJ0CmRGJq0fsHhfsIILslT4DxzEYc4tgZJqKeDNxdjtHH3l0y3-V_rzFwoCbsWvLEYuLcXQB5FeT9YXCizBLeoT7njnJO8oXOl99T5OfLbOSQcCMoRfI0M2hr3Zds"/>
<img className="w-12 h-12 rounded-full border-2 border-surface object-cover" alt="A middle-aged female pharmacist with glasses working behind a high-tech pharmacy counter, communicating trust and experience in healthcare services." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtfBi7SEwORlGivQh_X-TAN2avQZ-53g7TILD-5cbspwY3gQNQjzhUNGNUIMoDCgYOZD9uLYckIUmNNGN8Tu8iqzr6P1eHKbCnKsI3UXhkyh_BeoRaHqY9Ah3TFZk6q1CNZbOtUBBvzBX_sUYogE9ueqM7pd8BOrDDJA5c4oneUwK3OUcW7Mkc_U6oiOVdnfFyEVd-gRv33-UsIXSCwmQtUK-QXjKU3qf-VN7nmkY_XZmfHFOr1mV5"/>
<img className="w-12 h-12 rounded-full border-2 border-surface object-cover" alt="A diverse young pharmacist organizing medical supplies in a clean clinical environment, symbolizing modern and inclusive healthcare solutions." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUlGwcTw9QuGVwE9KayrgLitw_XPQW8EYQ4rJKrWUZQ6BCvFVEsw2bFVp1mce9uozxZ-iLxe-9gCN3r8GwgSMLozmFANeWeTXNAx0pvT8kVJLTgrS0Ep9XFyQKPzpJq98mhXymEOoq6B15cil0EEV_dUEthDJ0CqZ2GqdhLzfFk57rarhb2chTH4l-EltcpVUhKYh205kF2JMhB_Lqcvckar2w5hBcYr_Vu3qot7gc-ogu17nHF1YE"/>
</div>
<p className="text-on-surface-variant font-body-md">Join 500+ pharmacies joining MediFind this month.</p>
</div>
<button className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md whitespace-nowrap shadow-md">
                    Become a Partner Pharmacy
                </button>
</div>
</section>
</main>

<footer className="w-full mt-xl bg-surface-container-highest border-t border-outline-variant/30">
<div className="max-w-max-width mx-auto px-margin-desktop py-lg flex flex-col md:flex-row justify-between items-center gap-md">
<div className="flex flex-col md:flex-row items-center gap-lg">
<div className="text-label-md font-label-md font-bold text-on-surface">MediFind</div>
<div className="text-body-sm font-body-sm text-on-surface-variant">© 2024 MediFind Clinical Solutions. All rights reserved.</div>
</div>
<div className="flex gap-lg">
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">Terms of Service</a>
<a className="text-on-surface-variant text-label-sm font-label-sm hover:text-on-surface transition-colors" href="#">Contact Pharmacy Support</a>
</div>
</div>
</footer>

    </div>
  );
}
