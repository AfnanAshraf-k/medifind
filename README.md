# MediFinder (Medicine Availability Finder)

## Abstract
Medicine Availability Finder (MediFinder) is a web-based project designed to help users quickly find the availability of medicines in nearby registered pharmacies through a single online platform. Instead of visiting multiple medical stores or making several phone calls, users can search for a medicine by its name and instantly check its availability. This system is designed to save time, improve convenience, and provide quick access to essential medicines, especially during emergency situations.

The application provides separate modules for users, pharmacies, and administrators:
- **Users**: Can search for medicines, view pharmacy details, upload digital prescriptions, and reserve medicine stock.
- **Pharmacies**: Can update their medicine stock, verify digital patient prescriptions, and manage reservations.
- **Administrators**: Complete platform oversight via `/admin` portal: approve/reject pharmacies, moderate catalog, manage customer/pharmacy accounts, view security audit logs, and trigger reservation expiry sweeps.

The project demonstrates important web development concepts such as user authentication, role-based access control (RBAC), database management, search functionality, CRUD operations, digital document verification, automated background schedulers, and responsive interface design.

---

## 🚀 Current Architecture & Implemented Modules

### 1. Master Admin Control Panel (`/admin`)
- **Super-Admin RBAC**: Strict role-based protection ensuring only verified super-admin profiles can access `/admin` and administrative APIs (`/api/admin/*`). Dedicated login at `/admin/login`.
- **Platform-Wide Metrics**: Real-time counters for total registered users, registered pharmacies, pending pharmacy approval requests, active reservations, and expired orders.
- **Pharmacy Approval Management**: Interactive review queue displaying licensing, address, and contact numbers. Approve with a single click or Reject with explanatory feedback notes.
- **Account Moderation**: View, search, filter, suspend, reactivate, or delete patient and pharmacy accounts.
- **Global Catalog & Reservation Oversight**: Add/edit/delete medications in the master catalog, monitor user reservations across all pharmacies, and cancel orders with automatic inventory restocking.
- **Security Audit Logs**: Tamper-evident activity logs capturing who executed which administrative actions with timestamp and JSON metadata.

### 2. Pharmacy Module (Store Owner)
- **Registration Approval Flow**: New pharmacy signups enter `PENDING` state and are blocked from dashboard access with clear awaiting-approval messaging. Rejected accounts display the admin's rejection notes.
- **Reservation Expiry Configuration**: Store owners can configure their custom reservation hold window (1 to 72 hours). Changing the setting immediately applies to all subsequent reservations.
- **Expiry Countdown & Deadlines**: Reservation management table displays real-time hold countdowns, expiration timestamps, and `EXPIRED` status flags.
- **Inventory CRUD**: Fully responsive interface to insert stock levels, edit prices/quantities, upload custom item images, and delete records.
- **Active Reservations & Prescription Verification**: Review attached patient prescriptions in a dedicated high-resolution verification modal before marking orders as "Ready", "Collected", or "Cancelled".
- **Real-time Sync Channel**: Supabase PostgreSQL changes dynamically sync inventory and reservation counts.

### 3. User Module (Patient / Consumer)
- **Approved Pharmacies Search**: Customer search strictly queries verified and approved pharmacies, preventing unapproved stores or unverified medicines from appearing.
- **Reservation Hold Timers**: Displays countdown timers on reservations (e.g. `Hold expires in ~12h`) so customers know their pickup deadline before items are released back to stock.
- **FTS Search & Proximity Sorting**: Users can search for medicines by name. Proximity calculation (using the Haversine formula) lists stores closest first.
- **Online Medicine Reservation & Prescription Upload**: Patients can reserve medicine stock and upload digital prescriptions (`.png`, `.jpg`, `.pdf`) with live thumbnail previews and removal tools.
- **Patient Dashboard**: Active reservations display with real-time status badges (`Pending Review`, `Ready for Pickup`, `Collected`, `Cancelled`, `Expired`).

### 4. Automated Reservation Expiry Engine
- **Postgres Expiry Trigger**: Automatically calculates and assigns `expires_at` based on the host pharmacy's configured `reservation_expiry_hours`.
- **Inventory Restock Trigger**: Restores reserved quantities back to available stock if a reservation is cancelled or marked `expired`.
- **Cron / Sweep API (`/api/cron/expire-reservations`)**: Can be invoked by scheduled cron jobs (Vercel Cron, GitHub Actions, or Supabase pg_cron) to expire overdue orders. Supported with an interactive "Run Expiry Sweep" button directly inside the Admin Panel.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) & React 18
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase SSR (`@supabase/ssr` & `@supabase/supabase-js`)
- **Storage**: Supabase Storage (`prescriptions` bucket)
- **Icons**: Material Symbols Outlined

---

## ⚙️ Setup & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Environment Variables**:
   Ensure `.env.local` is configured:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Database Schema & SQL Migrations**:
   Copy and run the migrations inside your Supabase Console SQL Editor:
   - Schema structures: `0001_init.sql`
   - Reservation triggers: `0002_reservations.sql`
   - Dynamic Image URLs: `0003_image_urls.sql`
   - Prescription Upload & Storage Bucket: `0004_prescription_upload.sql`
   - Admin RBAC, Pharmacy Approvals & Reservation Expiry: `0005_admin_approvals_and_expiry.sql`
   - Regional Towns & GPS Map Snapping: `0006_towns_and_locations.sql`
   - Admin Medicine Delete Policy & RPC: `0007_admin_medicine_delete_policy.sql`
   - Admin User & Pharmacy Deletion & Reservation Hold: `0008_admin_deletions_and_reservation_hold.sql`
4. **Seed Super-Admin Account**:
   Run the secure admin seeder script to promote or create your initial administrator account:
   ```bash
   # Interactive prompt or using environment variables
   npm run seed:admin
   # Or with arguments:
   node scripts/seed-admin.js --email admin@medifind.com --password YourSecurePassword --name "Master Admin"
   ```
5. **Run Automated Test Suite**:
   ```bash
   npm test
   ```
6. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Admin portal available at [http://localhost:3000/admin](http://localhost:3000/admin).

### 🚀 Vercel Deployment
1. Connect your repository to Vercel.
2. In **Settings > Environment Variables**, add the following:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://wnvytubydwljqulujmuh.supabase.co` | Supabase API URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_UR6aTGXDy5EpsclFP62uiw_YN-KQ3FI` | Supabase Anon Key |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_UR6aTGXDy5EpsclFP62uiw_YN-KQ3FI` | (Optional) Alias |
3. Deploy!

---

## 🔮 What's Next? (Roadmap)

We are building out the advanced versions from the abstract:
1. **GPS-Based Nearby Pharmacy Search** ✅ (Completed)
2. **Online Medicine Reservation** ✅ (Completed)
3. **Digital Prescription Upload** ✅ (Completed)
4. **AI-Based Medicine Recommendations** 🧠 (Next Up)
5. **Online Payment Integration** 💳
6. **Home Delivery Integration** 🚚
7. **Admin Dashboard (`/admin`)** 👑
8. **Analytics Dashboard** 📊

