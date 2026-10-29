/**
 * Seed First Super Admin Account
 * Usage:
 *   node scripts/seed-admin.js <email> [password] [full_name]
 *
 * Example:
 *   node scripts/seed-admin.js admin@medifind.com
 *   node scripts/seed-admin.js admin@medifind.com "SecurePass123!" "Platform SuperAdmin"
 *
 * This script promotes an existing user or creates a new super admin account.
 * Credentials are not hardcoded and are read securely from command line arguments
 * or environment variables.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load local env if available
const envPath = fs.existsSync(path.join(__dirname, "..", ".env.local"))
  ? path.join(__dirname, "..", ".env.local")
  : path.join(__dirname, "..", ".env");

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const idx = line.indexOf("=");
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and a Supabase key must be set.");
  process.exit(1);
}

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const fullName = process.argv[4] || process.env.ADMIN_NAME || "System SuperAdmin";

if (!email) {
  console.log(`
Usage:
  node scripts/seed-admin.js <email> [password] [full_name]

Or set environment variables:
  ADMIN_EMAIL="admin@medifind.com" ADMIN_PASSWORD="..." node scripts/seed-admin.js

Direct SQL alternative (Run in Supabase SQL Console):
  UPDATE public.profiles SET role = 'admin' WHERE email = '<your-email>';
`);
  process.exit(1);
}

async function seedAdmin() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`Checking profile for: ${email}...`);

  // Check if profile exists
  const { data: existingProfile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    console.log(`Found existing user (ID: ${existingProfile.id}, current role: ${existingProfile.role}).`);
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ role: "admin", is_suspended: false })
      .eq("id", existingProfile.id);

    if (updateErr) {
      console.error("Failed to promote user to admin:", updateErr.message);
      console.log("\nYou can promote this user manually in Supabase SQL Editor:");
      console.log(`  UPDATE public.profiles SET role = 'admin' WHERE id = '${existingProfile.id}';`);
      process.exit(1);
    }

    console.log(`✅ Success! User ${email} has been promoted to 'admin'.`);
    return;
  }

  // If not found and password provided, try sign up
  if (password) {
    console.log(`User does not exist yet. Attempting to create account with provided credentials...`);
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "admin",
        },
      },
    });

    if (signUpErr) {
      console.error("Failed to sign up user:", signUpErr.message);
      process.exit(1);
    }

    if (signUpData.user) {
      // Ensure role is admin in profiles
      await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", signUpData.user.id);

      console.log(`✅ Admin account created successfully for: ${email}`);
      console.log(`Role: admin`);
    }
  } else {
    console.log(`User '${email}' was not found in profiles.`);
    console.log(`Please sign up first at /login or provide a password:`);
    console.log(`  node scripts/seed-admin.js ${email} "YourSecretPassword123"`);
  }
}

seedAdmin().catch(console.error);

