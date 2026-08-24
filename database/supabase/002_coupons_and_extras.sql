-- Create Coupons table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type text not null check (type in ('percentage', 'flat')),
  percentage_discount numeric(5,2) default 0,
  flat_discount numeric(10,2) default 0,
  minimum_amount numeric(10,2) default 0,
  maximum_discount numeric(10,2) default 0,
  valid_from timestamp with time zone default now(),
  valid_until timestamp with time zone,
  usage_limit integer default 100,
  current_usage integer default 0,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS for coupons
alter table public.coupons enable row level security;

-- Allow public read access to active coupons
create policy "Allow public read access to active coupons" on public.coupons
  for select using (active = true);

-- Allow operators CRUD operations on coupons
create policy "Allow operators CRUD operations on coupons" on public.coupons
  for all using (
    exists (
      select 1 from public.users
      where users.id = auth.uid() and users.role = 'operator'
    )
  );

-- Insert demo coupons
insert into public.coupons (code, type, percentage_discount, flat_discount, minimum_amount, active)
values 
  ('FIRST20', 'percentage', 20.00, 0, 0, true),
  ('EZ50', 'flat', 0, 50.00, 100.00, true),
  ('STUDENT15', 'percentage', 15.00, 0, 0, true)
on conflict (code) do nothing;
