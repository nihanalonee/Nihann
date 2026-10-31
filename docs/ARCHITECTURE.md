# OmniLife: The Syndicate — Architecture

> The city is a machine. This document explains how the machine is built, where its
> levers are, and which levers are safe to pull in production.

---

## 1. What this is

OmniLife is a single-page, client-authoritative economic simulation dressed as a
cyber-noir MMO. One world clock advances every nine seconds (0.5×–4×, pausable).
Every institution in the city — property, tokens, equities, ISPs, media outlets,
banks, syndicates, and the government — is a system the player can own, exploit,
or sabotage.

The demo runs with **zero credentials**. Grok and Supabase are optional upgrades:
the game falls back to a deterministic local world engine and `localStorage`
persistence when they are absent.

```
┌──────────────────────────────────────────────────────────────────┐
│  Next.js App Router (client shell)                               │
│  Onboarding → AppShell → 10 views                                │
│         │                                                        │
│         ├─ GameProvider  (clock, persistence, action dispatch)   │
│         │      │                                                 │
│         │      ├─ lib/engine.ts   pure state transitions         │
│         │      └─ lib/seed.ts     world + archetype generation   │
│         │                                                        │
│         └─ /api/world-engine  ──► xAI Grok (optional)            │
│            /api/admin/unlock  ──► server-side email allowlist    │
│                                                                  │
│  Production path: Supabase Postgres + RLS + Realtime + RPCs      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. Design thesis — why the city feels alive

Most management games fail because the player is the only actor with agency.
OmniLife makes the world *indifferent* to the player:

1. **Everything is priced, including attention.** Tokens move on sentiment,
   equities move on sentiment, property moves on demand minus crime minus
   regulation, and media moves the sentiment that moves the other two. There is
   no single "correct" asset.
2. **Every advantage creates exposure.** ISP capacity prints revenue until load
   exceeds capacity, then uptime collapses. Banks print spread until reserves
   fall under 8%, then a bank run hits the Wire. Crime prints cash until heat
   triggers warrants; three warrants trigger an 8% cash settlement.
3. **Rivals act while you read.** Two NPC masterminds take an action per tick.
   They expand, consolidate, post to the Wire, and occasionally move a token.
   They are not quest-givers; they are competitors.
4. **Information is a resource.** World events are surfaced as toasts, Wire
   posts, and market shocks. Acting before the feed catches up is the edge.
5. **The government is a marketplace.** Lobbying buys deregulation, subsidies,
   immunity, or goodwill. Regulation suppresses property pressure and raises
   crime; approval drifts and elections reset the council every 48 days.

### The five ruthless mechanics

| # | Mechanic | Where | Why it bites |
|---|----------|-------|--------------|
| 1 | **AMM slippage** | `tradeToken` | Buys and sells move the pool price along a constant-product curve. Size is a cost, not a flex. |
| 2 | **Liquidity rug** | `tickWorld` | High-risk tokens can be rugged by their creators (not the player), vaporizing 93% of value and posting the aftermath to the Wire. |
| 3 | **Bank fragility** | `tickWorld` | Player banks earn spread on loans, but reserves/deposits under 8% mark the bank strained; under 4% it is insolvent and can trigger a run. |
| 4 | **Heat & warrants** | `underworldOp`, `tickWorld` | Every op raises heat. Above 82 heat, warrants accumulate. Three warrants settle for 8% of cash and a reputation hit. |
| 5 | **Narrative warfare** | `runCampaign`, `postToWire` | Media campaigns can hype an asset or expose a rival. Propaganda potency scales with the Mogul archetype and outlet reach. |

### Progression loop

```
Cash → income assets (property / ISP / media / bank)
     → influence & reputation
     → better terms (loans, charters, campaigns)
     → heat & regulatory exposure
     → lobbying / laundering / immunity
     → larger asymmetric bets (tokens, heists, hostile narratives)
