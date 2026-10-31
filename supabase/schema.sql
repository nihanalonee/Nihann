-- ============================================================================
-- OmniLife: The Syndicate — Supabase schema
-- ----------------------------------------------------------------------------
-- The browser simulation is local-first. This schema is the optional shared
-- layer: durable player profiles, world entities, the public Wire feed, and
-- on-chain style AMM liquidity pools.
--
-- Apply with the Supabase SQL editor or:
--   supabase db push
--
-- The app only needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- Social posts require an authenticated session because inserts are bound to
-- auth.uid(). Every other table is publicly readable and owner-writable.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Profiles (one row per auth user)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default 'Operator',
  handle text not null default '@operator',
  avatar_hue integer not null default 174 check (avatar_hue between 0 and 360),
  influence integer not null default 0 check (influence between 0 and 100),
  reputation integer not null default 50 check (reputation between 0 and 100),
  heat integer not null default 0 check (heat between 0 and 100),
  god_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create a profile automatically for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, handle)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Operator'
    ),
    '@' || coalesce(
      nullif(regexp_replace(split_part(coalesce(new.email, 'operator'), '@', 1), '[^a-zA-Z0-9]', '', 'g'), ''),
      'operator'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- World entities
-- ----------------------------------------------------------------------------
create table if not exists public.corporations (
  id text primary key,
  name text not null,
  ticker text not null unique,
  sector text not null,
  owner_id text not null default 'npc',
  owner_name text not null default 'Unknown',
  share_price numeric(18, 6) not null default 1 check (share_price >= 0),
  fair_value numeric(18, 6) not null default 1 check (fair_value >= 0),
  shares_outstanding numeric(24, 4) not null default 0 check (shares_outstanding >= 0),
  player_shares numeric(24, 4) not null default 0 check (player_shares >= 0),
  revenue numeric(20, 2) not null default 0,
  growth numeric(8, 3) not null default 0,
  volatility numeric(8, 5) not null default 0.03,
  description text not null default '',
  hue integer not null default 174 check (hue between 0 and 360),
  raided boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists corporations_set_updated_at on public.corporations;
create trigger corporations_set_updated_at
before update on public.corporations
for each row execute function public.set_updated_at();

create table if not exists public.banks (
  id text primary key,
  name text not null,
  owner_id text not null default 'npc',
  owner_name text not null default 'Unknown',
  reserves numeric(24, 2) not null default 0 check (reserves >= 0),
  deposits numeric(24, 2) not null default 0 check (deposits >= 0),
  loans numeric(24, 2) not null default 0 check (loans >= 0),
  rate numeric(6, 3) not null default 5 check (rate between 0 and 100),
  status text not null default 'stable' check (status in ('stable', 'watch', 'critical', 'collapsed')),
  hue integer not null default 196 check (hue between 0 and 360),
  player_owned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists banks_set_updated_at on public.banks;
create trigger banks_set_updated_at
before update on public.banks
for each row execute function public.set_updated_at();

create table if not exists public.tokens (
  id text primary key,
  symbol text not null unique,
  name text not null,
  price numeric(24, 10) not null default 0 check (price >= 0),
  fair_value numeric(24, 10) not null default 0 check (fair_value >= 0),
  liquidity numeric(24, 2) not null default 0 check (liquidity >= 0),
  supply numeric(28, 4) not null default 0 check (supply >= 0),
  creator text not null default 'Protocol',
  creator_id text not null default 'protocol',
  creator_type text not null default 'protocol' check (creator_type in ('player', 'npc', 'protocol', 'syndicate')),
  volatility numeric(8, 5) not null default 0.1,
  momentum numeric(8, 5) not null default 0,
  volume_24h numeric(24, 2) not null default 0,
  holders bigint not null default 0 check (holders >= 0),
  staked numeric(28, 4) not null default 0 check (staked >= 0),
  apr numeric(8, 3) not null default 0,
  rugged boolean not null default false,
  hue integer not null default 286 check (hue between 0 and 360),
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tokens_set_updated_at on public.tokens;
create trigger tokens_set_updated_at
before update on public.tokens
for each row execute function public.set_updated_at();

create table if not exists public.isp_networks (
  id text primary key,
  name text not null,
  owner_id text not null default 'npc',
  owner_name text not null default 'Unknown',
  capacity numeric(10, 3) not null default 0 check (capacity >= 0),
  load numeric(6, 4) not null default 0 check (load >= 0),
  latency numeric(10, 3) not null default 0 check (latency >= 0),
  uptime numeric(6, 3) not null default 100 check (uptime between 0 and 100),
  nodes integer not null default 0 check (nodes >= 0),
  data_centers integer not null default 0 check (data_centers >= 0),
  price_per_tbps numeric(12, 2) not null default 0 check (price_per_tbps >= 0),
  revenue numeric(20, 2) not null default 0,
  security integer not null default 50 check (security between 0 and 100),
  hue integer not null default 174 check (hue between 0 and 360),
  player_owned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists isp_networks_set_updated_at on public.isp_networks;
create trigger isp_networks_set_updated_at
before update on public.isp_networks
for each row execute function public.set_updated_at();

create table if not exists public.media_stations (
  id text primary key,
  name text not null,
  owner_id text not null default 'npc',
  owner_name text not null default 'Unknown',
  reach numeric(12, 4) not null default 0 check (reach >= 0),
  credibility integer not null default 50 check (credibility between 0 and 100),
  sentiment integer not null default 50 check (sentiment between 0 and 100),
  revenue numeric(20, 2) not null default 0,
  shows integer not null default 0 check (shows >= 0),
  type text not null default 'Streaming' check (type in ('TV', 'Streaming', 'News', 'Underground')),
  hue integer not null default 302 check (hue between 0 and 360),
  headlines text[] not null default '{}',
  player_owned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists media_stations_set_updated_at on public.media_stations;
create trigger media_stations_set_updated_at
before update on public.media_stations
for each row execute function public.set_updated_at();

create table if not exists public.crime_syndicates (
  id text primary key,
  name text not null,
  leader text not null default 'Unknown',
  heat integer not null default 0 check (heat between 0 and 100),
  influence integer not null default 0 check (influence between 0 and 100),
  operations integer not null default 0 check (operations >= 0),
  cash numeric(24, 2) not null default 0,
  specialty text not null default '',
  hue integer not null default 338 check (hue between 0 and 360),
  player_owned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists crime_syndicates_set_updated_at on public.crime_syndicates;
create trigger crime_syndicates_set_updated_at
before update on public.crime_syndicates
for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- The Wire (server-wide social feed)
-- ----------------------------------------------------------------------------
create table if not exists public.social_posts (
  id text primary key,
  author_id uuid references auth.users (id) on delete set null,
  author text not null,
  handle text not null,
  avatar_hue integer not null default 174 check (avatar_hue between 0 and 360),
  content text not null check (char_length(content) between 1 and 420),
  sentiment integer not null default 0 check (sentiment between -100 and 100),
  likes integer not null default 0 check (likes >= 0),
  replies integer not null default 0 check (replies >= 0),
  day integer not null default 1 check (day >= 1),
  hour integer not null default 0 check (hour between 0 and 23),
  tags text[] not null default '{}',
  verified boolean not null default false,
  source text not null default 'player' check (source in ('player', 'npc', 'system', 'grok')),
  kind text not null default 'social' check (kind in ('market', 'scandal', 'news', 'social', 'crime', 'media')),
  created_at timestamptz not null default now()
);

create index if not exists social_posts_created_at_idx on public.social_posts (created_at desc);
create index if not exists social_posts_author_id_idx on public.social_posts (author_id);
create index if not exists social_posts_tags_idx on public.social_posts using gin (tags);

-- ----------------------------------------------------------------------------
-- AMM liquidity pools
-- ----------------------------------------------------------------------------
create table if not exists public.liquidity_pools (
  token_id text primary key references public.tokens (id) on delete cascade,
  base_reserve numeric(28, 8) not null default 0 check (base_reserve > 0),
  quote_reserve numeric(28, 8) not null default 0 check (quote_reserve > 0),
  fee_bps integer not null default 30 check (fee_bps between 0 and 1000),
  total_lp_shares numeric(28, 8) not null default 0 check (total_lp_shares >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists liquidity_pools_set_updated_at on public.liquidity_pools;
create trigger liquidity_pools_set_updated_at
before update on public.liquidity_pools
for each row execute function public.set_updated_at();

-- Constant-product swap. p_direction is 'buy' (quote in, token out) or
-- 'sell' (token in, quote out). Returns the output amount. The pool row is
-- locked so concurrent swaps cannot double-spend reserves.
create or replace function public.amm_swap(
  p_token_id text,
  p_amount_in numeric,
  p_direction text
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  pool public.liquidity_pools%rowtype;
  fee_multiplier numeric;
  amount_after_fee numeric;
  amount_out numeric;
  new_base numeric;
  new_quote numeric;
  invariant numeric;
begin
  if p_amount_in is null or p_amount_in <= 0 then
    raise exception 'amount_in must be positive';
  end if;
  if p_direction not in ('buy', 'sell') then
    raise exception 'direction must be buy or sell';
  end if;

  select * into pool
  from public.liquidity_pools
  where token_id = p_token_id
  for update;

  if not found then
    raise exception 'pool not found: %', p_token_id;
  end if;

  invariant := pool.base_reserve * pool.quote_reserve;
  fee_multiplier := 1 - (pool.fee_bps::numeric / 10000);

  if p_direction = 'buy' then
    amount_after_fee := p_amount_in * fee_multiplier;
    new_quote := pool.quote_reserve + amount_after_fee;
    new_base := invariant / new_quote;
    amount_out := pool.base_reserve - new_base;
    update public.liquidity_pools
    set base_reserve = new_base,
        quote_reserve = new_quote
    where token_id = p_token_id;
  else
    amount_after_fee := p_amount_in * fee_multiplier;
    new_base := pool.base_reserve + amount_after_fee;
    new_quote := invariant / new_base;
    amount_out := pool.quote_reserve - new_quote;
    update public.liquidity_pools
    set base_reserve = new_base,
        quote_reserve = new_quote
    where token_id = p_token_id;
  end if;

  return amount_out;
end;
$$;

revoke all on function public.amm_swap(text, numeric, text) from public;
grant execute on function public.amm_swap(text, numeric, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.corporations enable row level security;
alter table public.banks enable row level security;
alter table public.tokens enable row level security;
alter table public.isp_networks enable row level security;
alter table public.media_stations enable row level security;
alter table public.crime_syndicates enable row level security;
alter table public.social_posts enable row level security;
alter table public.liquidity_pools enable row level security;

-- Profiles: public read, self write.
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- World entities: public read, authenticated writes.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'corporations', 'banks', 'tokens', 'isp_networks',
    'media_stations', 'crime_syndicates', 'liquidity_pools'
  ] loop
    execute format('drop policy if exists "%s are publicly readable" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s are publicly readable" on public.%I for select using (true)',
      table_name, table_name
    );
    execute format('drop policy if exists "%s are writable by authenticated" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s are writable by authenticated" on public.%I for all to authenticated using (true) with check (true)',
      table_name, table_name
    );
  end loop;
end;
$$;

-- The Wire: public read, authenticated author-bound insert/update/delete.
drop policy if exists "wire posts are publicly readable" on public.social_posts;
create policy "wire posts are publicly readable"
  on public.social_posts for select
  using (true);

drop policy if exists "users publish their own wire posts" on public.social_posts;
create policy "users publish their own wire posts"
  on public.social_posts for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "users update their own wire posts" on public.social_posts;
create policy "users update their own wire posts"
  on public.social_posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "users delete their own wire posts" on public.social_posts;
create policy "users delete their own wire posts"
  on public.social_posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- ----------------------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'social_posts'
  ) then
    execute 'alter publication supabase_realtime add table public.social_posts';
  end if;
end;
$$;

-- Broadcast full rows so the browser can render immediately without a refetch.
alter table public.social_posts replica identity full;

-- ----------------------------------------------------------------------------
-- Seed the canonical world entities (safe to re-run)
-- ----------------------------------------------------------------------------
insert into public.tokens (id, symbol, name, price, fair_value, liquidity, supply, creator, creator_id, creator_type, volatility, momentum, volume_24h, holders, staked, apr, hue, description)
values
  ('omni', 'OMNI', 'OmniCredit', 142.30, 148.00, 8420000, 1000000, 'OmniLife Reserve', 'protocol', 'protocol', 0.035, 0.012, 4820000, 184200, 182400, 8.4, 174, 'The reserve currency of the OmniLife mesh.'),
  ('neon', 'NEON', 'NeonCoin', 0.0842, 0.071, 1240000, 420000000, 'Kaito Mercer', 'npc_kaito', 'npc', 0.11, 0.028, 1910000, 92400, 41800000, 28.5, 286, 'A memetic attention asset engineered by Kaito Mercer.'),
  ('void', 'VOID', 'VoidCash', 2.41, 2.95, 640000, 24000000, 'Black Meridian', 'syn_black', 'syndicate', 0.145, -0.018, 780000, 18900, 2400000, 36.2, 338, 'Privacy rail for the underworld.'),
  ('helios', 'HELIOS', 'Helios Compute', 18.72, 16.10, 3120000, 38000000, 'Astra Capital', 'npc_imani', 'npc', 0.052, 0.021, 2460000, 63100, 9800000, 11.8, 42, 'Tokenized GPU capacity.'),
  ('ghost', 'GHOST', 'GhostNet', 0.421, 0.33, 410000, 90000000, 'Zero Day Collective', 'syn_lattice', 'syndicate', 0.19, 0.041, 1180000, 27600, 6100000, 41.5, 122, 'Dark-pool bandwidth credits.'),
  ('luna', 'LUNA', 'Lunar Yield', 7.15, 7.60, 1820000, 12000000, 'Meridian Trust', 'bank_meridian', 'npc', 0.068, -0.006, 920000, 44200, 3300000, 16.4, 210, 'A yield-bearing bank token.')
on conflict (id) do nothing;

insert into public.corporations (id, name, ticker, sector, owner_id, owner_name, share_price, fair_value, shares_outstanding, revenue, growth, volatility, description, hue)
values
  ('corp_rex', 'RexNet Telecom', 'REX', 'Telecom', 'npc_rex', 'Rex Calloway', 128.40, 122.00, 40000000, 1840000000, 8.4, 0.031, 'The incumbent backbone monopoly.', 42),
  ('corp_vox', 'Vox Meridian Media', 'VOX', 'Media', 'npc_vesper', 'Vesper Kane', 64.20, 68.00, 18000000, 640000000, 3.1, 0.046, 'An attention machine with a credibility problem.', 302),
  ('corp_helios', 'Helios Compute', 'HLC', 'AI Infrastructure', 'npc_imani', 'Dr. Imani Rao', 212.50, 198.00, 9000000, 1120000000, 24.6, 0.058, 'Compute-as-a-service for the AI supercycle.', 164),
  ('corp_blackvault', 'Black Vault Financial', 'BVF', 'Banking', 'syn_black', 'Nyx', 18.40, 27.00, 22000000, 380000000, -4.8, 0.092, 'A listed shell wrapped around an unlisted loan book.', 338),
  ('corp_lumen', 'Lumen Fiber', 'LUM', 'Telecom', 'npc_imani', 'Dr. Imani Rao', 156.80, 151.00, 12000000, 720000000, 14.2, 0.037, 'Low-latency fiber for the compute class.', 196),
  ('corp_neon', 'Neon Labs', 'NLAB', 'Crypto', 'npc_kaito', 'Kaito Mercer', 44.90, 36.00, 16000000, 210000000, 31.8, 0.088, 'The listed vehicle behind the NEON narrative.', 286),
  ('corp_ledger', 'Ledger Holdings', 'LEDG', 'Media', 'npc_ada', 'Ada Voss', 91.30, 96.00, 7000000, 190000000, 6.7, 0.034, 'Investigative journalism with a balance sheet.', 218)
on conflict (id) do nothing;

insert into public.banks (id, name, owner_id, owner_name, reserves, deposits, loans, rate, status, hue)
values
  ('meridian', 'Meridian Trust', 'npc_dmitri', 'Dmitri Volkov', 420000000, 2840000000, 2310000000, 4.8, 'stable', 196),
  ('helios', 'Helios Mutual', 'npc_imani', 'Dr. Imani Rao', 184000000, 1140000000, 862000000, 3.9, 'stable', 164),
  ('blackvault', 'Black Vault', 'syn_black', 'Nyx', 64000000, 782000000, 728000000, 7.4, 'critical', 338),
  ('sovereign', 'Sovereign Depository', 'gov', 'City of OmniLife', 910000000, 4600000000, 3120000000, 2.6, 'stable', 218)
on conflict (id) do nothing;

insert into public.isp_networks (id, name, owner_id, owner_name, capacity, load, latency, uptime, nodes, data_centers, price_per_tbps, revenue, security, hue, player_owned)
values
  ('aether', 'AetherLink', 'player', 'Nihann Holdings', 18, 0.62, 14, 99.97, 8, 4, 1240, 42800, 72, 174, true),
  ('rexnet', 'RexNet', 'npc_rex', 'Rex Calloway', 42, 0.71, 22, 99.82, 21, 9, 1080, 284000, 64, 42, false),
  ('ghostline', 'GhostLine', 'syn_black', 'Black Meridian', 9, 0.83, 41, 98.4, 5, 2, 1620, 26000, 38, 338, false),
  ('lumen', 'Lumen Fiber', 'npc_imani', 'Dr. Imani Rao', 27, 0.49, 9, 99.99, 14, 7, 1460, 198000, 86, 164, false)
on conflict (id) do nothing;

insert into public.media_stations (id, name, owner_id, owner_name, reach, credibility, sentiment, revenue, shows, type, hue, headlines, player_owned)
values
  ('signal9', 'Signal 9', 'player', 'Nihann Holdings', 2.1, 71, 58, 18400, 2, 'Streaming', 174, array['The quiet war for the city’s backbone', 'Who is buying the Narrows?'], true),
  ('vox', 'Vox Meridian', 'npc_vesper', 'Vesper Kane', 18.4, 44, 63, 210000, 11, 'TV', 302, array['Mercer denies market manipulation — again'], false),
  ('ledger', 'The Ledger', 'npc_ada', 'Ada Voss', 5.2, 88, 51, 74000, 4, 'News', 218, array['Black Vault leverage crosses dangerous threshold'], false),
  ('neonpulse', 'NeonPulse', 'npc_kaito', 'Kaito Mercer', 9.8, 62, 67, 122000, 8, 'Streaming', 286, array['NEON to the moon? The case for irrational exuberance'], false),
  ('blacklight', 'Blacklight TV', 'syn_black', 'Black Meridian', 1.2, 21, 38, 9800, 3, 'Underground', 338, array['The port manifest they don’t want you to read'], false)
on conflict (id) do nothing;

insert into public.crime_syndicates (id, name, leader, heat, influence, operations, cash, specialty, hue, player_owned)
values
  ('nihann', 'Nihann Syndicate', 'Miraj', 24, 42, 3, 350000, 'Financial engineering', 174, true),
  ('black', 'Black Meridian', 'Nyx', 72, 88, 14, 420000000, 'Cyber extortion', 338, false),
  ('lattice', 'Red Lattice', 'The Archivist', 58, 61, 9, 96000000, 'Data brokerage', 12, false),
  ('nine', 'The 9th Circle', 'Mother Sable', 41, 55, 7, 62000000, 'Smuggling', 42, false)
on conflict (id) do nothing;

insert into public.liquidity_pools (token_id, base_reserve, quote_reserve, fee_bps, total_lp_shares)
values
  ('omni', 1000000, 142300000, 30, 1000000),
  ('neon', 420000000, 35364000, 30, 420000000),
  ('void', 24000000, 57840000, 30, 24000000),
  ('helios', 38000000, 711360000, 30, 38000000),
  ('ghost', 90000000, 37890000, 30, 90000000),
  ('luna', 12000000, 85800000, 30, 12000000)
on conflict (token_id) do nothing;
