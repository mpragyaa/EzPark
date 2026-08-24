-- User Profiles & Vehicles Database Migration

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone text,
  avatar_url text,
  default_vehicle_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Create Vehicles Table
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  vehicle_name text,
  registration_number text not null,
  manufacturer text,
  color text,
  vehicle_type text check (vehicle_type in ('Car', 'Bike', 'EV', 'SUV')),
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  unique (registration_number)
);

-- Add foreign key from profiles to vehicles for default_vehicle
alter table public.profiles
  add constraint fk_profiles_default_vehicle
  foreign key (default_vehicle_id) references public.vehicles(id) on delete set null;

-- Enable RLS
alter table public.vehicles enable row level security;

-- Policies for vehicles
create policy "Users can view own vehicles" on public.vehicles
  for select using (auth.uid() = user_id);

create policy "Users can insert own vehicles" on public.vehicles
  for insert with check (auth.uid() = user_id);

create policy "Users can update own vehicles" on public.vehicles
  for update using (auth.uid() = user_id);

create policy "Users can delete own vehicles" on public.vehicles
  for delete using (auth.uid() = user_id);

-- 3. Trigger to auto-create profile on new user signup
create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    trim(coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' || coalesce(new.raw_user_meta_data->>'last_name', '')),
    coalesce(new.raw_user_meta_data->>'phone_number', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to sync profiles
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
