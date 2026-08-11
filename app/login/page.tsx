"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"user" | "pharmacy">("user");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        // Sign Up flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName || email.split("@")[0],
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Check if user requires email verification or is already signed in
          if (data.session) {
            // Logged in immediately
            await handleRedirect(data.user.id);
          } else {
            setErrorMsg("Registration successful! Please check your email to verify your account.");
          }
        }
      } else {
        // Sign In flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await handleRedirect(data.user.id);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = async (userId: string) => {
    // Fetch profile to get role
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      router.push("/dashboard");
      return;
    }

    if (profile.role === "admin") {
      router.push("/admin");
    } else if (profile.role === "pharmacy") {
      router.push("/pharmacy/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="w-full top-0 sticky bg-surface border-b border-outline-variant h-16 flex items-center px-margin-mobile md:px-margin-desktop z-50">
        <div className="flex justify-between items-center w-full max-w-max-width mx-auto">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              medical_services
            </span>
            <span className="font-display text-headline-md md:text-display text-primary">MediFind</span>
          </div>
          <div>
            <a className="text-on-surface-variant font-label-md hover:text-primary transition-colors" href="#">
              Emergency
            </a>
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
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="font-body-md text-on-surface-variant">
              {isSignUp
                ? "Join MediFind to manage stock or locate medicine instantly."
                : "Securely manage your prescriptions and find medicine fast."}
            </p>
          </div>

          <div className="clinical-card rounded-xl p-8 md:p-10 bg-white border border-outline-variant">
            <form onSubmit={handleSubmit} className="space-y-md">
              {isSignUp && (
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
                      placeholder="John Doe"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
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
                    placeholder="name@hospital.com"
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
                    <a className="font-label-sm text-primary hover:underline" href="#">
                      Forgot Password?
                    </a>
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
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-xs pt-1">
                  <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-lg border border-outline-variant/50 leading-relaxed">
                    ℹ️ <strong>Pharmacy Owners:</strong> Store registration requires administrator verification. Please sign up as a user below, or contact support to request an owner account.
                  </p>
                </div>
              )}

              {!isSignUp && (
                <div className="flex items-center gap-2 py-2">
                  <input
                    className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
                    id="remember"
                    type="checkbox"
                  />
                  <label className="font-body-sm text-on-surface-variant" htmlFor="remember">
                    Remember this device
                  </label>
                </div>
              )}

              {errorMsg && (
                <p className={`text-body-sm ${errorMsg.includes("successful") ? "text-green-600" : "text-error"}`}>
                  {errorMsg}
                </p>
              )}

              <button
                className="w-full bg-primary text-on-primary font-label-md py-4 rounded-full hover:bg-primary-container active:opacity-80 transition-all flex justify-center items-center gap-2 shadow-sm disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
                <span className="material-symbols-outlined text-md">arrow_forward</span>
              </button>
            </form>

            <div className="relative my-xl">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-body-sm">
                <span className="bg-white px-4 text-on-surface-variant">
                  {isSignUp ? "Already have an account?" : "New to MediFind?"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg("");
              }}
              className="w-full border border-outline text-on-surface font-label-md py-3 rounded-full hover:bg-surface-variant transition-all flex justify-center items-center gap-2"
            >
              {isSignUp ? "Sign in to existing account" : "Sign up for an account"}
            </button>
          </div>

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
              <a className="text-on-surface-variant font-body-sm hover:underline hover:text-primary transition-all" href="#">
                Pharmacy Portal
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
