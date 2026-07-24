-- ============================================================================
-- MediFind — initial schema
-- Roles: 'user' (patient/consumer), 'pharmacy' (pharmacy staff/owner), 'admin'
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Profiles (extends Supabase auth.users with a role + display info)
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('user', 'pharmacy', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Pharmacies
-- ---------------------------------------------------------------------------
create table public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  address text not null,
  lat double precision,
  lng double precision,
  phone text,
  hours jsonb,
  rating numeric(2,1) default 0,
  review_count integer default 0,
  is_open boolean default true,
  created_at timestamptz not null default now()
);

create index pharmacies_owner_idx on public.pharmacies(owner_id);
create index pharmacies_location_idx on public.pharmacies(lat, lng);

-- ---------------------------------------------------------------------------
-- 3. Medicines (shared catalog)
-- ---------------------------------------------------------------------------
create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  category text,
  created_at timestamptz not null default now()
);

create index medicines_name_idx on public.medicines using gin (to_tsvector('english', name));

-- ---------------------------------------------------------------------------
-- 4. Pharmacy stock (per-pharmacy medicine inventory)
-- ---------------------------------------------------------------------------
create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock');

create table public.pharmacy_stock (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  quantity integer not null default 0,
  price numeric(10,2),
  status public.stock_status not null default 'out_of_stock',
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, medicine_id)
);

create index stock_pharmacy_idx on public.pharmacy_stock(pharmacy_id);
create index stock_medicine_idx on public.pharmacy_stock(medicine_id);
create index stock_status_idx on public.pharmacy_stock(status);

-- Keep status in sync with quantity automatically
create function public.sync_stock_status()
returns trigger as $$
begin
  if new.quantity <= 0 then
    new.status := 'out_of_stock';
  elsif new.quantity <= 10 then
    new.status := 'low_stock';
  else
    new.status := 'in_stock';
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_sync_stock_status
  before insert or update on public.pharmacy_stock
  for each row execute procedure public.sync_stock_status();

-- ---------------------------------------------------------------------------
-- 5. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.medicines enable row level security;
alter table public.pharmacy_stock enable row level security;

create function public.current_role()
returns public.app_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "pharmacies_select_all"
  on public.pharmacies for select
  using (true);

create policy "pharmacies_insert_owner"
  on public.pharmacies for insert
  with check (owner_id = auth.uid() and public.current_role() in ('pharmacy', 'admin'));

create policy "pharmacies_update_owner_or_admin"
  on public.pharmacies for update
  using (owner_id = auth.uid() or public.current_role() = 'admin');

create policy "pharmacies_delete_admin"
  on public.pharmacies for delete
  using (public.current_role() = 'admin');

create policy "medicines_select_all"
  on public.medicines for select
  using (true);

create policy "medicines_write_pharmacy_or_admin"
  on public.medicines for insert
  with check (public.current_role() in ('pharmacy', 'admin'));

create policy "medicines_update_pharmacy_or_admin"
  on public.medicines for update
  using (public.current_role() in ('pharmacy', 'admin'));

create policy "stock_select_all"
  on public.pharmacy_stock for select
  using (true);

create policy "stock_write_owner_or_admin"
  on public.pharmacy_stock for insert
  with check (
    public.current_role() = 'admin'
    or exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id and p.owner_id = auth.uid()
    )
  );

create policy "stock_update_owner_or_admin"
  on public.pharmacy_stock for update
  using (
    public.current_role() = 'admin'
    or exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id and p.owner_id = auth.uid()
    )
  );

create policy "stock_delete_owner_or_admin"
  on public.pharmacy_stock for delete
  using (
    public.current_role() = 'admin'
    or exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id and p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 6. Realtime (so /search and /pharmacy/dashboard can subscribe to live stock)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.pharmacy_stock;