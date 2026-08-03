-- Create reservations table
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  pharmacy_stock_id uuid references public.pharmacy_stock(id) on delete cascade not null,
  quantity integer not null default 1,
  status text not null default 'pending', -- 'pending' | 'ready' | 'collected' | 'cancelled'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.reservations enable row level security;

-- Policies for reservations
create policy "reservations_select"
  on public.reservations for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.pharmacy_stock ps
      join public.pharmacies p on p.id = ps.pharmacy_id
      where ps.id = pharmacy_stock_id and p.owner_id = auth.uid()
    )
  );

create policy "reservations_insert"
  on public.reservations for insert
  with check (
    auth.uid() = user_id
  );

create policy "reservations_update"
  on public.reservations for update
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.pharmacy_stock ps
      join public.pharmacies p on p.id = ps.pharmacy_id
      where ps.id = pharmacy_stock_id and p.owner_id = auth.uid()
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table reservations;

-- Function to decrement pharmacy stock quantity upon collection
create or replace function public.decrement_stock_on_collection()
returns trigger as $$
begin
  if new.status = 'collected' and old.status != 'collected' then
    update public.pharmacy_stock
    set quantity = greatest(0, quantity - new.quantity)
    where id = new.pharmacy_stock_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for reservations updates
create trigger on_reservation_collected
  after update on public.reservations
  for each row
  execute function public.decrement_stock_on_collection();
