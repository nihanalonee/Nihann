-- ═══════════════════════════════════════════════════════════════════════════
-- OMNILIFE: THE SYNDICATE — Supabase schema
-- Postgres 15+ / Supabase. Run this file in the SQL editor on a fresh project.
--
-- Design rules
--   1. The client never writes money, reserves, prices, or holdings directly.
--      All economic mutations go through SECURITY DEFINER RPCs or the server.
--   2. Public world state is readable. Private balance sheets are not.
--   3. The God Mode role is set only by the service role, never by email.
--   4. Realtime is enabled only for tables the client actually renders.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── Enums ──────────────────────────────────────────────────────────────────
do $$ begin
  create type player_archetype as enum ('tycoon', 'banker', 'hacker', 'mogul');
  create type player_role as enum ('player', 'admin');
  create type district_kind as enum ('financial', 'tech', 'entertainment', 'industrial', 'residential', 'logistics', 'government', 'slums');
  create type isp_kind as enum ('edge', 'fiber', 'datacenter');
  create type media_kind as enum ('tv', 'streaming', 'news');
  create type bank_status as enum ('stable', 'strained', 'insolvent');
  create type event_category as enum ('market', 'policy', 'crime', 'media', 'infrastructure', 'ai');
  create type event_severity as enum ('minor', 'major', 'critical', 'black-swan');
  create type law_status as enum ('active', 'proposed', 'vetoed');
  create type tx_kind as enum ('token_buy', 'token_sell', 'stock_buy', 'stock_sell', 'property_buy', 'property_sell', 'rent', 'isp_revenue', 'media_revenue', 'loan_draw', 'loan_payment', 'bribe', 'hack', 'smuggle', 'launder', 'heist', 'tax', 'admin');
  create type loan_status as enum ('active', 'repaid', 'defaulted');
exception when duplicate_object then null; end $$;

-- ── World singleton ────────────────────────────────────────────────────────
create table if not exists public.world_state (
  id integer primary key default 1 check (id = 1),
  day integer not null default 1 check (day >= 1),
  economy numeric(6,2) not null default 50 check (economy between 0 and 100),
  treasury numeric(20,2) not null default 0,
  tax_rate numeric(5,2) not null default 2.4,
  corporate_tax numeric(5,2) not null default 18,
  regulation numeric(5,2) not null default 46 check (regulation between 0 and 100),
  approval numeric(5,2) not null default 41 check (approval between 0 and 100),
  next_election integer not null default 48,
  paused boolean not null default false,
  tick_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.world_state (id) values (1) on conflict (id) do nothing;

-- ── Players ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null check (handle ~ '^[a-z0-9_]{2,20}$'),
  display_name text not null check (char_length(display_name) between 2 and 28),
  archetype player_archetype not null default 'tycoon',
  role player_role not null default 'player',
  cash numeric(20,2) not null default 2400000 check (cash >= 0),
  influence numeric(6,2) not null default 28 check (influence between 0 and 100),
  reputation numeric(6,2) not null default 54 check (reputation between 0 and 100),
  heat numeric(6,2) not null default 4 check (heat between 0 and 100),
  day integer not null default 1,
  perks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_handle_lower_idx on public.profiles (lower(handle));
create index if not exists profiles_role_idx on public.profiles (role);

-- ── Corporations & equities ────────────────────────────────────────────────
create table if not exists public.corporations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  npc_owner text,
  name text not null,
  ticker text not null check (ticker ~ '^[A-Z]{2,6}$'),
  sector text not null,
  share_price numeric(14,4) not null default 100 check (share_price > 0),
  shares_outstanding bigint not null default 10000000 check (shares_outstanding > 0),
  sentiment numeric(6,2) not null default 50 check (sentiment between 0 and 100),
  revenue numeric(20,2) not null default 0,
  description text not null default '',
  color text not null default '#c9ff4d',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ticker)
);

create table if not exists public.corporation_holdings (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  corporation_id uuid not null references public.corporations (id) on delete cascade,
  shares numeric(20,6) not null default 0 check (shares >= 0),
  updated_at timestamptz not null default now(),
  primary key (profile_id, corporation_id)
);