```

The leaderboard blends liquid cash, holdings, property, ISP and media equity,
bank equity, and outstanding debt, so net worth cannot be gamed by hiding cash
in one system.

---

## 3. Folder tree

```
.
├── app/
│   ├── api/
│   │   ├── admin/unlock/route.ts     # server-side God Mode gate
│   │   └── world-engine/route.ts     # Grok call + deterministic fallback
│   ├── globals.css                   # Tailwind 4 theme, cyber-noir tokens
│   ├── layout.tsx                    # metadata, viewport, GameProvider
│   └── page.tsx                      # loading → onboarding → shell
├── components/
│   ├── AppShell.tsx                  # sidebar, topbar, ticker, mobile nav
│   ├── GameProvider.tsx              # clock, save/load, actions, AI summon
│   ├── Onboarding.tsx                # identity + archetype selection
│   ├── ToastHost.tsx                 # event/action notifications
│   ├── ui.tsx                        # Panel, Stat, Progress, Sparkline, Modal…
│   └── views/
│       ├── Overview.tsx              # command center, charts, feed
│       ├── City.tsx                  # districts, acquisition, rent
│       ├── Markets.tsx               # DEX, equities, mint, stake
│       ├── Banking.tsx               # charters, loans, reserves, rates
│       ├── Media.tsx                 # outlets, shows, campaigns
│       ├── Telecom.tsx               # ISP nodes, capacity, repairs
│       ├── Underworld.tsx            # hack, smuggle, launder, bribe, heist
│       ├── Government.tsx            # laws, lobbying, elections
│       ├── Wire.tsx                  # social feed + player posts
│       └── Admin.tsx                 # God Mode overrides
├── lib/
│   ├── types.ts                      # domain model (GameState + entities)
│   ├── seed.ts                       # world seed, archetypes, net worth
│   ├── engine.ts                     # all pure state transitions
│   └── format.ts                     # credits, %, compact numbers, time
├── supabase/schema.sql               # production schema, RLS, RPCs, Realtime
├── docs/ARCHITECTURE.md              # this file
├── .env.example                      # environment contract
└── README.md
```

### State flow

All economy logic is **pure**: every exported engine action takes a `GameState`
and returns `{ state, toast? }`. `GameProvider.act()` applies the transition and
appends the toast. This keeps mechanics testable and makes a server-authoritative
migration mechanical rather than a rewrite.

```ts
// components/GameProvider.tsx
const act = (fn: (state: GameState) => ActionResult) => {
  setState(prev => {
    if (!prev) return prev;
    const result = fn(prev);
    return result.toast ? addToast(result.state, result.toast) : result.state;
  });
};
```

Persistence is a single JSON blob under `omnilife-syndicate-save-v1`, versioned
with `state.version === 1`. A corrupt or stale save is discarded and the seed
world is rebuilt.

---

## 4. Domain model

`lib/types.ts` defines the entire simulation:

| Entity | Purpose |
|--------|---------|
| `Player` | cash, influence, reputation, heat, holdings, stakes, loans, perks, net-worth history |
| `District` | price, demand, crime, police, rent, owner — the property market |
| `Token` | price, liquidity, supply, risk, holders, staking pool, rugged flag |
| `Corporation` | share price, float, sentiment, revenue, price history |
| `IspNode` | kind (edge/fiber/datacenter), capacity, load, uptime, revenue, upkeep |
| `MediaOutlet` | kind (tv/streaming/news), reach, credibility, hype, shows, revenue |
| `Bank` | deposits, reserves, loans, rate, reputation, status |
| `Loan` | principal, outstanding, rate, payment, bank |
| `Syndicate` / `Agent` | crews and autonomous NPC masterminds |
| `WorldEvent` | category, severity, pulse/sentiment/crime/regulation shocks |
| `Law` / `Government` | active/proposed laws, approval, regulation, tax, warrants |
| `Post` | Wire feed entries with sentiment and tags |
| `GameState` | world singleton + player + all collections + clock + toasts |

### Archetypes

| Archetype | Identity | Perk |
|-----------|----------|------|
| Tycoon | Own the ground beneath them | −12% property acquisition, +18% rent |
| Banker | Liquidity is a weapon | −30% bank charter, −20% loan interest |
| Ghost | The grid is your inheritance | −35% heat gain, +15% hack yield |
| Mogul | Reality is a broadcast | +22% media income, +30% propaganda potency |

---

## 5. World tick

`tickWorld(state)` runs on a fixed interval in `GameProvider` and is the only
place passive systems advance. In order:

1. Day increments; active world-event effects are aggregated.
2. Economy drifts from event pulse, regulation, and noise.
3. Tokens drift, volume/holders update, high-risk tokens can rug.
4. Equities drift on sentiment and event pulse; history appends.
5. Districts reprice on demand/crime/regulation; rent is recomputed
   (`price × 0.00035/day`, ×1.18 for Tycoon-owned).
6. Passive income: rent, ISP revenue (scaled by uptime and load), media revenue
   (scaled by reach/credibility, ×1.22 for Mogul), bank spread.
7. Loans auto-pay when cash allows; missed payments capitalize and add heat.
8. Staking yield accrues (`amount × price × 0.0008`).
9. Tax is withheld from income and credited to the treasury.
10. Heat decays (faster for Ghost); high heat issues warrants; three warrants
    settle for 8% of cash.
11. Two NPC masterminds act; NPC Wire chatter may appear.
12. New events can spawn; expired events are trimmed.
13. Government approval/regulation drift; elections every 48 days.
14. Net worth is computed and appended to history (48-point cap).

The function is deterministic apart from `Math.random` noise helpers, and does
not touch the DOM, network, or storage.

---

## 6. AI world engine

`POST /api/world-engine` accepts a compact snapshot of live state and returns one
`WorldEvent`.

- **Configured** (`GROK_API_KEY` or `XAI_API_KEY`): calls
  `https://api.x.ai/v1/chat/completions` with `GROK_MODEL` (default `grok-4`),
  temperature `0.95`, JSON response format, and a 20s timeout.
