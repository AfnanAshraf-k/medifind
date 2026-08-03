# MediFinder (Medicine Availability Finder)

## Abstract
Medicine Availability Finder (MediFinder) is a web-based project designed to help users quickly find the availability of medicines in nearby registered pharmacies through a single online platform. Instead of visiting multiple medical stores or making several phone calls, users can search for a medicine by its name and instantly check its availability. This system is designed to save time, improve convenience, and provide quick access to essential medicines, especially during emergency situations.

The application provides separate modules for users, pharmacies, and administrators:
- **Users**: Can search for medicines and view pharmacy details.
- **Pharmacies**: Can update their medicine stock to ensure accurate availability information.
- **Administrators**: Manage users, pharmacies, and medicine records to maintain the reliability of the system.

The project demonstrates important web development concepts such as user authentication, database management, search functionality, CRUD operations, and responsive interface design, making it a practical implementation of software engineering and database principles.

---

## 🚀 Current Architecture & Implemented Modules

### 1. User Module (Patient / Consumer)
- **FTS Search & Proximity Sorting**: Users can search for medicines by name. Proximity calculation (using the Haversine formula) lists stores closest first.
- **Search Filters**: Proximity radius (range slider), maximum price, and stock levels (`in_stock` only).
- **Proximity Map View**: Displays search results as dynamic map pins alongside a pulsing **"You Are Here"** blue GPS locator pin.
- **GPS Location Mocking**: A debugging selector in the sidebar allows reviewers to simulate location coordinates (London, Birmingham, Manchester) to check distance sorting live.
- **Online Medicine Reservation**: Patients can reserve medicine stock from search results. A custom dialog checks inventory levels, computes estimated costs, and registers the order.
- **Patient Dashboard**: Active reservations display with real-time status badges (`Pending Review`, `Ready for Pickup`, `Collected`, `Cancelled`). Includes cancellation triggers.

### 2. Pharmacy Module (Store Owner)
- **Onboarding Wizard**: Prompts new pharmacy owners to register store coordinates, address, phone number, and hours before accessing tools.
- **Inventory CRUD**: Fully responsive interface to insert stock levels (from master catalog or custom additions), edit prices/quantities, and delete records.
- **Active Reservations Manager ("Orders")**: Toggle active sidebar views to manage patient reservations. Pharmacy owners can mark orders as "Ready", mark them as "Collected" (which auto-decrements stock quantity via Postgres triggers), or cancel them.
- **Real-time Sync Channel**: Supabase PostgreSQL changes replication dynamically syncs dashboard views for stock changes and incoming reservations.

### 3. Authentication & Route Protection
- **Role-based Authentication**: Email/password authentication via Supabase Auth saving roles (`user`, `pharmacy`, `admin`).
- **Route Guards**: Next.js middleware blocks dashboard routes for unauthenticated users and handles token refreshes.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router) & React 18
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase SSR (`@supabase/ssr` & `@supabase/supabase-js`)
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
4. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 🔮 What's Next? (Roadmap)

We are building out the advanced versions from the abstract:
1. **GPS-Based Nearby Pharmacy Search** ✅ (Completed)
2. **Online Medicine Reservation** ✅ (Completed)
3. **Digital Prescription Upload** 📄 (Next Up)
4. **AI-Based Medicine Recommendations** 🧠
5. **Online Payment Integration** 💳
6. **Home Delivery Integration** 🚚
7. **Admin Dashboard (`/admin`)** 👑
8. **Analytics Dashboard** 📊
