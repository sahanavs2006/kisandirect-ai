create type public.app_role as enum ('farmer', 'mart', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  region text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references auth.users(id) on delete cascade,
  crop text not null,
  variety text,
  quantity_kg numeric not null check (quantity_kg > 0),
  asking_price_per_kg numeric not null check (asking_price_per_kg >= 0),
  region text,
  harvest_date date,
  image_urls text[] not null default '{}',
  ai_quality_grade text,
  ai_quality_score int,
  ai_quality_report jsonb,
  status text not null default 'available',
  buyer_id uuid references auth.users(id),
  sold_price_per_kg numeric,
  sold_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.listings (status, created_at desc);
create index on public.listings (farmer_id);

create table public.audits (
  id uuid primary key default gen_random_uuid(),
  mart_id uuid not null references auth.users(id) on delete cascade,
  crop text not null,
  listing_ids uuid[] not null,
  ranking jsonb not null,
  recommendation text,
  created_at timestamptz not null default now()
);
create index on public.audits (mart_id, created_at desc);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crop text not null,
  region text not null,
  current_price_per_kg numeric,
  weather text,
  forecast jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.predictions (user_id, created_at desc);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  farmer_id uuid not null references auth.users(id) on delete cascade,
  image_url text not null,
  diagnosis jsonb not null,
  created_at timestamptz not null default now()
);
create index on public.scans (farmer_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.listings enable row level security;
alter table public.audits enable row level security;
alter table public.predictions enable row level security;
alter table public.scans enable row level security;

create policy "profiles select all auth"
  on public.profiles for select to authenticated using (true);
create policy "profiles insert self"
  on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles update self"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "user_roles select own"
  on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "user_roles insert self"
  on public.user_roles for insert to authenticated with check (auth.uid() = user_id);

create policy "listings select all auth"
  on public.listings for select to authenticated using (true);
create policy "listings insert own farmer"
  on public.listings for insert to authenticated
  with check (auth.uid() = farmer_id and public.has_role(auth.uid(), 'farmer'));
create policy "listings update farmer or mart"
  on public.listings for update to authenticated
  using (auth.uid() = farmer_id or (public.has_role(auth.uid(), 'mart') and status = 'available'));
create policy "listings delete own"
  on public.listings for delete to authenticated using (auth.uid() = farmer_id);

create policy "audits select own"
  on public.audits for select to authenticated using (auth.uid() = mart_id);
create policy "audits insert own"
  on public.audits for insert to authenticated
  with check (auth.uid() = mart_id and public.has_role(auth.uid(), 'mart'));

create policy "predictions select own"
  on public.predictions for select to authenticated using (auth.uid() = user_id);
create policy "predictions insert own"
  on public.predictions for insert to authenticated with check (auth.uid() = user_id);

create policy "scans select own"
  on public.scans for select to authenticated using (auth.uid() = farmer_id);
create policy "scans insert own"
  on public.scans for insert to authenticated with check (auth.uid() = farmer_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, region)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'region', '')
  );
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'role',''), 'farmer')::public.app_role
  )
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('crops', 'crops', true)
on conflict (id) do nothing;

create policy "crops public read"
  on storage.objects for select using (bucket_id = 'crops');
create policy "crops auth upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'crops' and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "crops owner delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'crops' and (auth.uid())::text = (storage.foldername(name))[1]);