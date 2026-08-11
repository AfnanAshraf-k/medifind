-- Add image_url columns to pharmacies and medicines tables
alter table public.pharmacies add column image_url text;
alter table public.medicines add column image_url text;