- **Unconfigured / failed / malformed**: returns a deterministic fallback event
  drawn from a curated pool. The client labels the source honestly
  (`mode: "local"`), and a toast distinguishes Grok from simulation.
- **Sanitization**: category and severity are allowlisted, numbers are clamped
  (−20…20), title ≤90 chars, description ≤480 chars, and the source is stamped
  server-side. Model output never reaches the client unvalidated.
- **Rate limit**: 8 requests/minute/IP in-memory. This prevents request loops
  from burning paid credits, but resets on serverless cold starts.

`GET /api/world-engine` reports `{ configured, model, capabilities }` so the UI
can show whether live AI is active.

The prompt instructs the model to invent a concrete shock that names a live
entity and implies a gameplay consequence, avoiding fourth-wall references and
repeating the current narrative.

### Optional Supabase Realtime path

`supabase/schema.sql` defines the production model. Notable choices:

- **Server-authoritative money.** Clients never write balances, reserves, or
  prices. `buy_token`, `sell_token`, `stake_token`, `unstake_token` are
  `SECURITY DEFINER` RPCs that mutate holdings and pools atomically.
- **RLS by default.** Public tables are read-only to clients; private balance
  sheets (holdings, loans, warrants, ledger) are scoped to `auth.uid()`.
- **Admin is a role, not an email.** `profiles.role` is checked by
  `public.is_admin()`; only the service role can grant it.
- **Realtime is curated.** Only `posts`, `world_events`, `tokens`, `districts`,
  and `profiles` are published.
- **Net worth** is exposed as a view rather than duplicated client-side.

To use it: create a Supabase project, run `schema.sql`, set
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then port the
engine transitions into RPCs or an Edge Function tick.

---

## 7. Security notes

### The PDF key

The original design PDF embedded a Grok API key in plaintext. That key is
**compromised by definition** and is not present anywhere in this repository.
It must be revoked at <https://console.x.ai>. Generate a new key and set it as a
server-only `GROK_API_KEY`. Never use a `NEXT_PUBLIC_` prefix for it.

### God Mode

The PDF proposed an email-based backdoor. This implementation deliberately does
not do that:

- `ADMIN_EMAILS` is a **server-side** allowlist read in
  `/api/admin/unlock`.
- The endpoint is rate-limited (10/min/IP) and returns only
  `{ admin: true, scope: "world-override" }`.
- The client stores an `adminUnlocked` flag, which is a **UI gate, not
  authentication**. Anyone who can edit `localStorage` can show the panel.
- In production, replace it with Supabase Auth + a signed role claim (or an
  `app_metadata.role` check on the server), and enforce authorization on every
  admin RPC. The SQL schema already models `profiles.role` and `is_admin()`.

### Other controls

- Model output is sanitized and clamped before it can shock the economy.
- No secrets are read on the client.
- All mutations are local and reversible; `resetGame()` clears the save.
- Dependencies are minimal (`next`, `react`, `lucide-react`, Tailwind).

### Known limitations (honest version)

| Area | This demo | Production requirement |
|------|-----------|------------------------|
| Authority | Client-side `GameState` in `localStorage` | Server tick + RPC mutations, RLS, idempotency keys |
| Multiplayer | Single player vs. simulated NPCs | Supabase Realtime presence + authoritative world row |
| AI | Optional one-shot Grok calls | Queue, moderation, caching, cost caps, audit log |
| Admin | Email allowlist → UI flag | Auth role + server-side authorization on every action |
| Economy | Seeded deterministic simulation | Versioned migration + replayable event log |
| Tests | `tsc` + production build | Unit tests for engine, property-based AMM invariants, E2E |
| Assets | CSS gradients + Lucide icons | Licensed imagery/CDN (the PDF suggested Unsplash) |

The simulation is intentionally deep enough to play today, and structured so
the authoritative migration is a transport change rather than a redesign.
