# Nihann

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Remixed using [OMGithub.com](https://omgithub.com).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://omgithub.com/nihanalonee/Nihann)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/nihanalonee/Nihann)

- 🎮 [Open the project](https://omgithub.com/nihanalonee/Nihann).
- ✨ [Remix this project](https://omgithub.com/?remix=nihanalonee%2FNihann).
- 💻 [Explore the source](https://github.com/nihanalonee/Nihann).
- 🛠️ [Check build runs](https://github.com/nihanalonee/Nihann/actions).
- 🐛 [Report an issue](https://github.com/nihanalonee/Nihann/issues).
- 👤 [Explore the creator's projects](https://omgithub.com/nihanalonee).
- 🌍 [Create with OMGithub](https://omgithub.com).
- 🧬 [Explore the remix source](https://github.com/nihanalonee/Nihann).
<!-- omgithub:readme:end -->

---

## OmniLife: The Syndicate

A living economic MMO simulation set in the neon-soaked city of OmniLife. You run a
holding company, an ISP, a streaming network, a syndicate, and a growing political
operation. Every three seconds the world ticks: markets reprice, NPCs move, banks
strain, regulators react, and the Wire fills with rumor, scandal, and propaganda.

The simulation is **local-first**. It runs entirely in the browser with deterministic
seeding, procedural world events, and a full action economy. Grok and Supabase are
optional amplifiers, never hard dependencies.

### Feature map

| Module | What it simulates |
| --- | --- |
| **Command Center** | Net worth, allocation, market index, heat, event feed, district map, NPC roster |
| **Markets** | Token AMM trading, staking and rewards, token minting, rug pulls, flash loans, equities, board raids |
| **Banking** | Fractional-reserve deposits, withdrawals, credit lines, bank founding, reserve injection, bank runs, bailouts |
| **Infrastructure** | Fiber nodes, data centers, backbone upgrades, pricing, security, cyber intrusions, uptime and congestion |
| **Media** | Network launches, shows, propaganda campaigns, exposés, fabricated stories, reach and credibility |
| **Underworld** | Laundering, smuggling, racketeering, cyber heists, syndicate board, bribery, legal defense, warrants |
| **Government** | Policy pulse, lobbying, campaign funding, bailouts, regulations, warrants, budget and capture |
| **The Wire** | Server-wide social feed, posting, filters, trending tags, sentiment monitor, optional Supabase Realtime |
| **Admin** | God-mode root console: liquidity spawning, total capture, event injection, market crashes, token pumps, entity wipes, world reset |

### Tech stack

- **Next.js 16** App Router with a fully static export (`output: 'export'`)
- **React 19** and **TypeScript** in strict mode
- **Tailwind CSS 4** with a custom neo-noir terminal design system
- **lucide-react** iconography
- **Supabase** (optional) for durable profiles, shared Wire posts, and AMM SQL
- **Grok** (optional, server-side only) for autonomous world events
- **Node.js** custom server for the static build plus API routes
- **node:test + tsx** for unit tests

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

Production-style run (builds the static export, writes the deployment manifest,
then serves it with the custom server):

```bash
npm start            # equivalent to ./start.sh
```

Or run the pieces directly:

```bash
npm run build        # static export into ./out
node server.mjs      # serves ./out and the API endpoints
```

The default profile is `mirajx132@gmail.com`, which means **God Mode is unlocked on
first boot**. Change the email in the profile modal to revoke it.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Static export to `out/` |
| `npm start` | `node server.mjs` (serves `out/` + APIs) |
| `npm test` | Unit tests (`tsx --test tests/*.test.ts`) |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `./start.sh` | Install if needed, build, write `deployment-output.json`, serve |
| `./capture.sh` | Runtime screenshot hook; requires `RUNTIME_DIR`, `CAPTURE_URL`, `CAPTURE_DIR` |

`start.sh` writes `deployment-output.json` with `{ project, directory }`, where
`directory` points at the static export (`out/`). The runtime uses that manifest to
serve the game.

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in only what you need. The game boots
and plays with none of them.

```bash
# Server-only Grok credentials. Never use a NEXT_PUBLIC_ prefix.
GROK_API_KEY=
GROK_MODEL=grok-3-mini

# Optional: enables live Supabase Realtime Wire sync.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Optional: enables live Unsplash imagery in the media module.
UNSPLASH_ACCESS_KEY=
```

- **`GROK_API_KEY`** is read only by `server.mjs`. The browser calls `/api/world-engine`;
  the key never reaches the client. Without it, the server returns a locally generated
  event and the UI shows `LOCAL AI`.
- **Supabase** is optional. Without it, the Wire is fully local and persisted in
  `localStorage`. With it, posts are mirrored to `social_posts` and remote posts arrive
  over Realtime.
- **Unsplash** is optional. Without it, the imagery endpoint returns curated gradient
  placeholders.

`.env.local` is gitignored. Do not commit keys.

---

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. Enable **Realtime** for `public.social_posts` (the schema adds it to the
   `supabase_realtime` publication).
4. Enable **Authentication → Providers → Anonymous sign-ins** so the shared Wire can
   publish without a dedicated login screen. If anonymous auth is disabled, posts stay
   local and the remote mirror is skipped.
5. Copy the project URL and anon key into `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

6. Rebuild (`npm run build`) so the public env vars are baked into the client bundle.

The schema includes:

- `profiles` with an `auth.users` trigger that creates a profile automatically
- `corporations`, `banks`, `tokens`, `isp_networks`, `media_stations`,
  `crime_syndicates`
- `social_posts` with author-bound RLS and Realtime
- `liquidity_pools` plus a locked constant-product `amm_swap(token, amount, direction)`
  function
- Public-read / owner-write RLS policies and `updated_at` triggers
- Seed rows matching the local world

> **Auth note:** Wire inserts require an authenticated Supabase session because RLS
> binds `author_id` to `auth.uid()`. When no session exists, the client attempts an
> anonymous sign-in; if that provider is disabled, the local post still succeeds and
> the remote mirror is skipped silently.

---

## Grok world engine

The browser periodically posts a compact world snapshot to `/api/world-engine`. The
server asks Grok for a single structured event and validates it before returning:

```json
{
  "title": "Liquidity Crisis",
  "description": "A clearing house missed margin at the open...",
  "category": "finance",
  "severity": "high",
  "headline": "LIQUIDITY CRISIS: interbank lending freezes",
  "hue": 350,
  "effects": [
    { "kind": "market", "delta": -0.012 },
    { "kind": "token", "targetId": "luna", "delta": -0.018 }
  ]
}
```

If Grok is unavailable, times out, or returns malformed JSON, the endpoint falls back
to the local event generator. The simulation never blocks on the network.

### API endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | `GET` | Reports server and Grok configuration status |
| `/api/world-engine` | `POST` | Generates or falls back to a world event |
| `/api/npc-action` | `POST` | Produces a contextual NPC action |
| `/api/imagery` | `GET` | Unsplash-backed media imagery with gradient fallback |

---

## Gameplay loop

1. **Build the balance sheet.** Trade tokens, stake yield, buy equities, acquire
   district deeds, and expand AetherLink capacity.
2. **Manufacture attention.** Launch shows, run propaganda, publish exposés, and
   post to the Wire to move sentiment and price.
3. **Capture the state.** Lobby City Hall, fund campaigns, bribe officials, and
   request bailouts when the system is too big to fail.
4. **Manage heat.** Launder dirty cash, bribe the FCU, fund legal defense, or dismiss
   warrants before they are served.
5. **Survive the consequences.** Bank runs, cyber intrusions, regulatory crackdowns,
   market crashes, and hostile NPC moves all feed back into the same economy.

Every action is evaluated against the current world state and produces a toast,
notification, log entry, and sometimes a Wire post. The simulation autosaves to
`localStorage` under `omnilife.syndicate.save.v7`; the Admin page can reseed the world.

### God mode

God mode is bound to `mirajx132@gmail.com`. Open the profile modal from the topbar,
confirm the email, and the **Admin** route becomes available. The console supports:

- spawning liquid and dirty cash
- total political capture (influence, reputation, officials, warrants)
- injecting a world event
- crashing the entire market
- pumping or crashing any token
- wiping a bank, ISP, media network, or corporation
- a guarded world reset

Changing the profile email away from the admin address revokes access immediately.

---

## Architecture

```text
app/                      Next.js routes (static export)
  page.tsx                Command Center
  markets/ banking/ infrastructure/ media/
  underworld/ government/ wire/ admin/
  layout.tsx              Root layout + metadata
  globals.css             Design tokens and terminal styling

components/
  GameProvider.tsx        State, tick loop, persistence, toasts, engine sync, Realtime
  Shell.tsx               Sidebar, mobile drawer, topbar, ticker, profile modal
  ui.tsx                  Panels, charts, gauges, donut, modal, tabs, badges
  pages/                  One component per route

lib/
  types.ts                All domain types
  seed.ts                 Deterministic seeded world
  simulation.ts           Tick engine, NPC AI, bank runs, warrants, events
  actions.ts              Every player and god action
  economy.ts              Net worth, allocation, leverage, risk, income
  world-events.ts         Procedural event templates and rumors
  grok.ts                 Browser-side engine client
  supabase.ts             Optional client, publish, Realtime subscription
  format.ts               Money, time, number, color helpers

server.mjs                Static server + Grok/API routes
supabase/schema.sql       Tables, RLS, Realtime, AMM
tests/                    Unit tests for economy, simulation, actions
```

### State model

`GameState` is a single serializable tree: player, districts, tokens, banks,
corporations, ISPs, media, syndicates, government, feed, events, NPCs, and market
aggregates. `advance(state)` clones the tree, runs the subsystem ticks in order, and
returns the next state. Actions clone too, so React state updates remain predictable
and testable.

### Persistence

- Local save: `localStorage`, debounced 500 ms, versioned by `SAVE_VERSION`.
- Remote Wire: Supabase `social_posts`, merged by post `id` to avoid double-rendering
  your own echoed transmission.

---

## Tests

```bash
npm test
```

Coverage includes formatting, seeded-world invariants, net worth and allocation,
bank leverage/risk, heat bands, tick immutability, day rollover, forced bank runs,
world-event application, token buys/sells, deposits/withdrawals, Wire posting, god
gating, profile-based god mode, and ISP expansion.

---

## Deployment

The project builds to static HTML/CSS/JS in `out/` and is served by `server.mjs`,
which also hosts the API routes. `start.sh` performs the full pipeline:

```bash
./start.sh
```

For a platform that expects a manifest, `start.sh` writes:

```json
{
  "project": "/absolute/path/to/project",
  "directory": "/absolute/path/to/project/out"
}
```

Set `PORT` to choose the listening port (default `3000`). Set
`NEXT_TELEMETRY_DISABLED=1` to silence Next telemetry.

---

## Design notes

- **Neo-noir terminal:** deep navy/black surfaces, cyan and magenta accents, amber
  warnings, rose failures, thin borders, and dense monospace numerics.
- **Responsive:** sidebar collapses into a mobile drawer; cards, charts, and tables
  reflow at small widths.
- **No placeholders:** every route, action, and subsystem is implemented. Optional
  integrations degrade to deterministic local behavior instead of empty states.
- **Server-side secrets:** Grok and Unsplash keys stay in `server.mjs`; only public
  Supabase configuration is exposed to the client.