-- ── Tokens, AMM pools & staking ────────────────────────────────────────────
create table if not exists public.tokens (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles (id) on delete set null,
  creator_name text not null default 'Protocol',
  name text not null check (char_length(name) between 2 and 28),
  symbol text not null check (symbol ~ '^[A-Z0-9]{2,6}$'),
  -- Constant product reserves: price = credits / supply.
  credits numeric(24,6) not null check (credits > 0),
  supply numeric(24,6) not null check (supply > 0),
  liquidity numeric(24,6) not null check (liquidity >= 0),
  volume numeric(24,6) not null default 0,
  price numeric(24,10) generated always as (credits / supply) stored,
  change_24h numeric(10,4) not null default 0,
  holders integer not null default 1 check (holders >= 0),
  risk numeric(5,2) not null default 18 check (risk between 0 and 100),
  rugged boolean not null default false,
  color text not null default '#c9ff4d',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (symbol)
);

create index if not exists tokens_liquidity_idx on public.tokens (liquidity desc);
create index if not exists tokens_created_idx on public.tokens (created_at desc);

create table if not exists public.token_holdings (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  token_id uuid not null references public.tokens (id) on delete cascade,
  amount numeric(24,8) not null default 0 check (amount >= 0),
  staked numeric(24,8) not null default 0 check (staked >= 0),
  updated_at timestamptz not null default now(),
  primary key (profile_id, token_id)
);

create table if not exists public.token_price_history (
  token_id uuid not null references public.tokens (id) on delete cascade,
  day integer not null,
  price numeric(24,10) not null,
  primary key (token_id, day)
);

-- ── Districts / real estate ────────────────────────────────────────────────
create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind district_kind not null,
  price numeric(20,2) not null check (price > 0),
  base_price numeric(20,2) not null check (base_price > 0),
  rent_per_day numeric(20,2) not null default 0,
  crime numeric(5,2) not null default 20 check (crime between 0 and 100),
  police numeric(5,2) not null default 40 check (police between 0 and 100),
  demand numeric(5,2) not null default 50 check (demand between 0 and 100),
  owner_id uuid references public.profiles (id) on delete set null,
  owner_name text,
  color text not null default '#c9ff4d',
  description text not null default '',
  updated_at timestamptz not null default now(),
  unique (name)
);

create table if not exists public.district_price_history (
  district_id uuid not null references public.districts (id) on delete cascade,
  day integer not null,
  price numeric(20,2) not null,
  primary key (district_id, day)
);

-- ── Internet infrastructure ────────────────────────────────────────────────
create table if not exists public.isp_nodes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  owner_name text,
  name text not null,
  kind isp_kind not null,
  capacity integer not null check (capacity > 0),
  load integer not null default 0 check (load >= 0),
  uptime numeric(5,2) not null default 99.9 check (uptime between 0 and 100),
  latency integer not null default 20 check (latency > 0),
  revenue_per_day numeric(20,2) not null default 0,
  upkeep numeric(20,2) not null default 0,
  status text not null default 'online' check (status in ('online', 'degraded', 'offline')),
  built_day integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists isp_owner_idx on public.isp_nodes (owner_id);

create table if not exists public.isp_traffic (
  node_id uuid not null references public.isp_nodes (id) on delete cascade,
  day integer not null,
  gbps numeric(12,2) not null,
  uptime numeric(5,2) not null,
  revenue numeric(20,2) not null,
  primary key (node_id, day)
);

