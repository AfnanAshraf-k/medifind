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
- **Search Functionality**: Users can search for medicines by name. The query joins `pharmacy_stock` $\rightarrow$ `pharmacies` $\rightarrow$ `medicines` utilizing a GIN full-text index on `medicines.name`.
- **Search Filters**: Proximity (distance slider using the Haversine formula on coordinates), max price, availability (in stock only), and pharmacy attributes (is open, 24h access, drive-thru).
- **Proximity & Proportional Map**: Computes distance relative to coordinates and lists stores closest first. Map view renders results as dynamic pins with hover tooltips.
- **Pharmacy Details**: Public page showing real rating, reviews, address, open hours status, and live stock catalogs.

### 2. Pharmacy Module (Store Owner)
- **Onboarding Wizard**: Prompts new pharmacy accounts to register their store details (name, coordinates, address, phone) upon first login.
- **Inventory CRUD**: Fully interactive dashboard to add catalog medicines (or create custom ones), update price/quantity stock, and delete records.
- **Real-time Inventory**: Automatically syncs stock status (`in_stock`, `low_stock`, `out_of_stock`) from quantity via a database trigger and streams updates to active dashboards via Supabase Realtime PG channel subscription.

### 3. Shared Infrastructure & Authentication
- **User Authentication**: Secure email/password login and registration using Supabase Auth, dynamically saving profile roles (`user`, `pharmacy`, `admin`).
- **Route Protection**: Next.js middleware guards protected routes (`/dashboard`, `/pharmacy/dashboard`) and handles session refreshes automatically.

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
3. **Run Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 🔮 What's Next? (Roadmap based on Project Abstract)

We will implement the advanced features from the abstract one by one:
1. **GPS-Based Nearby Pharmacy Search**: Integrate live location APIs (browser Geolocation API with Mapbox/Google Maps) to locate users and track distances dynamically.
2. **Online Medicine Reservation**: Allow users to reserve medicine quantities directly from the search results or pharmacy details view.
3. **Digital Prescription Upload**: Enable patients to upload scanned prescription documents and link them to their profiles/orders.
4. **AI-Based Medicine Recommendations**: Suggest generic alternatives or companion medications using simple database/AI matching.
5. **Online Payment Integration**: Integrate a payment gateway (e.g. Stripe) to allow direct purchases or reservation deposit holding.
6. **Home Delivery Integration**: Build coordinate route trackers or delivery status indicators.
7. **Admin Dashboard (`/admin`)**: Build the module to moderate users, pharmacies, and inventory records.
8. **Analytics Dashboard**: Provide inventory and search metrics for pharmacy owners and admins.
