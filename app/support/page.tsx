"use client";

import Link from "next/link";

export default function SupportMaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      {/* Header */}
      <header className="w-full top-0 sticky bg-surface/80 glass-header border-b border-outline-variant h-16 flex items-center px-margin-mobile md:px-margin-desktop z-50">
        <div className="flex justify-between items-center w-full max-w-max-width mx-auto">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
            <span className="font-display text-headline-md md:text-display text-primary">MediFind</span>
          </Link>
          <div>
            <Link href="/" className="text-on-surface-variant font-label-md hover:text-primary transition-colors cursor-pointer">
              Go Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-xl px-margin-mobile relative overflow-hidden">
        {/* Background Decorative Blurs */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md w-full text-center z-10 space-y-lg">
          <div className="inline-flex items-center justify-center p-6 bg-primary-container text-on-primary-container rounded-full animate-bounce duration-1000">
            <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              engineering
            </span>
          </div>

          <div className="space-y-sm">
            <h1 className="text-display font-display text-on-surface">Portal Under Maintenance</h1>
            <p className="text-body-md text-on-surface-variant leading-relaxed">
              Our support ticketing system is currently undergoing scheduled system updates to improve your service experience. We apologize for the inconvenience.
            </p>
          </div>

          <div className="p-md bg-surface-container-high rounded-xl border border-outline-variant text-left flex gap-md items-start">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              info
            </span>
            <div className="text-body-sm text-on-surface-variant space-y-xs">
              <span className="font-bold text-on-surface block">Need Immediate Assistance?</span>
              If this is a medical emergency or you require critical medication refill support, please contact your local healthcare providers or emergency lines directly.
            </div>
          </div>

          <div className="pt-md flex flex-col sm:flex-row gap-md justify-center">
            <Link
              href="/"
              className="px-lg py-3 bg-primary text-on-primary rounded-xl font-label-md hover:bg-surface-tint shadow-lg transition-all active:scale-95"
            >
              Return Home
            </Link>
            <Link
              href="/search"
              className="px-lg py-3 border border-outline text-on-surface rounded-xl font-label-md hover:bg-surface-container transition-all active:scale-95"
            >
              Search Medicines
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-lg text-center text-body-sm text-on-surface-variant">
          © 2026 onwards MediFind Healthcare Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
