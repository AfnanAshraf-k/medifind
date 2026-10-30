-- ============================================================================
-- Migration 0006: Dynamic Towns Catalog & Pharmacy Municipal Location Link
-- ============================================================================

-- 1. Create Towns table as the single source of truth for municipalities
CREATE TABLE IF NOT EXISTS public.towns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  district text NOT NULL DEFAULT 'Malappuram',
  state text NOT NULL DEFAULT 'Kerala',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_towns_name ON public.towns(name);
CREATE INDEX IF NOT EXISTS idx_towns_district ON public.towns(district);
CREATE INDEX IF NOT EXISTS idx_towns_location ON public.towns(lat, lng);

-- 2. Populate canonical Kerala municipal hubs (Malappuram district healthcare clusters)
INSERT INTO public.towns (name, district, state, lat, lng)
VALUES
  ('Valanchery', 'Malappuram', 'Kerala', 10.8878, 76.0732),
  ('Perinthalmanna', 'Malappuram', 'Kerala', 10.9765, 76.2269),
  ('Kuttippuram', 'Malappuram', 'Kerala', 10.8407, 76.0331),
  ('Kottakkal', 'Malappuram', 'Kerala', 10.9992, 75.9926),
  ('Malappuram', 'Malappuram', 'Kerala', 11.0735, 76.0740),
  ('Tirur', 'Malappuram', 'Kerala', 10.9027, 75.9238),
  ('Manjeri', 'Malappuram', 'Kerala', 11.1215, 76.1210),
  ('Ponnani', 'Malappuram', 'Kerala', 10.7766, 75.9264)
ON CONFLICT (name) DO UPDATE
SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, district = EXCLUDED.district;

-- 3. Enable RLS on towns (public read)
ALTER TABLE public.towns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "towns_select_all" ON public.towns;
CREATE POLICY "towns_select_all"
  ON public.towns FOR SELECT
  USING (true);

-- 4. Extend pharmacies table with town_id reference and town_name
ALTER TABLE public.pharmacies
ADD COLUMN IF NOT EXISTS town_id uuid REFERENCES public.towns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS town_name text;

CREATE INDEX IF NOT EXISTS idx_pharmacies_town_id ON public.pharmacies(town_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_town_name ON public.pharmacies(town_name);

-- 5. Backfill existing pharmacies with town_id and fill in missing coordinates
-- Example: link 'V Care' in Valanchery
UPDATE public.pharmacies p
SET
  town_id = t.id,
  town_name = t.name,
  lat = COALESCE(p.lat, t.lat),
  lng = COALESCE(p.lng, t.lng)
FROM public.towns t
WHERE LOWER(p.address) LIKE '%' || LOWER(t.name) || '%'
  AND (p.town_id IS NULL OR p.lat IS NULL);

-- Specifically ensure Perinthalmanna coordinates for skpharmacy if null
UPDATE public.pharmacies p
SET
  town_id = t.id,
  town_name = t.name,
  lat = COALESCE(p.lat, t.lat),
  lng = COALESCE(p.lng, t.lng)
FROM public.towns t
WHERE t.name = 'Perinthalmanna'
  AND LOWER(p.address) LIKE '%perinthalmanna%'
  AND p.lat IS NULL;

