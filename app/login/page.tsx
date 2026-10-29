"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "pharmacy">("user");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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

  const [resetSent, setResetSent] = useState(false);

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
      // 1. Check profile role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      let targetRole = profile?.role;

      // 2. Fallback to auth metadata if profile row isn't immediately populated
      if (!targetRole) {
        const { data: userData } = await supabase.auth.getUser();
        targetRole = userData.user?.user_metadata?.role || role || "user";
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
        // Sign Up flow
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback`,
            data: {
              full_name: fullName.trim() || email.split("@")[0],
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          if (data.session) {
            // User signed up and logged in immediately
            await handleRedirect(data.user.id);
          } else {
            // Email confirmation required by Supabase project settings
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

            <div className="space-y-xs">
              <label className="block font-label-md text-on-surface" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  person
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md transition-all"
                  id="fullName"
                  placeholder={role === "pharmacy" ? "e.g., CarePlus Pharmacy (Dr. John)" : "John Doe"}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
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
            <span className="material-symbols-outlined text-base mt-0.5">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">check_circle</span>
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
              {isSignUp ? "Create Account" : "Sign In"}
              <span className="material-symbols-outlined text-md">arrow_forward</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-on-surface-variant">
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
          <div>
            <Link className="text-on-surface-variant font-label-md hover:text-primary transition-colors" href="/support">
              Support
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
          <div className="mt-xl pt-lg border-t border-outline-variant/30 flex justify-center md:justify-start">
            <p className="font-body-sm text-on-surface-variant">© 2026 MediFind Healthcare Systems. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
