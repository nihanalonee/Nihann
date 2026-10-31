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
- 🧬 [Explore the remix source](https://omgithub.com/nihanalonee/Nihann).
<!-- omgithub:readme:end -->

---

# OmniLife: The Syndicate

**The city is a machine. Own the machine.**

A playable cyber-noir economic simulation built with Next.js App Router, React 19,
Tailwind CSS 4, TypeScript, optional Supabase Realtime, and an optional Grok world
engine. Buy the ground under the skyline, run the fiber that carries its traffic,
charter a bank, launch a media empire, lobby the council, and finance the crews
that the council pretends not to know.

No account, database, or API key is required to play. The full simulation runs
locally and saves to your browser.

```bash
npm install
npm run dev
# http://localhost:3002
```

---

## What you can do

| System | Levers |
|--------|--------|
| **Districts** | Buy and sell property across eight districts, collect rent, watch demand, crime, and regulation reprice the city. |
| **Markets** | Trade tokens on a constant-product AMM, mint your own token, stake for yield, and trade equities. Slippage, liquidity, rugs, and sentiment are real. |
| **Banking** | Charter a bank, set rates, inject reserves, draw and repay loans, earn spread, and survive runs when reserves fall below 8%. |
| **Media** | Launch TV, streaming, or news outlets; produce shows; run hype or expose campaigns that move sentiment and token prices. |
| **Telecom** | Build edge, fiber, and datacenter nodes, upgrade capacity, repair outages, and profit from uptime × load. |
| **Underworld** | Hack, smuggle, launder, bribe, and run heists. Every op raises heat; warrants settle for 8% of your cash. |
| **Government** | Lobby for deregulation, subsidies, immunity, or goodwill. Regulation, approval, taxes, and elections drift on their own. |
| **The Wire** | Read a living feed of NPC rivals, city alerts, and breaking events. Post your own narrative. |
| **God Mode** | Env-allowlisted admin terminal for cash, day, economy, regulation, approval, and world events. |
| **World engine** | Optional Grok-generated shocks, with a deterministic local fallback and honest source labels. |

### Four ways to start

| Archetype | Fantasy | Perk |
|-----------|---------|------|
| **Tycoon** | Own the ground beneath them | −12% property acquisition, +18% rent |
| **Banker** | Liquidity is a weapon | −30% bank charter, −20% loan interest |
| **Ghost** | The grid is your inheritance | −35% heat gain, +15% hack yield |
| **Mogul** | Reality is a broadcast | +22% media income, +30% propaganda potency |

### Controls

- **Space / pause button** — pause or resume the world clock.
- **1× / 2× / 4×** — change tick speed (base tick: 9 seconds).
- **Sidebar / mobile bottom nav** — move between the ten views.
- **Reset** — wipe the local save and return to onboarding.
- **Summon world event** — ask the world engine for the next shock.

Progress is saved automatically under `omnilife-syndicate-save-v1`.

---

## Stack

- **Next.js 16.4** App Router, React 19, TypeScript (strict)
- **Tailwind CSS 4** with a custom cyber-noir theme in `app/globals.css`
- **Lucide** icons; no chart or state libraries
- **Supabase** schema included for production (`supabase/schema.sql`)
- **Grok / xAI** via a server-only route (`app/api/world-engine/route.ts`)

The economy is a pure state machine in `lib/engine.ts`. UI components dispatch
transitions through `GameProvider`; nothing in a view mutates state directly.

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the full design,
mechanics, schema, and production migration path.

---

## Environment variables

Copy `.env.example` to `.env.local` only if you want the optional integrations.
The game runs without any of them.

```bash
# Server-only. Never prefix with NEXT_PUBLIC_.
GROK_API_KEY=
GROK_MODEL=grok-4

# Server-side God Mode allowlist (comma-separated).
ADMIN_EMAILS=mirajx132@gmail.com
NEXT_PUBLIC_ADMIN_EMAILS=mirajx132@gmail.com

# Optional production persistence/realtime.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If `GROK_API_KEY` is absent, `/api/world-engine` returns a curated deterministic
event and the UI labels the source as the local simulation. If the key is present
but the call fails or returns malformed JSON, the same fallback is used.

### Supabase (optional)

1. Create a project and run `supabase/schema.sql` in the SQL editor.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Port the engine transitions to the included RPCs/Edge Function and enable
   Realtime on the published tables.

The current client build deliberately uses local persistence because no
credentials ship with this repository.

---

## Scripts

```bash
npm run dev        # development server on :3002
npm run build      # production build
npm start          # production server on :3002
npm run typecheck  # tsc --noEmit
```

---

## Security

> **The original design PDF contained a hardcoded Grok API key.**
> That key is exposed and must be revoked at <https://console.x.ai>. It is not
> used or committed here. Generate a fresh key and keep it server-side.

- Admin access is checked **server-side** against `ADMIN_EMAILS`; the PDF's
  email backdoor was not implemented. The resulting `adminUnlocked` flag is a UI
  gate, not authentication.
- Admin authorization must be re-enforced server-side before production use.
- The client is authoritative in this demo. A real multiplayer deployment needs
  a server tick, RLS, and idempotent RPC mutations — the included schema shows
  the intended shape.
- Model output is sanitized, allowlisted, clamped, and rate-limited.

If you find a security issue, open a private advisory rather than a public issue.

---

## Project layout

```
app/                  routes, layout, API handlers, global theme
components/           shell, onboarding, provider, UI primitives
components/views/     ten game views
lib/                  types, seed world, pure engine, formatters
supabase/             production schema, RLS, AMM RPCs, Realtime
docs/                 architecture and design notes
```

Built for people who think a balance sheet is a character sheet.
