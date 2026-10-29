import { createBrowserClient } from "@supabase/ssr";

/**
 * Use this client inside Client Components ("use client").
 * Reads the public URL/anon key from env vars — safe to expose to the browser.
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "placeholder-key";

  return createBrowserClient(supabaseUrl, supabaseKey);
}
