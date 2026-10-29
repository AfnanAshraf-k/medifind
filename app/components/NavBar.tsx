"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavBarProps {
  /** Extra content for the middle of the nav (e.g. search bar) */
  centerSlot?: React.ReactNode;
  /** Icon buttons shown left of the user button */
  rightIconSlot?: React.ReactNode;
  /** Extra class applied to the root <header> */
  className?: string;
}

export default function NavBar({ centerSlot, rightIconSlot, className = "" }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser] = useState<any>(undefined); // undefined = loading
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(u ?? null);

      if (u) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", u.id)
          .maybeSingle();
        if (mounted && data) setProfile(data);
      }
    }

    loadUser();

    // Keep in sync when auth state changes (login / logout from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (!session?.user) setProfile(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  const dashboardHref =
    profile?.role === "pharmacy" ? "/pharmacy/dashboard" :
    profile?.role === "admin" ? "/admin" :
    "/dashboard";

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className={`w-full top-0 sticky z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant ${className}`}>
      <div className="flex justify-between items-center h-16 px-gutter max-w-max-width mx-auto gap-4">

        {/* Logo + nav links */}
        <div className="flex items-center gap-8 flex-shrink-0">
          <Link href="/" className="text-headline-md font-headline-md text-primary hover:opacity-90 transition-opacity">
            MediFind
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/search"
              className={`font-label-md transition-colors ${pathname === "/search" && !pathname.includes("pharmacy") ? "text-primary border-b-2 border-primary pb-0.5" : "text-on-surface-variant hover:text-primary"}`}
            >
              Find Medicine
            </Link>
            <Link
              href="/search?mode=pharmacy"
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
            >
              Pharmacies
            </Link>
            <Link
              href="/support"
              className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
            >
              Support
            </Link>
          </nav>
        </div>

        {/* Center slot (e.g. search bar) */}
        {centerSlot && (
          <div className="hidden sm:flex flex-1 max-w-xs">
            {centerSlot}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightIconSlot}

          {/* Auth area — skeleton while loading */}
          {user === undefined ? (
            <div className="w-24 h-9 bg-surface-container-low rounded-lg animate-pulse" />
          ) : user === null ? (
            /* Not logged in */
            <Link
              href="/login"
              className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md hover:opacity-90 active:scale-95 transition-all text-sm"
            >
              Login / Sign Up
            </Link>
          ) : (
            /* Logged in — avatar + dropdown */
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-outline-variant hover:bg-surface-container transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary-container text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-on-surface max-w-[120px] truncate">
                  {profile?.full_name ?? user.email}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-base">
                  {menuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-outline-variant rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                    <p className="font-label-md text-on-surface truncate">{profile?.full_name ?? "User"}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <Link
                    href={dashboardHref}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-on-surface hover:bg-surface-container transition-colors text-sm"
                  >
                    <span className="material-symbols-outlined text-primary text-base">dashboard</span>
                    My Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-error hover:bg-red-50 transition-colors text-sm border-t border-outline-variant"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

