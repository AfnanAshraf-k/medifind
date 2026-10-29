"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setErrorMsg("Access Denied: Super-admin privileges are required to access the admin console.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Unable to authenticate administrator.");
      }

      // Verify that this user is indeed an administrator
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role, is_suspended, full_name")
        .eq("id", data.user.id)
        .single();

      if (profileErr || !profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error(
          "Access Denied: This account does not possess Super-Admin privileges. Only platform administrators may enter."
        );
      }

      if (profile.is_suspended) {
        await supabase.auth.signOut();
        throw new Error("Account Suspended: This administrator account has been disabled.");
      }

      // Hard redirect to load admin panel with fresh session
      window.location.href = "/admin";
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-outline-variant rounded-2xl p-8 shadow-xl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            admin_panel_settings
          </span>
        </div>
        <div>
          <h2 className="text-title-lg font-bold text-on-surface">Master Control Portal</h2>
          <p className="text-xs text-on-surface-variant">Authorized Administrative Personnel Only</p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
          <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">security</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5" htmlFor="email">
            Admin Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              badge
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@medifind.com"
              className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1.5" htmlFor="password">
            Master Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">
              lock
            </span>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-slate-900 text-white rounded-xl font-label-md hover:bg-slate-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              Authenticating...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">verified_user</span>
              Access Admin Console
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-outline-variant/60 flex items-center justify-between text-xs text-on-surface-variant">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">arrow_back</span>
          Return to MediFind Home
        </Link>
        <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600">ROLE: SUPERADMIN</span>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between items-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      </div>

      <header className="w-full max-w-5xl py-6 flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2 text-white">
          <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
          <span className="font-display text-2xl font-bold tracking-tight">MediFind</span>
          <span className="ml-2 text-xs uppercase bg-primary/20 text-primary px-2 py-0.5 rounded font-mono font-bold tracking-wider">
            Admin
          </span>
        </Link>
        <div className="text-xs text-slate-400">Security Clearance Level 1</div>
      </header>

      <main className="w-full flex items-center justify-center py-10 z-10">
        <Suspense fallback={<div className="text-white text-sm">Loading security verification...</div>}>
          <AdminLoginForm />
        </Suspense>
      </main>

      <footer className="w-full max-w-5xl py-6 text-center text-xs text-slate-500 z-10 border-t border-slate-800">
        © 2026 MediFind Clinical Network • Master Administration Portal • All access is monitored and logged in audit records.
      </footer>
    </div>
  );
}

