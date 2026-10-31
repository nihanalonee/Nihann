"use client";

import { useState } from "react";
import { ArrowRight, Building2, Flame, Landmark, MapPin, Shield, Sparkles, TrendingUp, Users } from "lucide-react";
import { useGame } from "../GameProvider";
import { Delta, Modal, Panel, Progress, SectionTitle, Sparkline, Stat } from "../ui";
import { credits, pct, price } from "@/lib/format";
import { buyProperty, sellProperty } from "@/lib/engine";
import { ARCHETYPES } from "@/lib/seed";
import type { District } from "@/lib/types";

export function CityView() {
  const { state, act } = useGame();
  const [selected, setSelected] = useState<District | null>(null);
  const [filter, setFilter] = useState<"all" | "owned" | "available">("all");
  if (!state) return null;

  const owned = state.districts.filter((d) => d.ownerId === "player");
  const ownedValue = owned.reduce((n, d) => n + d.price, 0);
  const rent = owned.reduce((n, d) => n + d.rentPerDay, 0);
  const avgCrime = state.districts.reduce((n, d) => n + d.crime, 0) / state.districts.length;
  const avgCrimeChange = state.districts.reduce((n, d) => {
    const h = d.history;
    return n + ((h.at(-1)! - h.at(-2)!) / h.at(-2)!) * 100;
  }, 0) / state.districts.length;

  const visible = state.districts.filter((d) => {
    if (filter === "owned") return d.ownerId === "player";
    if (filter === "available") return d.ownerId !== "player";
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">District authority</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">Own the ground beneath them.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Property values reprice against crime, regulation, and demand. Every parcel you own pays daily rent
            and gives you a voice in the district. Every parcel you don&apos;t own is someone else&apos;s leverage.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-line/70 bg-void/60 p-0.5">
          {(["all", "available", "owned"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-md px-3 py-1.5 text-[10.5px] capitalize transition-colors ${
                filter === value ? "bg-line-bright/60 text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Owned parcels" value={owned.length} sub={<span className="text-muted">of {state.districts.length} districts</span>} />
        <Stat label="Portfolio value" value={credits(ownedValue, true)} accent="#c9ff4d" sub={<span className="text-muted">Marked to market daily</span>} />
        <Stat label="Rent / day" value={credits(rent, true)} accent="#63f7c3" sub={<span className="text-muted">Net of city tax</span>} />
        <Stat
          label="City risk"
          value={`${avgCrime.toFixed(0)}/100`}
          accent={avgCrime > 55 ? "#ff625c" : "#ffb454"}
          sub={
            <span className="mono text-muted">
              {pct(avgCrimeChange, 1)} price drift today
            </span>
          }
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((district) => {
          const change = ((district.history.at(-1)! - district.history.at(-2)!) / district.history.at(-2)!) * 100;
          const isPlayer = district.ownerId === "player";
          const isGov = district.ownerId === "gov";
          const yield_ = (district.rentPerDay * 365 * 100) / district.price;
          return (
            <Panel
              key={district.id}
              className={`group relative overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                isPlayer ? "border-acid/30" : ""
              }`}
            >
              <div
                className="absolute inset-x-0 top-0 h-[2px] opacity-70"
                style={{ background: `linear-gradient(90deg, ${district.color}, transparent)` }}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${district.color}12`, color: district.color }}
                  >
                    <MapPin className="h-4 w-4" strokeWidth={1.6} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold leading-tight tracking-[-0.01em]">{district.name}</p>
                    <p className="mono mt-1 text-[8.5px] uppercase tracking-[0.14em] text-dim">{district.kind}</p>
                  </div>
                </div>
                {isPlayer ? (
                  <span className="chip border-acid/30 text-[8px] text-acid">owned</span>
                ) : (
                  <span className="mono rounded bg-white/[0.03] px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em] text-dim">
                    {isGov ? "public" : "private"}
                  </span>
                )}
              </div>

              <p className="mt-3 line-clamp-2 min-h-[32px] text-[10.5px] leading-relaxed text-muted">{district.description}</p>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="mono text-[17px] font-semibold leading-none">{credits(district.price, true)}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Delta value={change} />
                    <span className="mono text-[8px] text-dim">today</span>
                  </div>
                </div>
                <Sparkline data={district.history.slice(-10)} color={district.color} width={92} height={32} strokeWidth={1.2} className="w-[92px]" />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[8px] uppercase tracking-[0.1em] text-dim">Crime</span>
                    <span className="mono text-[8.5px] text-ink/60">{Math.round(district.crime)}</span>
                  </div>
                  <Progress value={district.crime} color={district.crime > 60 ? "#ff625c" : district.crime > 30 ? "#ffb454" : "#63f7c3"} height={2} className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="mono text-[8px] uppercase tracking-[0.1em] text-dim">Demand</span>
                    <span className="mono text-[8.5px] text-ink/60">{Math.round(district.demand)}</span>
                  </div>
                  <Progress value={district.demand} color="#8fa8ff" height={2} className="mt-1" />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-line/40 pt-3">
                <div>
                  <p className="mono text-[8px] uppercase tracking-[0.1em] text-dim">{isPlayer ? "Rent / day" : "Yield"}</p>
                  <p className="mono mt-0.5 text-[11px] text-ink/80">
                    {isPlayer ? credits(district.rentPerDay) : `${yield_.toFixed(2)}%`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mono text-[8px] uppercase tracking-[0.1em] text-dim">Owner</p>
                  <p className="mono mt-0.5 max-w-[110px] truncate text-[9.5px] text-ink/70">
                    {isPlayer ? "You" : district.ownerName ?? "Unclaimed"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelected(district)}
                className={`btn mt-3 w-full justify-between py-1.5 text-[10.5px] ${
                  isPlayer ? "" : "border-acid/25 bg-acid/[0.05] text-acid hover:bg-acid/10"
                }`}
              >
                {isPlayer ? "Manage holding" : isGov ? "Review public land" : "Acquire title"}
                <ArrowRight className="h-3 w-3" />
              </button>
            </Panel>
          );
        })}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} eyebrow="Title transfer" title={selected?.name ?? "District"} width="max-w-xl">
        {selected && <DistrictModal district={selected} onDone={() => setSelected(null)} />}
      </Modal>
    </div>
  );
}

function DistrictModal({ district, onDone }: { district: District; onDone: () => void }) {
  const { state, act } = useGame();
  if (!state) return null;
  const isPlayer = district.ownerId === "player";
  const isGov = district.ownerId === "gov";
  const discount = state.player.archetype === "tycoon" ? 0.88 : 1;
  const premium = district.ownerId ? 1.12 : 1;
  const cost = district.price * discount * premium;
  const rent = Math.round(district.rentPerDay * (state.player.archetype === "tycoon" ? 1.18 : 1));
  const yield_ = (rent * 365 * 100) / Math.max(1, cost);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-line/60 bg-abyss/60 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${district.color}14`, color: district.color }}>
            <Building2 className="h-5 w-5" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[12.5px] font-semibold">{district.kind}</p>
            <p className="mono mt-0.5 text-[9px] text-dim">Held by {district.ownerName ?? "no registered owner"}</p>
          </div>
        </div>
        <p className="mono text-[18px] font-semibold text-acid">{credits(district.price, true)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Asking price", value: credits(cost), icon: Landmark },
          { label: "Daily rent", value: credits(rent), icon: TrendingUp },
          { label: "Gross yield", value: `${yield_.toFixed(2)}%`, icon: Sparkles },
          { label: "Crime exposure", value: `${Math.round(district.crime)}/100`, icon: Flame },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-lg border border-line/50 bg-abyss/40 p-2.5">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-dim" />
                <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">{item.label}</p>
              </div>
              <p className="mono mt-1 text-[13px] text-ink">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <div className="flex items-center justify-between">
            <span className="mono text-[9px] text-muted">Police presence</span>
            <span className="mono text-[9px] text-ink/60">{Math.round(district.police)}</span>
          </div>
          <Progress value={district.police} color="#8fa8ff" height={3} className="mt-1" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <span className="mono text-[9px] text-muted">Demand index</span>
            <span className="mono text-[9px] text-ink/60">{Math.round(district.demand)}</span>
          </div>
          <Progress value={district.demand} color="#63f7c3" height={3} className="mt-1" />
        </div>
      </div>

      <p className="mt-3 text-[10.5px] leading-relaxed text-muted">{district.description}</p>

      {isPlayer ? (
        <div className="mt-4">
          <div className="rounded-lg border border-acid/20 bg-acid/[0.04] p-3">
            <p className="text-[11px] text-acid">You hold title. Rent accrues every simulated day and the asset marks to market.</p>
          </div>
          <button
            className="btn btn-danger mt-3 w-full"
            onClick={() => {
              act((s) => sellProperty(s, district.id));
              onDone();
            }}
          >
            Sell title · net {credits(district.price * 0.96, true)}
          </button>
        </div>
      ) : isGov ? (
        <div className="mt-4 rounded-lg border border-line/60 bg-abyss/50 p-3">
          <p className="text-[11px] leading-relaxed text-muted">
            Municipal land requires a rezoning vote. Lobby the Government tab to move regulation and unlock
            public parcels.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-line/60 bg-abyss/50 p-3">
            <div>
              <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Cash after purchase</p>
              <p className="mono mt-1 text-[12px]">{credits(state.player.cash - cost)}</p>
            </div>
            <div className="text-right">
              <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">Perk applied</p>
              <p className="mono mt-1 text-[10px] text-ice">
                {state.player.archetype === "tycoon" ? "-12% acquisition · +18% rent" : "Standard terms"}
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary mt-3 w-full"
            disabled={cost > state.player.cash}
            onClick={() => {
              act((s) => buyProperty(s, district.id));
              onDone();
            }}
          >
            {cost > state.player.cash ? `Need ${credits(cost - state.player.cash, true)} more` : `Acquire ${district.name} · ${credits(cost, true)}`}
          </button>
          <p className="mt-2 text-center text-[9px] text-dim">
            Purchases from private owners include a 12% control premium. Rent begins next tick.
          </p>
        </>
      )}
    </div>
  );
}