-- ── Media ──────────────────────────────────────────────────────────────────
create table if not exists public.media_outlets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  owner_name text,
  name text not null,
  kind media_kind not null,
  reach numeric(6,2) not null default 20 check (reach between 0 and 100),
  credibility numeric(6,2) not null default 55 check (credibility between 0 and 100),
  hype numeric(6,2) not null default 40 check (hype between 0 and 100),
  revenue_per_day numeric(20,2) not null default 0,
  upkeep numeric(20,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists media_owner_idx on public.media_outlets (owner_id);

create table if not exists public.shows (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.media_outlets (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 42),
  quality integer not null check (quality between 0 and 100),
  audience bigint not null default 0,
  revenue numeric(20,2) not null default 0,
  produced_day integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.media_campaigns (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.media_outlets (id) on delete cascade,
  target_type text not null check (target_type in ('token', 'corporation')),
  target_id uuid not null,
  mode text not null check (mode in ('hype', 'expose')),
  cost numeric(20,2) not null,
  swing numeric(10,4) not null default 0,
  day integer not null,
  created_at timestamptz not null default now()
);

-- ── Banking ────────────────────────────────────────────────────────────────
create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  owner_name text,
  name text not null,
  reserves numeric(24,2) not null default 0 check (reserves >= 0),
  deposits numeric(24,2) not null default 0 check (deposits >= 0),
  loans numeric(24,2) not null default 0 check (loans >= 0),
  rate numeric(5,2) not null default 6.4 check (rate between 0 and 30),
  reputation numeric(6,2) not null default 55 check (reputation between 0 and 100),
  status bank_status not null default 'stable',
  founded_day integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists banks_owner_idx on public.banks (owner_id);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid not null references public.profiles (id) on delete cascade,
  bank_id uuid not null references public.banks (id) on delete restrict,
  principal numeric(20,2) not null check (principal > 0),
  outstanding numeric(20,2) not null check (outstanding >= 0),
  rate numeric(5,2) not null,
  daily_payment numeric(20,2) not null default 0,
  status loan_status not null default 'active',
  taken_day integer not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists loans_borrower_idx on public.loans (borrower_id) where status = 'active';

create table if not exists public.bank_ledger (
  id bigserial primary key,
  bank_id uuid not null references public.banks (id) on delete cascade,
  kind text not null,
  amount numeric(20,2) not null,
  day integer not null,
  created_at timestamptz not null default now()
);

-- ── Criminal world ─────────────────────────────────────────────────────────
create table if not exists public.syndicates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  boss text not null,
  specialty text not null,
  power numeric(6,2) not null default 50 check (power between 0 and 100),
  wealth numeric(24,2) not null default 0,
  heat numeric(6,2) not null default 0 check (heat between 0 and 100),
  color text not null default '#ff6b4a',
  updated_at timestamptz not null default now()
);

create table if not exists public.underworld_ops (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  op text not null check (op in ('hack', 'smuggle', 'launder', 'bribe', 'heist')),
  target_type text,
  target_id uuid,
  cost numeric(20,2) not null,
  success boolean not null,
  payout numeric(20,2) not null default 0,
  heat_delta numeric(6,2) not null default 0,
  day integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.arrest_warrants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'quashed', 'served')),
  day integer not null,
  created_at timestamptz not null default now()
);

create index if not exists warrants_profile_idx on public.arrest_warrants (profile_id) where status = 'open';

-- ── Autonomous NPC masterminds ─────────────────────────────────────────────
create table if not exists public.npc_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title text not null,
  role text not null,
  hue integer not null default 78,
  wealth numeric(24,2) not null default 0,
  aggression numeric(6,2) not null default 50,
  sentiment numeric(6,2) not null default 50,
  status text not null default 'Observing',
  last_action text not null default '',
  last_action_day integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.npc_directives (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.npc_agents (id) on delete cascade,
  directive text not null,
  category text not null default 'market',
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Government ─────────────────────────────────────────────────────────────
create table if not exists public.laws (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  status law_status not null default 'proposed',
  effect text not null default '',
  votes integer not null default 0 check (votes between 0 and 100),
  enacted_day integer,
  created_at timestamptz not null default now()
);

create table if not exists public.lobbying (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  amount numeric(20,2) not null,
  succeeded boolean not null,
  influence_delta numeric(6,2) not null default 0,
  heat_delta numeric(6,2) not null default 0,
  day integer not null,
  created_at timestamptz not null default now()
);

-- ── World events & the Wire ────────────────────────────────────────────────
create table if not exists public.world_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category event_category not null,
  severity event_severity not null,
  pulse numeric(6,2) not null default 0,
  sentiment numeric(6,2) not null default 0,
  crime numeric(6,2) not null default 0,
  regulation numeric(6,2) not null default 0,
  starts_day integer not null,
  ends_day integer not null,
  source text not null default 'system' check (source in ('system', 'grok', 'admin')),
  created_at timestamptz not null default now()
);

