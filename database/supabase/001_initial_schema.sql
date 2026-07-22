-- EZPARK Database Initial Schema Migration
-- Positioning as an AI-Powered Smart Parking Management Platform for organized parking facilities.

-- 1. Create Public Users Table linked to Supabase Auth
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  phone_number text,
  role text default 'user' check (role in ('user', 'operator')),
  created_at timestamp with time zone default now()
);

-- Enable RLS for users
alter table public.users enable row level security;

-- Users policies
create policy "Allow public read access to users profiles" on public.users
  for select using (true);

-- Allow users to update their own profiles
create policy "Allow users to update their own profiles" on public.users
  for update using (auth.uid() = id);

-- 2. Create Parking Facilities Table (renamed from parking_lots)
create table public.parking_facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  latitude double precision,
  longitude double precision,
  total_slots integer default 50,
  available_slots integer default 50,
  price_per_hour numeric(10,2) not null,
  has_ev_charging boolean default false,
  has_cctv boolean default false,
  is_covered boolean default false,
  open_time time default '00:00',
  close_time time default '23:59',
  is_open boolean default true,
  created_at timestamp with time zone default now()
);

alter table public.parking_facilities enable row level security;

create policy "Allow public read access to parking facilities" on public.parking_facilities
  for select using (true);

create policy "Allow operators CRUD operations on parking facilities" on public.parking_facilities
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'operator'
    )
  );

-- 3. Create Parking Slots Table supporting floors, accessibility, and maintenance
create table public.parking_slots (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.parking_facilities(id) on delete cascade not null,
  slot_number text not null,
  floor text default 'L1',
  is_accessible boolean default false,
  type text default 'car' check (type in ('car', 'bike', 'ev')),
  status text default 'available' check (status in ('available', 'occupied', 'reserved', 'maintenance', 'unavailable')),
  created_at timestamp with time zone default now(),
  unique (facility_id, slot_number)
);

alter table public.parking_slots enable row level security;

create policy "Allow public read access to parking slots" on public.parking_slots
  for select using (true);

create policy "Allow operators CRUD operations on parking slots" on public.parking_slots
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'operator'
    )
  );

-- 4. Create Bookings Table
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  facility_id uuid references public.parking_facilities(id) on delete cascade not null,
  slot_id uuid references public.parking_slots(id) on delete cascade not null,
  vehicle_type text not null,
  booking_date date not null,
  entry_time time not null,
  exit_time time not null,
  total_amount numeric(10,2) not null,
  status text default 'Confirmed' check (status in ('Confirmed', 'Cancelled')),
  created_at timestamp with time zone default now()
);

alter table public.bookings enable row level security;

create policy "Allow users to view their own bookings" on public.bookings
  for select using (auth.uid() = user_id);

create policy "Allow users to create their own bookings" on public.bookings
  for insert with check (auth.uid() = user_id);

create policy "Allow users to cancel their own bookings" on public.bookings
  for update using (auth.uid() = user_id);

create policy "Allow operators full access to all bookings" on public.bookings
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'operator'
    )
  );

-- 5. Create Payments Table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade not null,
  amount numeric(10,2) not null,
  status text default 'Paid' check (status in ('Paid', 'Unpaid', 'Refunded')),
  created_at timestamp with time zone default now()
);

alter table public.payments enable row level security;

create policy "Allow users to view their own payments" on public.payments
  for select using (
    exists (
      select 1 from public.bookings
      where bookings.id = payments.booking_id and bookings.user_id = auth.uid()
    )
  );

create policy "Allow operators full access to payments" on public.payments
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'operator'
    )
  );

-- 6. Create Favorites Table
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  facility_id uuid references public.parking_facilities(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique (user_id, facility_id)
);

alter table public.favorites enable row level security;

create policy "Allow users to manage their own favorites" on public.favorites
  for all using (auth.uid() = user_id);

-- 7. Create Notifications Table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  message text not null,
  type text default 'info',
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.notifications enable row level security;

create policy "Allow users to manage their own notifications" on public.notifications
  for all using (auth.uid() = user_id);


-- AUTOMATED TRIGGERS

-- Trigger to sync Auth users signup with public.users table
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, first_name, last_name, phone_number, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone_number', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
