"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Town, DEFAULT_TOWNS } from "@/lib/locations";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "pharmacy">("user");

  // Pharmacy registration fields
  const [townList, setTownList] = useState<Town[]>(DEFAULT_TOWNS);
  const [selectedTownId, setSelectedTownId] = useState<string>("town-valanchery");
  const [pharmacyName, setPharmacyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (searchParams.get("signup") === "true") {
      setIsSignUp(true);
    }
    if (searchParams.get("role") === "pharmacy") {
      setRole("pharmacy");
    }
    if (searchParams.get("error") === "auth-code-error") {
      setErrorMsg("Authentication link expired or invalid. Please try logging in again.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTowns() {
      try {
        const res = await fetch("/api/towns");
        if (res.ok) {
          const json = await res.json();
          if (json.towns && json.towns.length > 0) {
            setTownList(json.towns);
          }
        }
      } catch (err) {
        // Fallback to DEFAULT_TOWNS
      }
    }
    loadTowns();
  }, []);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg("Please enter your email address first, then click Forgot Password.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setResetSent(true);
      setSuccessMsg("Password reset email sent! Check your inbox.");
    }
  };

  const handleRedirect = async (userId: string) => {
    try {
      // 1. Check profile role and suspension status
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_suspended, suspension_reason")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.is_suspended) {
        await supabase.auth.signOut();
        setErrorMsg(`Account Suspended: ${profile.suspension_reason || "Please contact platform support."}`);
        setLoading(false);
        return;
      }

      let targetRole = profile?.role;

      // Fallback to auth metadata if profile row isn't immediately populated
      if (!targetRole) {
        const { data: userData } = await supabase.auth.getUser();
        targetRole = userData.user?.user_metadata?.role || role || "user";
      }

      // 2. If pharmacy role, verify pharmacy approval status
      if (targetRole === "pharmacy") {
        const { data: pharm } = await supabase
          .from("pharmacies")
          .select("id, status, is_suspended, rejection_reason")
          .eq("owner_id", userId)
          .maybeSingle();

        if (pharm) {
          if (pharm.is_suspended) {
            await supabase.auth.signOut();
            setErrorMsg("Your pharmacy account has been suspended by an administrator. Please contact support.");
            setLoading(false);
            return;
          }

          if (pharm.status === "pending") {
            await supabase.auth.signOut();
            setErrorMsg("Your registration is awaiting admin approval. Please check back once administrators verify your credentials.");
            setLoading(false);
            return;
          }

          if (pharm.status === "rejected") {
            await supabase.auth.signOut();
            setErrorMsg(
              `Registration Rejected: ${pharm.rejection_reason || "Your application was not approved by platform administrators."}`
            );
            setLoading(false);
            return;
          }
        }
      }

      const target =
        targetRole === "admin"
          ? "/admin"
          : targetRole === "pharmacy"
          ? "/pharmacy/dashboard"
          : "/dashboard";

      window.location.href = target;
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        // Validate pharmacy fields
        if (role === "pharmacy") {
          if (!pharmacyName.trim() || !licenseNumber.trim() || !pharmacyAddress.trim()) {
            throw new Error("Pharmacy name, license number, and address are required for registration.");
          }
        }

        // Sign Up flow
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
            data: {
              full_name: fullName.trim() || email.split("@")[0],
              role: role,
              pharmacy_name: pharmacyName.trim(),
              license_number: licenseNumber.trim(),
              pharmacy_phone: pharmacyPhone.trim(),
              pharmacy_address: pharmacyAddress.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // If pharmacy registration, create the pharmacy entry with status 'pending'
          if (role === "pharmacy") {
            try {
              await supabase.from("pharmacies").insert({
                owner_id: data.user.id,
                town_id: (townList.find(t => t.id === selectedTownId) || townList[0]).id,
                town_name: (townList.find(t => t.id === selectedTownId) || townList[0]).name,
                lat: (townList.find(t => t.id === selectedTownId) || townList[0]).lat,
                lng: (townList.find(t => t.id === selectedTownId) || townList[0]).lng,
                name: pharmacyName.trim(),
                address: pharmacyAddress.trim(),
                phone: pharmacyPhone.trim() || null,
                license_number: licenseNumber.trim(),
                status: "pending",
                reservation_expiry_hours: 24,
              });
            } catch (pErr) {
              console.warn("Pharmacy pre-registration note:", pErr);
            }

            await supabase.auth.signOut();
            setSuccessMsg(
              "Registration submitted successfully! Your pharmacy registration is awaiting admin approval. You will be able to log in once administrators verify your license credentials."
            );
            return;
          }

          if (data.session) {
            await handleRedirect(data.user.id);
          } else {
            setSuccessMsg("Registration successful! Please check your email inbox to verify your account before signing in.");
          }
        }
      } else {
        // Sign In flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.user) {
          await handleRedirect(data.user.id);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "An error occurred. Please verify your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clinical-card rounded-xl p-8 md:p-10 bg-white border border-outline-variant shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-md">
        {/* Toggle between Sign In / Sign Up at top of card */}
        <div className="flex bg-surface-container-low p-1 rounded-xl mb-4 border border-outline-variant/60">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${
              !isSignUp ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${
              isSignUp ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Create Account
          </button>
        </div>

        {isSignUp && (
          <>
            <div className="space-y-xs">
              <label className="block font-label-md text-on-surface" htmlFor="role">
                I want to register as
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    role === "user"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  Patient / User
                </button>
                <button
                  type="button"
                  onClick={() => setRole("pharmacy")}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    role === "pharmacy"
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-base">local_pharmacy</span>
                  Pharmacy Owner
                </button>
              </div>
            </div>

            {role === "pharmacy" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified_user</span>
                  Administrator Verification Required
                </p>
                <p>
                  Pharmacy partner registrations are reviewed by administrators. Once approved, you will be able to log in and list your inventory.
                </p>
              </div>
            )}

            <div className="space-y-xs">
              <label className="block font-label-md text-on-surface" htmlFor="fullName">
                {role === "pharmacy" ? "Contact Person / Pharmacist Name" : "Full Name"}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  person
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
                  id="fullName"
                  placeholder={role === "pharmacy" ? "e.g., Dr. John Davis, RPh" : "John Doe"}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Extra Pharmacy Fields */}
            {role === "pharmacy" && (
              <>
                <div className="space-y-xs">
                  <label className="block font-label-md text-on-surface" htmlFor="pharmacyName">
                    Pharmacy Legal Name *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      store
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
                      id="pharmacyName"
                      placeholder="e.g., Central Care Pharmacy"
                      type="text"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-xs">
                  <label className="block font-label-md text-on-surface" htmlFor="licenseNumber">
                    Pharmacy License / Registration Number *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      badge
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all font-mono"
                      id="licenseNumber"
                      placeholder="e.g., PH-2026-88910"
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-xs">
                  <label className="block font-label-md text-on-surface" htmlFor="pharmacyTown">
                    City / Town (Kerala Municipality) *
                  </label>
                  <div className="relative mb-3">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      explore
                    </span>
                    <select
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface font-body-md transition-all appearance-none cursor-pointer"
                      id="pharmacyTown"
                      value={selectedTownId}
                      onChange={(e) => {
                        const tId = e.target.value;
                        setSelectedTownId(tId);
                        const town = townList.find(t => t.id === tId);
                        if (town && !pharmacyAddress.toLowerCase().includes(town.name.toLowerCase())) {
                          setPharmacyAddress(prev => prev ? `${prev}, ${town.name}` : `${town.name}, Kerala`);
                        }
                      }}
                      required
                    >
                      {townList.map((town) => (
                        <option key={town.id} value={town.id}>
                          🇮🇳 {town.name} ({town.district} District)
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="block font-label-md text-on-surface" htmlFor="pharmacyAddress">
                    Pharmacy Physical Address *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      location_on
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
                      id="pharmacyAddress"
                      placeholder="e.g., 45 Healthcare Blvd, Kuttippuram"
                      type="text"
                      value={pharmacyAddress}
                      onChange={(e) => setPharmacyAddress(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-xs">
                  <label className="block font-label-md text-on-surface" htmlFor="pharmacyPhone">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                      call
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
                      id="pharmacyPhone"
                      placeholder="+91 98460 12345"
                      type="text"
                      value={pharmacyPhone}
                      onChange={(e) => setPharmacyPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="space-y-xs">
          <label className="block font-label-md text-on-surface" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              mail
            </span>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
              id="email"
              placeholder="name@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-xs">
          <div className="flex justify-between items-center">
            <label className="block font-label-md text-on-surface" htmlFor="password">
              Password
            </label>
            {!isSignUp && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-label-sm text-primary hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              lock
            </span>
            <input
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5 flex-shrink-0">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        <button
          className="w-full bg-primary text-on-primary font-label-md py-4 rounded-xl hover:bg-primary/90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin material-symbols-outlined text-base">progress_activity</span>
              Processing...
            </span>
          ) : (
            <>
              {isSignUp ? (role === "pharmacy" ? "Submit Registration for Review" : "Create Account") : "Sign In"}
              <span className="material-symbols-outlined text-md">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-on-surface-variant flex items-center justify-between">
        <div>
          {isSignUp ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-primary font-semibold hover:underline ml-1"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to MediFind?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className="text-primary font-semibold hover:underline ml-1"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

        <Link href="/admin/login" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
          Admin Portal &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="w-full top-0 sticky bg-surface border-b border-outline-variant h-16 flex items-center px-margin-mobile md:px-margin-desktop z-50">
        <div className="flex justify-between items-center w-full max-w-max-width mx-auto">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
            <span className="font-display text-headline-md md:text-display text-primary">MediFind</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link className="text-on-surface-variant font-label-md hover:text-primary transition-colors" href="/support">
              Support
            </Link>
            <Link className="text-xs text-slate-500 hover:text-primary font-mono transition-colors" href="/admin/login">
              Admin Login
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-xl px-margin-mobile relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-surface-container-high rounded-full blur-3xl"></div>
        </div>
        <div className="w-full max-w-md z-10">
          <div className="text-center mb-xl">
            <h1 className="font-headline-lg text-on-surface mb-xs">
              Welcome to MediFind
            </h1>
            <p className="font-body-md text-on-surface-variant">
              Securely manage your prescriptions and find medicine fast.
            </p>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-on-surface-variant">Loading form...</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-xl grid grid-cols-3 gap-md opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="bg-surface-container rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-primary mb-2">verified_user</span>
              <span className="font-label-sm text-on-surface">HIPAA Secure</span>
            </div>
            <div className="bg-surface-container rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-primary mb-2">speed</span>
              <span className="font-label-sm text-on-surface">Fast Results</span>
            </div>
            <div className="bg-surface-container rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-primary mb-2">support_agent</span>
              <span className="font-label-sm text-on-surface">24/7 Support</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-surface-container-highest border-t border-outline-variant">
        <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center">
            <div className="flex flex-col gap-sm">
              <span className="font-headline-lg text-primary">MediFind</span>
              <p className="font-body-sm text-on-surface-variant max-w-sm">
                Leading the digital transformation of prescription management and pharmacy accessibility.
              </p>
            </div>
            <div className="flex flex-wrap gap-md md:justify-end">
              <a className="text-on-surface-variant font-body-sm hover:underline hover:text-primary transition-all" href="#">
                Privacy Policy
              </a>
              <a className="text-on-surface-variant font-body-sm hover:underline hover:text-primary transition-all" href="#">
                Terms of Service
              </a>
              <Link className="text-on-surface-variant font-body-sm hover:underline hover:text-primary transition-all" href="/support">
                Support
              </Link>
            </div>
          </div>
          <div className="mt-xl pt-lg border-t border-outline-variant/30 flex justify-between items-center text-xs text-on-surface-variant">
            <p>© 2026 MediFind Healthcare Systems. All rights reserved.</p>
            <Link href="/admin/login" className="hover:text-primary">
              Master Admin Control Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
