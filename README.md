# MediFinder (Medicine Availability Finder)

## Abstract
Medicine Availability Finder (MediFinder) is a web-based project designed to help users quickly find the availability of medicines in nearby registered pharmacies through a single online platform. Instead of visiting multiple medical stores or making several phone calls, users can search for a medicine by its name and instantly check its availability. This system is designed to save time, improve convenience, and provide quick access to essential medicines, especially during emergency situations.

The application provides separate modules for users, pharmacies, and administrators:
- **Users**: Can search for medicines, view pharmacy details, upload digital prescriptions, and reserve medicine stock.
- **Pharmacies**: Can update their medicine stock, verify digital patient prescriptions, and manage reservations.
- **Administrators**: Manage users, pharmacies, and medicine records to maintain the reliability of the system.

The project demonstrates important web development concepts such as user authentication, database management, search functionality, CRUD operations, digital document verification, and responsive interface design.

---

## 🚀 Current Architecture & Implemented Modules

### 1. User Module (Patient / Consumer)
- **FTS Search & Proximity Sorting**: Users can search for medicines by name. Proximity calculation (using the Haversine formula) lists stores closest first.
- **Search Filters**: Proximity radius (range slider), maximum price, and stock levels (`in_stock` only).
- **Proximity Map View**: Displays search results as dynamic map pins alongside a pulsing **"You Are Here"** blue GPS locator pin.
- **GPS Auto-Snapping**: Snapping selector defaults to Valanchery coordinates with quick town auto-snapping (Valanchery, Perinthalmanna, Kuttippuram, Kottakkal, Malappuram, Tirur).
- **Online Medicine Reservation & Prescription Upload**: Patients can reserve medicine stock and upload digital prescriptions (`.png`, `.jpg`, `.pdf`) with live thumbnail previews and removal tools.
- **Patient Dashboard**: Active reservations display with real-time status badges (`Pending Review`, `Ready for Pickup`, `Collected`, `Cancelled`). Includes prescription preview and document download modals.

### 2. Pharmacy Module (Store Owner)
- **Onboarding Wizard**: Prompts new pharmacy owners to register store coordinates, address, phone number, and hours before accessing tools.
- **Inventory CRUD**: Fully responsive interface to insert stock levels (from master catalog or custom additions), edit prices/quantities, upload custom item images, and delete records.
- **Active Reservations & Prescription Verification**: Toggle active sidebar views to manage patient reservations. Store owners can review attached patient prescriptions in a dedicated high-resolution verification modal before marking orders as "Ready", "Collected" (which auto-decrements stock quantity via Postgres triggers), or "Cancelled".
- **Real-time Sync Channel**: Supabase PostgreSQL changes replication dynamically syncs dashboard views for stock changes and incoming reservations.

### 3. Authentication & Route Protection
- **Role-based Authentication**: Email/password authentication via Supabase Auth saving roles (`user`, `pharmacy`, `admin`).
- **Route Guards**: Next.js middleware blocks dashboard routes for unauthenticated users and handles token refreshes.

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
   - Schema structures: [0001_init.sql](file:///Users/selmanulfarisy/Desktop/Github/MediFind/supabase/migrations/0001_init.sql)
   - Reservation triggers: [0002_reservations.sql](file:///Users/selmanulfarisy/Desktop/Github/MediFind/supabase/migrations/0002_reservations.sql)
   - Dynamic Image URLs: [0003_image_urls.sql](file:///Users/selmanulfarisy/Desktop/Github/MediFind/supabase/migrations/0003_image_urls.sql)
   - Prescription Upload & Storage Bucket: [0004_prescription_upload.sql](file:///Users/selmanulfarisy/Desktop/Github/MediFind/supabase/migrations/0004_prescription_upload.sql)
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

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

