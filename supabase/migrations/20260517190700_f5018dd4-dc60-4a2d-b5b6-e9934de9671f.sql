
-- Tables: store rich domain objects as JSONB to preserve full type fidelity.

create table public.players (
  id uuid primary key,
  user_id uuid not null,
  data jsonb not null,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index players_user_idx on public.players(user_id);
alter table public.players enable row level security;

create policy "players_select_own" on public.players for select using (auth.uid() = user_id);
create policy "players_insert_own" on public.players for insert with check (auth.uid() = user_id);
create policy "players_update_own" on public.players for update using (auth.uid() = user_id);
create policy "players_delete_own" on public.players for delete using (auth.uid() = user_id);

create table public.weekend_leagues (
  id uuid primary key,
  user_id uuid not null,
  number integer not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wls_user_idx on public.weekend_leagues(user_id);
alter table public.weekend_leagues enable row level security;

create policy "wls_select_own" on public.weekend_leagues for select using (auth.uid() = user_id);
create policy "wls_insert_own" on public.weekend_leagues for insert with check (auth.uid() = user_id);
create policy "wls_update_own" on public.weekend_leagues for update using (auth.uid() = user_id);
create policy "wls_delete_own" on public.weekend_leagues for delete using (auth.uid() = user_id);

create table public.matches (
  id uuid primary key,
  user_id uuid not null,
  wl_id uuid not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index matches_user_idx on public.matches(user_id);
create index matches_wl_idx on public.matches(wl_id);
alter table public.matches enable row level security;

create policy "matches_select_own" on public.matches for select using (auth.uid() = user_id);
create policy "matches_insert_own" on public.matches for insert with check (auth.uid() = user_id);
create policy "matches_update_own" on public.matches for update using (auth.uid() = user_id);
create policy "matches_delete_own" on public.matches for delete using (auth.uid() = user_id);

create table public.settings (
  user_id uuid primary key,
  club_name text,
  club_crest_path text,
  opponent_name text,
  opponent_crest_path text,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;

create policy "settings_select_own" on public.settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.settings for update using (auth.uid() = user_id);
create policy "settings_delete_own" on public.settings for delete using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_touch before update on public.players
  for each row execute function public.touch_updated_at();
create trigger wls_touch before update on public.weekend_leagues
  for each row execute function public.touch_updated_at();
create trigger matches_touch before update on public.matches
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Storage bucket for player cards + club/opponent crests (public read).
insert into storage.buckets (id, name, public)
values ('crests', 'crests', true)
on conflict (id) do nothing;

-- Anyone (incl. anon) can read; only the owner may write inside their {user_id}/ prefix.
create policy "crests_public_read" on storage.objects
  for select using (bucket_id = 'crests');

create policy "crests_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'crests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "crests_owner_update" on storage.objects
  for update using (
    bucket_id = 'crests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "crests_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'crests'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
