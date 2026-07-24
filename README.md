# MediFind

Medicine Availability Finder — Next.js 14 (App Router) + Tailwind CSS + Supabase.

Pages converted from Stitch designs:
- `/` — Landing page
- `/search` — Medicine search results (list/map toggle)
- `/pharmacy/[id]` — Public pharmacy detail page
- `/pharmacy/dashboard` — Pharmacy owner inventory dashboard
- `/login` — Patient/pharmacy login
- `/dashboard` — Patient dashboard

## Setup

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

Open http://localhost:3000

## Supabase

- `lib/supabase/client.ts` — browser client (use in Client Components)
- `lib/supabase/server.ts` — server client (use in Server Components / Route Handlers)
- `middleware.ts` — refreshes the auth session cookie on every request

## Next steps

1. Create your Supabase project and run a migration for `users`, `pharmacies`,
   `medicines`, and `pharmacy_stock` tables (with Row Level Security policies
   per role: patient / pharmacy / admin).
2. Wire up real auth on `/login` (currently static markup).
3. Replace the placeholder `lh3.googleusercontent.com` images with your own
   assets or Supabase Storage URLs.
4. Connect `/search` and `/pharmacy/[id]` to live Supabase queries.
