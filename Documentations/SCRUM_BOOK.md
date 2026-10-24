# KTU MCA 20MCA245 MINI PROJECT — SCRUM BOOK (ROUGH RECORD)

**Project Title:** MediFind — A Hyperlocal Medicine Availability Finder and Digital Prescription Platform  
**Candidate Name:** AFNAN ASHRAF K  
**KTU Register Number:** KITM25MCA-2004  
**Academic Batch:** 2025 – 2027 (Semester 3)  
**Institution:** KMCT Institute of Technology and Management, Kuttippuram  
**Department:** Department of Computer Applications  
**Project Guide / Faculty Supervisor:** Asst. Prof. Mydhili Manoj  
**Head of Department:** Asst. Prof. Jaseedha P P  
**Scrum Master / Product Owner:** Afnan Ashraf K (Student Developer / Project Owner)  
**Primary Focus Area:** Perinthalmanna, Valanchery (Malappuram District, Kerala)  

---

## TABLE OF CONTENTS

- [Part I: Product Backlog & Sprint Logs](#part-i-product-backlog--sprint-logs)
  - [1.1 Product Backlog & User Stories](#11-product-backlog--user-stories)
  - [1.2 Sprint Breakdown & Velocity Tracking](#12-sprint-breakdown--velocity-tracking)
  - [1.3 Daily Standup & Bi-Weekly Scrum Review Minutes](#13-daily-standup--bi-weekly-scrum-review-minutes)
- [Part II: Database & UI Design Artifacts](#part-ii-database--ui-design-artifacts)
  - [2.1 Relational Database Architecture](#21-relational-database-architecture)
  - [2.2 PostgreSQL Schema Definitions](#22-postgresql-schema-definitions)
  - [2.3 UI Layouts & Wireframe Progression](#23-ui-layouts--wireframe-progression)
- [Part III: Testing & Validation Log](#part-iii-testing--validation-log)
  - [3.1 Test-Driven Development (TDD) Strategy](#31-test-driven-development-tdd-strategy)
  - [3.2 System Test Execution Records](#32-system-test-execution-records)
  - [3.3 Bug Tracking & Resolution Matrix](#33-bug-tracking--resolution-matrix)
- [Part IV: Details of Versions & Git Commit Log](#part-iv-details-of-versions--git-commit-log)
  - [4.1 Tagged Milestones](#41-tagged-milestones)
  - [4.2 Comprehensive Git Commit History](#42-comprehensive-git-commit-history)

---

# PART I: PRODUCT BACKLOG & SPRINT LOGS

### 1.1 Product Backlog & User Stories

| Backlog ID | User Persona | User Story Description | Priority | Estimation (Hours) | Story Points | Status |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **PB-01** | General User | As a user, I want to authenticate via secure email/password so that my reservations and uploaded prescriptions are protected. | High | 8 | 5 | Completed |
| **PB-02** | Patient | As a user, I want to search for medicines by brand or generic name so that I can immediately discover which local pharmacies have them in stock. | High | 10 | 8 | Completed |
| **PB-03** | Patient | As a citizen in Perinthalmanna or Valanchery, I want to view pharmacies sorted by distance from my coordinates so that I can minimize travel time in emergencies. | High | 10 | 8 | Completed |
| **PB-04** | Patient | As a user, I want to reserve medicine units online and upload a scanned doctor's prescription so that the store counter holds my order. | High | 12 | 8 | Completed |
| **PB-05** | Pharmacist | As a chemist, I want an onboarding wizard to configure store coordinates, contact info, and business hours. | Medium | 6 | 5 | Completed |
| **PB-06** | Pharmacist | As a chemist, I want an inventory dashboard to add, update prices, and edit medicine stock with instant status calculations. | High | 12 | 8 | Completed |
| **PB-07** | Pharmacist | As a chemist, I want to inspect uploaded patient prescriptions in a high-resolution modal before dispensing medications. | High | 8 | 5 | Completed |
| **PB-08** | System | As a system, I want database triggers to automatically decrement stock quantities whenever an order is marked as collected. | High | 6 | 5 | Completed |
| **PB-09** | Admin | As an administrator, I want to oversee registered pharmacies and users to ensure only certified establishments are listed. | Medium | 8 | 5 | Completed |

---

### 1.2 Sprint Breakdown & Velocity Tracking

#### **Sprint 0: Project Initiation & System Foundations (Weeks 1–2)**
* **Dates:** 01/07/2026 – 14/07/2026
* **Planned Hours:** 20 hrs | **Actual Hours:** 22 hrs
* **Sprint Goal:** Finalize problem formulation in Perinthalmanna and Valanchery, establish Next.js 14 project structure, and create Supabase PostgreSQL schemas.
* **Deliverables:** Git repository initialized, `.env` configured, base README drafted, and initial migrations (`0001_init.sql`) executed.

#### **Sprint 1: Authentication & Core Search Interface (Weeks 3–4)**
* **Dates:** 15/07/2026 – 28/07/2026
* **Planned Hours:** 24 hrs | **Actual Hours:** 25 hrs
* **Sprint Goal:** Implement Supabase SSR authentication, role assignment (`user`, `pharmacy`, `admin`), route protection middleware, and live medicine catalog search.
* **Deliverables:** `app/login`, `app/search`, Full-Text Search on `medicines` table.

#### **Sprint 2: Geolocation, Proximity Math & Interactive Map (Weeks 5–6)**
* **Dates:** 29/07/2026 – 11/08/2026
* **Planned Hours:** 22 hrs | **Actual Hours:** 24 hrs
* **Sprint Goal:** Implement client-side Haversine distance sorting, GPS town auto-snapping (Perinthalmanna, Valanchery, Kuttippuram, Kottakkal), and map visualization.
* **Deliverables:** Milestone 1 demo delivered to Project Guide.

#### **Sprint 3: Online Medicine Reservation & Inventory Suite (Weeks 7–8)**
* **Dates:** 12/08/2026 – 25/08/2026
* **Planned Hours:** 26 hrs | **Actual Hours:** 26 hrs
* **Sprint Goal:** Patient reservation modals, pharmacy dashboard inventory CRUD, and PostgreSQL triggers for inventory auto-decrement (`0002_reservations.sql`).
* **Deliverables:** Milestone 2 demo delivered; Interim Project Assessment Board presentation completed.

#### **Sprint 4: Digital Prescription Upload & Document Verification (Weeks 9–10)**
* **Dates:** 26/08/2026 – 08/09/2026
* **Planned Hours:** 22 hrs | **Actual Hours:** 21 hrs
* **Sprint Goal:** Configure cloud storage bucket `prescriptions`, implement client drag-and-drop file upload with live thumbnail preview, and high-resolution pharmacist inspection modal.
* **Deliverables:** Milestone 3 demo delivered; prescription upload pipeline verified.

#### **Sprint 5: System Testing, Dockerization & Final Documentation (Weeks 11–14)**
* **Dates:** 09/09/2026 – 24/10/2026
* **Planned Hours:** 28 hrs | **Actual Hours:** 26 hrs
* **Sprint Goal:** End-to-end integration testing across mobile devices, performance optimization, Dockerization, Vercel production deployment, Scrum Book, and Final KTU LaTeX Project Report.

---

### 1.3 Daily Standup & Bi-Weekly Scrum Review Minutes

| Date | Sprint | Attendees | Agenda & Work Discussed | Guide / Supervisor Remarks | Signature |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **04/07/2026** | Sprint 0 | Afnan Ashraf K, Guide | Discussed medicine shortage challenges in Perinthalmanna & Valanchery. | Topic approved. Proceed with database schema formulation. | *M.M.* |
| **14/07/2026** | Sprint 0 | Afnan Ashraf K, Guide | Review of initial PostgreSQL tables (`profiles`, `pharmacies`, `medicines`). | Good relational design. Ensure RLS policies are enabled early. | *M.M.* |
| **28/07/2026** | Sprint 1 | Afnan Ashraf K, Guide | Demonstrated multi-role authentication and `/search` dynamic query. | Authentication works smoothly. Ensure password hashing is verified. | *M.M.* |
| **11/08/2026** | Sprint 2 | Afnan Ashraf K, Guide | Demonstrated Haversine formula and GPS auto-snapping to Valanchery. | Proximity sorting is accurate. Prepare for First Interim Evaluation. | *M.M.* |
| **25/08/2026** | Sprint 3 | Afnan Ashraf K, Guide | Demo of reservation modal and trigger-based stock decrements. | Excellent trigger design. Next step: digital prescription upload. | *M.M.* |
| **08/09/2026** | Sprint 4 | Afnan Ashraf K, Guide | Demonstrated prescription PDF/image upload and high-resolution chemist modal. | Document verification solves legal compliance for chemists. Approved. | *M.M.* |
| **22/10/2026** | Sprint 5 | Afnan Ashraf K, Guide | Final review of LaTeX report, Scrum Book, test cases, and deployment. | Complete and well-documented. Approved for final submission. | *M.M.* |

---

# PART II: DATABASE & UI DESIGN ARTIFACTS

### 2.1 Relational Database Architecture

```
[ auth.users ]
      |
      | 1:1
      v
[ profiles ] <-------+
      |               |
      | 1:N           | 1:N
      v               |
[ pharmacies ]        |
      |               |
      | 1:N           |
      v               |
[ pharmacy_stock ]    |
      ^               |
      | 1:N           |
      |               |
[ medicines ]         |
      |               |
      +---------------+
              |
              | 1:N
              v
       [ reservations ] -------> [ storage.objects ]
```

### 2.2 PostgreSQL Schema Definitions

```sql
-- 1. Profiles Table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Pharmacies Table
CREATE TABLE public.pharmacies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  lat double precision,
  lng double precision,
  phone text,
  hours jsonb,
  rating numeric(2,1) DEFAULT 0,
  review_count integer DEFAULT 0,
  is_open boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Master Medicines Catalog
CREATE TABLE public.medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  category text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Pharmacy Stock
CREATE TABLE public.pharmacy_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id uuid NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  price numeric(10,2),
  status public.stock_status NOT NULL DEFAULT 'out_of_stock',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pharmacy_id, medicine_id)
);

-- 5. Reservations Table
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pharmacy_stock_id uuid NOT NULL REFERENCES public.pharmacy_stock(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  prescription_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 2.3 UI Layouts & Wireframe Progression
1. **Search & Discovery (`/search`):** Features a fixed header search bar, quick GPS town selection pills (Perinthalmanna, Valanchery, Kuttippuram, etc.), radius slider (1km–25km), in-stock toggle, and list/map view switcher.
2. **Pharmacy Detail & Inventory (`/pharmacy/[id]`):** Displays store timing badges, complete address, phone dial link, and live stock catalog with instant "Reserve" triggers.
3. **Patient Dashboard (`/dashboard`):** Real-time reservation list with status badges (`Pending Review`, `Ready for Pickup`, `Collected`, `Cancelled`) and prescription download buttons.
4. **Pharmacy Owner Dashboard (`/pharmacy/dashboard`):** Real-time orders inbox with a high-resolution prescription inspection modal and inventory stock management tables.

---

# PART III: TESTING & VALIDATION LOG

### 3.1 Test-Driven Development (TDD) Strategy
The system was verified using a multi-tiered testing structure:
* **Unit Testing:** Validated Haversine math (`calculateDistance`) against known geographical benchmarks (e.g., Perinthalmanna to Valanchery = 21.4 km).
* **Integration Testing:** Verified Supabase SSR session exchange, cookie token persistence, and PostgreSQL trigger execution.
* **User Acceptance Testing (UAT):** Conducted field tests with smartphones in Perinthalmanna and Valanchery.

### 3.2 System Test Execution Records

| Test ID | Module | Action Performed | Expected Outcome | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Search | Search "Amoxicillin" | Only pharmacies with Amoxicillin in stock are displayed | Matched stock displayed | **PASS** |
| **TC-02** | Geolocation | Click "Perinthalmanna" town chip | Proximity distances recalculate relative to Perinthalmanna | Distances recalculated | **PASS** |
| **TC-03** | Map View | Toggle to Map View | Markers appear at accurate coordinates with popups | Markers render accurately | **PASS** |
| **TC-04** | Prescription | Upload 2MB prescription PDF | File stored in `prescriptions` bucket; thumbnail visible | File uploaded successfully | **PASS** |
| **TC-05** | Reservation | Reserve 2 units of medicine | Order logged in `reservations` table with status `'pending'` | Record inserted | **PASS** |
| **TC-06** | Inspection | Chemist opens prescription modal | High-resolution preview opens with zoom and download | Modal renders document | **PASS** |
| **TC-07** | Order Status | Chemist clicks "Mark Ready" | Reservation status updates to `'ready'` in real time | Status updated live | **PASS** |
| **TC-08** | Auto Decrement | Chemist clicks "Mark Collected" | Trigger decrements inventory quantity by 2 | Quantity decremented | **PASS** |
| **TC-09** | Route Guard | Unauthenticated user visits `/dashboard` | System redirects to `/login` | Redirected to `/login` | **PASS** |
| **TC-10** | Stock Sync | Chemist updates stock to 0 | Status changes automatically to `'out_of_stock'` | Status auto-updated | **PASS** |

### 3.3 Bug Tracking & Resolution Matrix

| Bug ID | Date Found | Description | Severity | Resolution Applied | Date Fixed |
| :---: | :---: | :--- | :---: | :--- | :---: |
| **BUG-01** | 02/08/2026 | London coordinates displayed as default on initial load. | High | Updated default coordinates to Valanchery (`[10.9747, 76.0680]`) and added Perinthalmanna town snapping. | 03/08/2026 |
| **BUG-02** | 16/08/2026 | Patient dashboard allowed submitting reservations without login. | High | Integrated Next.js middleware route guard redirecting unauthenticated users to `/login`. | 17/08/2026 |
| **BUG-03** | 22/08/2026 | Stock quantity was not decrementing when patient collected medicine. | Critical | Implemented PostgreSQL trigger `decrement_stock_on_collection` on reservations table. | 23/08/2026 |
| **BUG-04** | 02/09/2026 | Prescription upload rejected PDF files due to incorrect MIME type filter. | Medium | Updated Supabase storage policy and input accept attribute to include `application/pdf`. | 03/09/2026 |

---

# PART IV: DETAILS OF VERSIONS & GIT COMMIT LOG

### 4.1 Tagged Milestones
* **v0.1.0 (Milestone 1 — Sprint 2):** GPS-based nearby pharmacy search, Haversine proximity computation, and town auto-snapping.
* **v0.2.0 (Milestone 2 — Sprint 3):** Online medicine reservation system, pharmacy inventory CRUD, and realtime PostgreSQL order updates.
* **v0.3.0 (Milestone 3 — Sprint 4):** Digital prescription upload, Supabase storage bucket integration, and high-resolution pharmacist inspection modal.
* **v1.0.0 (Release Candidate — Sprint 5):** Complete production-ready release with Docker containerization, Vercel deployment, and KTU LaTeX report.

### 4.2 Comprehensive Git Commit History

```
9203699 Docs: Update README.md with Milestone 3 Digital Prescription Upload features, migration 0004 guide, and roadmap
9774eb8 Milestone 3: Implement Digital Prescription Upload feature, storage migration, and preview modals in patient and pharmacy dashboards
fdb303d Milestone 2 Polish: Implement Pharmacies tab search mode, fetching pharmacies list directly from database, calculating distance, sorting closest first
9ca0c42 Milestone 2 Polish: Wire up non-responsive location_on header button actions to trigger closest town geolocation lookups
7f831bb Milestone 2 Polish: Implement closest town auto-snapping (Valanchery, Perinthalmanna, Kuttippuram, Kottakkal, Malappuram, Tirur) from browser GPS coordinates
ea108bb Milestone 2 Polish: Remove London mock location, default coordinates to Valanchery, Kerala, and add Perinthalmanna mock coordinate option
cd8bccd Milestone 2 Polish: Add custom image_url columns to pharmacies and medicines database and configure dynamic frontend image fallbacks
fa8ea54 Polishing: Remove onwards keyword from copyright year footers
a16c353 Polishing: Update copyright dates to 2026 onwards in all footer layouts
bd27d16 Milestone 2 Polish: Link all Support/Contact Support buttons to a new custom /support Maintenance notice page
8a84402 Refactor: Rename patient references to user across all UI panels and fields
bf410f8 Configure common login, restrict pharmacy signup and update header buttons labels to Login / Sign Up
9ef6ae4 Polishing: Connect '+' button on Pharmacy Detail page to Reservation Modal and add live inventory search
9a0935d Update README.md with Milestone 1 & 2 features, database setup guide, and updated roadmap
5db7730 Milestone 2: Implement Online Medicine Reservation, client-side request forms, patient and pharmacy order panels, and realtime subscriptions
cbf572c Milestone 1: Implement GPS-Based Nearby Pharmacy Search and live location mocks selector
fb16aab Update README.md with official project abstract and revised advanced roadmap
71db4fc Update README.md with current features, tech stack, and next steps roadmap
b00ab1d Add migrations schema sql file to repository
c928c08 Task 4: Wire live data fetching and dynamic stock catalog for pharmacy detail page
5933c3b Task 3: Implement dynamic pharmacy inventory dashboard, modals, POS sync status and Realtime subscriptions
5b4e55b Task 2: Wire live database search and filters on /search
cb955ea Task 1: Wire real Supabase auth for login, sign up, profile roles and path protection
10ccf52 Initialize project structure with Supabase authentication and pharmacy search/dashboard features
3ce9a74 Initial commit
```
