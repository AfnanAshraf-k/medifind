-- Migration to add prescription_url to reservations table and configure storage bucket

ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS prescription_url text null;

-- Create prescriptions storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescriptions bucket
CREATE POLICY "Public Read Prescriptions"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions');

CREATE POLICY "Authenticated Upload Prescriptions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescriptions'
    AND auth.role() = 'authenticated'
  );
