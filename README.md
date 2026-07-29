# MediFind

Medicine Availability Finder — built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

MediFind connects patients with nearby pharmacies having critical medications in stock.

---

## 🚀 Current Architecture & Features

### 1. Authentication & Security
- **Authentication**: Fully integrated with Supabase Auth (`signInWithPassword` and `signUp`).
- **Role-based Redirection**: Directs users based on their account type:
  - `user` (Patient) $\rightarrow$ `/dashboard`
  - `pharmacy` (Pharmacy Owner) $\rightarrow$ `/pharmacy/dashboard`
  - `admin` $\rightarrow$ `/admin`
- **Route Protection**: Middleware dynamically protects sensitive pages and redirects unauthenticated users back to `/login`.
- **User Sessions**: Middleware automatically refreshes Supabase session tokens on incoming requests.

### 2. Live Medicine Search (`/search`)
- **FTS Querying**: Searches the `pharmacy_stock` table using a full-text search index against `medicines.name`.
- **Custom Filters**: Allows filtering by availability (In Stock Only), max distance (radius slider), maximum price, and pharmacy operating types.
- **Location & Distance**: Uses the Haversine formula to compute and sort pharmacies by proximity.
- **Interactive Map**: Renders search results dynamically as map pins on a high-fidelity mock map with hover overlays detailing the pharmacy name and medicine price.

### 3. Pharmacy Inventory Dashboard (`/pharmacy/dashboard`)
- **Inventory CRUD**: Pharmacy owners can add new medicine stock (using existing catalog items or adding custom medicines), edit quantity/price details, and delete entries.
- **Onboarding Wizard**: Prompts new pharmacy owners to configure their store profile (name, address, hours, location coordinates) upon first login.
- **Real-time Inventory**: Implements Supabase Realtime PG channel subscription to refresh the dashboard instantly whenever stock modifications occur.

### 4. Public Pharmacy Details (`/pharmacy/[id]`)
- **Server Components**: Uses server-side database fetching to load pharmacy profile details and real stock level counts.
- **Interactive Links**: Connects direct phone dialing (`tel:`) and map navigation directions links dynamically.

---

## 🛠️ Tech Stack & Structure

- **Core**: Next.js 14 (App Router) & React 18
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase SSR (`@supabase/ssr` & `@supabase/supabase-js`)
- **Icons**: Material Symbols Outlined
- **Database Schema**:
  - `profiles`: role-based user attributes (Patient/Pharmacy/Admin)
  - `pharmacies`: store details linked to an owner
  - `medicines`: master medicine catalog
  - `pharmacy_stock`: inventory levels with trigger-synced stock status

---

## ⚙️ Setup & Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configuration**:
   Ensure `.env.local` contains your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔮 What's Next? (Roadmap)

1. **Real Payment / Reservation Checkout**:
   - Integrate Stripe to allow patients to pay or lock in their reservation securely.
2. **Prescription Upload Processing**:
   - Wire up the dashboard "Upload Prescription" button to save files directly to a Supabase Storage bucket.
   - Implement OCR/AI-extract to read uploaded files and auto-fill search criteria.
3. **Admin Dashboard (`/admin`)**:
   - Design and build out the administrator view to moderate reviews, inspect catalog additions, and review pharmacy applications.
4. **Actual Geolocation Tracking**:
   - Replace the mock map with a live Google Maps or Mapbox GL map component using actual geolocation watch updates.