create index if not exists events_active_idx on public.world_events (ends_day desc);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (id) on delete cascade,
  author_name text not null,
  handle text not null,
  role text not null default '',
  body text not null check (char_length(body) between 1 and 280),
  sentiment numeric(4,2) not null default 0 check (sentiment between -1 and 1),
  likes integer not null default 0,
  replies integer not null default 0,
  verified boolean not null default false,
  day integer not null default 1,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_tags_idx on public.posts using gin (tags);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('like', 'repost')),
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id, kind)
);

-- ── Economic audit trail ───────────────────────────────────────────────────
create table if not exists public.transactions (
  id bigserial primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind tx_kind not null,
  asset_id uuid,
  gross numeric(20,2) not null default 0,
  fee numeric(20,2) not null default 0,
  net numeric(20,2) not null default 0,
  day integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists transactions_profile_idx on public.transactions (profile_id, created_at desc);
create index if not exists transactions_day_idx on public.transactions (day desc);

-- ── Profile bootstrap ──────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_handle text;
  v_name text;
begin
  v_handle := regexp_replace(
    lower(coalesce(new.raw_user_meta_data ->> 'handle', split_part(new.email, '@', 1), 'operator')),
    '[^a-z0-9_]', '', 'g'
  );
  if char_length(v_handle) < 2 then v_handle := 'operator' || substr(new.id::text, 1, 6); end if;
  v_handle := substr(v_handle, 1, 14) || substr(new.id::text, 1, 4);
  v_name := left(coalesce(new.raw_user_meta_data ->> 'display_name', 'Unnamed Operator'), 28);

  insert into public.profiles (id, handle, display_name, archetype)
  values (
    new.id,
    v_handle,
    v_name,
    coalesce((new.raw_user_meta_data ->> 'archetype')::player_archetype, 'tycoon')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ── Utility functions ──────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'world_state','profiles','corporations','tokens','districts',
    'syndicates','npc_agents','iso_placeholder'
  ] loop
    if t = 'iso_placeholder' then continue; end if;
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ── AMM RPCs ────────────────────────────────────────────────────────────────
-- Buy tokens with credits. Constant product, 0.30% protocol fee.
create or replace function public.buy_token(p_token uuid, p_credits numeric)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_credits numeric;
  v_supply numeric;
  v_in numeric;
  v_fee numeric;
  v_k numeric;
  v_new_credits numeric;
  v_new_supply numeric;
  v_out numeric;
  v_cash numeric;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_credits is null or p_credits < 100 then raise exception 'minimum order is 100 credits'; end if;

  select cash into v_cash from public.profiles where id = v_uid for update;
  if v_cash < p_credits then raise exception 'insufficient cash'; end if;

  select credits, supply into v_credits, v_supply
  from public.tokens where id = p_token and not rugged for update;
  if not found then raise exception 'market unavailable'; end if;

  v_fee := p_credits * 0.003;
  v_in := p_credits - v_fee;
  v_k := v_credits * v_supply;
  v_new_credits := v_credits + v_in;
  v_new_supply := v_k / v_new_credits;
  v_out := v_supply - v_new_supply;

  update public.tokens
  set credits = v_new_credits,
      supply = v_new_supply,
      liquidity = v_new_credits,
      volume = volume + p_credits,
      holders = holders + 1,
      updated_at = now()
  where id = p_token;

  update public.profiles set cash = cash - p_credits where id = v_uid;

  insert into public.token_holdings (profile_id, token_id, amount)
  values (v_uid, p_token, v_out)
  on conflict (profile_id, token_id)
  do update set amount = public.token_holdings.amount + excluded.amount, updated_at = now();

  insert into public.transactions (profile_id, kind, asset_id, gross, fee, net, day)
  values (v_uid, 'token_buy', p_token, p_credits, v_fee, v_out, (select day from public.world_state where id = 1));

  update public.world_state set treasury = treasury + v_fee where id = 1;
  return v_out;
end;
$$;

create or replace function public.sell_token(p_token uuid, p_amount numeric)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_credits numeric;
  v_supply numeric;
  v_k numeric;
  v_new_credits numeric;
  v_new_supply numeric;
  v_gross numeric;
  v_fee numeric;
  v_net numeric;
  v_held numeric;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid amount'; end if;

  select amount into v_held from public.token_holdings
  where profile_id = v_uid and token_id = p_token for update;
  if coalesce(v_held, 0) < p_amount then raise exception 'insufficient tokens'; end if;

  select credits, supply into v_credits, v_supply
  from public.tokens where id = p_token and not rugged for update;
  if not found then raise exception 'market unavailable'; end if;

  v_k := v_credits * v_supply;
  v_new_supply := v_supply + p_amount;
  v_new_credits := v_k / v_new_supply;
  v_gross := v_credits - v_new_credits;
  v_fee := v_gross * 0.003;
  v_net := v_gross - v_fee;

  update public.tokens
  set credits = v_new_credits,
      supply = v_new_supply,
      liquidity = v_new_credits,
      volume = volume + v_gross,
      updated_at = now()
  where id = p_token;

  update public.token_holdings
  set amount = amount - p_amount, updated_at = now()
  where profile_id = v_uid and token_id = p_token;

  update public.profiles set cash = cash + v_net where id = v_uid;

  insert into public.transactions (profile_id, kind, asset_id, gross, fee, net, day)
  values (v_uid, 'token_sell', p_token, v_gross, v_fee, v_net, (select day from public.world_state where id = 1));

  update public.world_state set treasury = treasury + v_fee where id = 1;
  return v_net;
end;
$$;

-- Move tokens between spot and staking. Yield is credited by the world tick.
create or replace function public.stake_token(p_token uuid, p_amount numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_held numeric;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select amount into v_held from public.token_holdings
  where profile_id = v_uid and token_id = p_token for update;
  if coalesce(v_held, 0) < p_amount or p_amount <= 0 then raise exception 'invalid stake'; end if;
  update public.token_holdings
  set amount = amount - p_amount, staked = staked + p_amount, updated_at = now()
  where profile_id = v_uid and token_id = p_token;
end;
$$;

create or replace function public.unstake_token(p_token uuid, p_amount numeric)
returns void
language plpgsql
security definer set search_path = public
as $$
declare v_uid uuid := auth.uid(); v_staked numeric;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select staked into v_staked from public.token_holdings
  where profile_id = v_uid and token_id = p_token for update;
  if coalesce(v_staked, 0) < p_amount or p_amount <= 0 then raise exception 'invalid unstake'; end if;
  update public.token_holdings
  set staked = staked - p_amount, amount = amount + p_amount, updated_at = now()
  where profile_id = v_uid and token_id = p_token;
end;
$$;

revoke all on function public.buy_token(uuid, numeric) from public;
revoke all on function public.sell_token(uuid, numeric) from public;
revoke all on function public.stake_token(uuid, numeric) from public;
revoke all on function public.unstake_token(uuid, numeric) from public;
grant execute on function public.buy_token(uuid, numeric) to authenticated;
grant execute on function public.sell_token(uuid, numeric) to authenticated;
grant execute on function public.stake_token(uuid, numeric) to authenticated;
grant execute on function public.unstake_token(uuid, numeric) to authenticated;

-- ── Net worth view ─────────────────────────────────────────────────────────
create or replace view public.profile_net_worth
with (security_invoker = true)
as
select
  p.id,
  p.handle,
  p.display_name,
  p.archetype,
  p.cash
    + coalesce((select sum(h.amount * t.price) from public.token_holdings h join public.tokens t on t.id = h.token_id where h.profile_id = p.id and not t.rugged), 0)
    + coalesce((select sum(h.staked * t.price) from public.token_holdings h join public.tokens t on t.id = h.token_id where h.profile_id = p.id and not t.rugged), 0)
    + coalesce((select sum(ch.shares * c.share_price) from public.corporation_holdings ch join public.corporations c on c.id = ch.corporation_id where ch.profile_id = p.id), 0)
    + coalesce((select sum(d.price) from public.districts d where d.owner_id = p.id), 0)
    - coalesce((select sum(l.outstanding) from public.loans l where l.borrower_id = p.id and l.status = 'active'), 0)
    as net_worth
from public.profiles p;

grant select on public.profile_net_worth to authenticated;

-- ── Row level security ─────────────────────────────────────────────────────
alter table public.world_state enable row level security;
alter table public.profiles enable row level security;
alter table public.corporations enable row level security;
alter table public.corporation_holdings enable row level security;
alter table public.tokens enable row level security;
alter table public.token_holdings enable row level security;
alter table public.token_price_history enable row level security;
alter table public.districts enable row level security;
alter table public.district_price_history enable row level security;
alter table public.isp_nodes enable row level security;
alter table public.isp_traffic enable row level security;
alter table public.media_outlets enable row level security;
alter table public.shows enable row level security;
alter table public.media_campaigns enable row level security;
alter table public.banks enable row level security;
alter table public.loans enable row level security;
alter table public.bank_ledger enable row level security;
alter table public.syndicates enable row level security;
alter table public.underworld_ops enable row level security;
alter table public.arrest_warrants enable row level security;
alter table public.npc_agents enable row level security;
alter table public.npc_directives enable row level security;
alter table public.laws enable row level security;
alter table public.lobbying enable row level security;
alter table public.world_events enable row level security;
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.transactions enable row level security;

-- Public reads (world state has no secrets; profiles deliberately exclude email).
do $$
declare t text;
begin
  foreach t in array array[
    'world_state','profiles','corporations','tokens','token_price_history',
    'districts','district_price_history','isp_nodes','media_outlets','shows',
    'banks','syndicates','npc_agents','laws','world_events','posts'
  ] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
  end loop;
end $$;

-- Own private rows.
drop policy if exists "own holdings" on public.token_holdings;
create policy "own holdings" on public.token_holdings
  for select using (profile_id = auth.uid());

drop policy if exists "own equity" on public.corporation_holdings;
create policy "own equity" on public.corporation_holdings
  for select using (profile_id = auth.uid());

drop policy if exists "own loans" on public.loans;
create policy "own loans" on public.loans
  for select using (borrower_id = auth.uid() or public.is_admin());

drop policy if exists "own warrants" on public.arrest_warrants;
create policy "own warrants" on public.arrest_warrants
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "own underwriting" on public.bank_ledger;
create policy "own underwriting" on public.bank_ledger
  for select using (
    public.is_admin() or exists (
      select 1 from public.banks b where b.id = bank_id and b.owner_id = auth.uid()
    )
  );

-- Profile updates: only presentation fields. Economic columns are server-only.
drop policy if exists "update own presentation" on public.profiles;
create policy "update own presentation" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (display_name, handle, archetype) on public.profiles to authenticated;

-- The Wire: authenticated users post as themselves; no editing history.
drop policy if exists "write own post" on public.posts;
create policy "write own post" on public.posts
  for insert to authenticated
  with check (author_id = auth.uid() and char_length(body) between 1 and 280);

drop policy if exists "delete own post" on public.posts;
create policy "delete own post" on public.posts
  for delete to authenticated
  using (author_id = auth.uid());

drop policy if exists "own reaction" on public.post_reactions;
create policy "own reaction" on public.post_reactions
  for all to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- God Mode writes. In production the server uses the service role for world ticks.
do $$
declare t text;
begin
  foreach t in array array[
    'world_state','profiles','corporations','tokens','districts','isp_nodes',
    'media_outlets','shows','media_campaigns','banks','loans','syndicates',
    'underworld_ops','arrest_warrants','npc_agents','laws','world_events',
    'transactions'
  ] loop
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ── Realtime ───────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'world_events'
  ) then
    alter publication supabase_realtime add table public.world_events;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tokens'
  ) then
    alter publication supabase_realtime add table public.tokens;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'districts'
  ) then
    alter publication supabase_realtime add table public.districts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- End of schema. Seed data lives in supabase/seed.sql, world ticks are
-- executed by the trusted server (cron or Supabase Edge Function) using the
-- service role. Never expose the service role key to the browser.
-- ═══════════════════════════════════════════════════════════════════════════
