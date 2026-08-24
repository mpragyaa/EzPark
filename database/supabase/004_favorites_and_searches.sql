-- Database Migration: Recent Searches

create table if not exists public.recent_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  location_name text not null,
  latitude double precision,
  longitude double precision,
  searched_at timestamp with time zone default now()
);

alter table public.recent_searches enable row level security;

create policy "Users can view own recent searches" on public.recent_searches
  for select using (auth.uid() = user_id);

create policy "Users can insert own recent searches" on public.recent_searches
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own recent searches" on public.recent_searches
  for delete using (auth.uid() = user_id);
