"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Cpu,
  Fingerprint,
  Landmark,
  LockKeyhole,
  Megaphone,
  Radio,
  ShieldCheck,
  Signal,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import { ARCHETYPES } from "@/lib/seed";
import type { Archetype } from "@/lib/types";
import { useGame } from "./GameProvider";

const ICONS: Record<Archetype, typeof Building2> = {
  tycoon: Building2,
  banker: Landmark,
  hacker: TerminalSquare,
  mogul: Megaphone,
};

const ACCENTS: Record<Archetype, string> = {
  tycoon: "#ffb454",
  banker: "#8fa8ff",
  hacker: "#63f7c3",
  mogul: "#ff7ab6",
};

export function Onboarding() {
  const { startGame } = useGame();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [archetype, setArchetype] = useState<Archetype>("tycoon");
  const [handleTouched, setHandleTouched] = useState(false);
  const [error, setError] = useState("");

  const derivedHandle = useMemo(
    () =>
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20) || "operator",
    [name],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      setError("Give the city a name to fear.");
      return;
    }
    setError("");
    startGame({
      name: name.trim(),
      handle: (handleTouched ? handle : derivedHandle).trim().replace(/^@/, "") || derivedHandle,
      email: email.trim(),
      archetype,
    });
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-void">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-70" />
      <div className="pointer-events-none absolute inset-0 radial-fade" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-acid/40 to-transparent" />

      <div className="relative mx-auto grid min-h-screen max-w-[1480px] grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Story panel */}
        <section className="relative flex flex-col justify-between overflow-hidden px-7 py-10 sm:px-12 lg:px-16 lg:py-14">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-acid/30 bg-acid/10">
              <Fingerprint className="h-4.5 w-4.5 text-acid" strokeWidth={1.7} />
            </div>
            <div>
              <p className="mono text-[10px] uppercase tracking-[0.32em] text-muted">OmniLife Systems</p>
              <p className="mono text-[10px] uppercase tracking-[0.2em] text-dim">City Node · 09 / Online</p>
            </div>
          </div>

          <div className="relative z-10 my-12 max-w-2xl">
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="chip border-acid/25 text-acid">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-acid" />
                Live simulation
              </span>
              <span className="chip">Day 1 / 2126</span>
              <span className="chip">Server population 2.4M</span>
            </div>

            <h1 className="text-[clamp(3.7rem,8vw,7.7rem)] font-black leading-[0.82] tracking-[-0.065em]">
              OMNI
              <span className="block text-acid text-glow">LIFE</span>
            </h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-px w-10 bg-acid/70" />
              <p className="mono text-[11px] font-medium uppercase tracking-[0.42em] text-acid/90">
                The Syndicate
              </p>
            </div>

            <p className="mt-8 max-w-lg text-[15px] leading-relaxed text-ink/75">
              The city is a closed-loop economy with nine districts, six live markets, autonomous
              billionaire rivals, and a government that auctions its own laws. You arrive with seed
              capital and a clean identity.
              <span className="text-ink"> Everything else is leverage.</span>
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-line/70 bg-line/60 sm:grid-cols-4">
              {[
                { value: "9", label: "Districts" },
                { value: "08", label: "AI rivals" },
                { value: "06", label: "Live markets" },
                { value: "∞", label: "Leverage" },
              ].map((stat) => (
                <div key={stat.label} className="bg-panel/90 px-4 py-4">
                  <p className="mono text-xl font-semibold text-ink">{stat.value}</p>
                  <p className="mono mt-1 text-[9px] uppercase tracking-[0.18em] text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex max-w-xl items-start gap-3 rounded-xl border border-line/70 bg-abyss/60 p-4">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 text-mint" strokeWidth={1.7} />
              <div>
                <p className="mono text-[9px] uppercase tracking-[0.2em] text-mint">Intercept · 06:14</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                  “The banks are fine. The buildings are fine. The only thing missing is a buyer
                  when everyone tries to leave at once.”
                </p>
                <p className="mono mt-2 text-[9px] uppercase tracking-[0.16em] text-dim">
                  — Vale Okonkwo, overheard at Apex Financial
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] uppercase tracking-[0.14em] text-dim mono">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" /> Server-authoritative loop
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3" /> Grok world engine
            </span>
            <span className="flex items-center gap-1.5">
              <Signal className="h-3 w-3" /> Realtime economy
            </span>
          </div>

          {/* Orbital decoration */}
          <div className="pointer-events-none absolute -right-28 top-1/2 hidden -translate-y-1/2 opacity-40 2xl:block">
            <div className="relative h-[520px] w-[520px] rounded-full border border-acid/10">
              <div className="absolute inset-10 rounded-full border border-line/60" />
              <div className="absolute inset-24 rounded-full border border-line/40" />
              <div className="absolute inset-0 animate-[spin_40s_linear_infinite]">
                <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-acid shadow-[0_0_14px_rgba(201,255,77,0.8)]" />
              </div>
              <div className="absolute inset-16 animate-[spin_26s_linear_infinite_reverse]">
                <div className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mint" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="mono text-[9px] uppercase tracking-[0.3em] text-dim">City economy</p>
                  <p className="mono mt-1 text-3xl font-light text-acid">62<span className="text-sm text-dim">/100</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form panel */}
        <section className="relative flex items-center border-t border-line/70 bg-abyss/80 px-5 py-10 backdrop-blur-xl sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
          <form onSubmit={submit} className="relative z-10 w-full max-w-md">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="mono text-[9px] uppercase tracking-[0.28em] text-acid">New identity</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Open a life in the city.</h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                  Your choices set starting capital, influence, heat, and passive perks.
                </p>
              </div>
              <span className="chip shrink-0 border-mint/25 text-mint">
                <LockKeyhole className="h-2.5 w-2.5" /> Local save
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="mono mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
                  Public identity
                </label>
                <input
                  id="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kaito Ren"
                  maxLength={28}
                  className="input"
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="handle" className="mono mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
                    Wire handle
                  </label>
                  <div className="relative">
                    <span className="mono pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-dim">@</span>
                    <input
                      id="handle"
                      value={handleTouched ? handle : derivedHandle}
                      onChange={(e) => {
                        setHandleTouched(true);
                        setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20));
                      }}
                      placeholder="operator"
                      className="input pl-7"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="mono mb-1.5 block text-[9px] uppercase tracking-[0.18em] text-muted">
                    Email <span className="text-dim">/ optional</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@city.net"
                    className="input"
                    autoComplete="off"
                  />
                </div>
              </div>
              <p className="-mt-1.5 text-[10px] leading-relaxed text-dim">
                Email is only used for the server-side God Mode allowlist. No account is created in this demo.
              </p>

              <div className="pt-2">
                <p className="mono mb-2 text-[9px] uppercase tracking-[0.18em] text-muted">Starting archetype</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(Object.keys(ARCHETYPES) as Archetype[]).map((key) => {
                    const preset = ARCHETYPES[key];
                    const Icon = ICONS[key];
                    const active = archetype === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setArchetype(key)}
                        aria-pressed={active}
                        className="group relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-200"
                        style={{
                          borderColor: active ? `${ACCENTS[key]}80` : "rgba(43,58,47,0.6)",
                          background: active ? `${ACCENTS[key]}0d` : "rgba(9,13,10,0.55)",
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="h-4 w-4" style={{ color: active ? ACCENTS[key] : "#819085" }} strokeWidth={1.7} />
                          <span
                            className="mono text-[8px] uppercase tracking-[0.14em]"
                            style={{ color: active ? ACCENTS[key] : "#4e5a51" }}
                          >
                            {preset.label}
                          </span>
                        </div>
                        <p className="mt-2 text-[12px] font-semibold tracking-[-0.01em] text-ink">{preset.tagline}</p>
                        <p className="mono mt-1 text-[9px] uppercase tracking-[0.08em] text-dim">
                          ₡{(preset.cash / 1_000_000).toFixed(2)}M · Heat {preset.heat}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 min-h-[30px] text-[10.5px] leading-relaxed text-muted">
                  {ARCHETYPES[archetype].description}
                </p>
              </div>

              {error && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary group mt-1 w-full py-3 text-[13px]">
                Enter the city
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div className="flex items-start gap-2 rounded-lg border border-line/60 bg-panel/40 p-2.5">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-ember" />
                <p className="text-[10px] leading-relaxed text-dim">
                  Without a Grok key, a deterministic local world engine drives NPC rivals and macroeconomic
                  events. Add <span className="mono text-muted">GROK_API_KEY</span> to activate live AI masterminds.
                </p>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
