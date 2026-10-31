"use client";

import { useState } from "react";
import {
  Activity,
  Cable,
  CircleDot,
  Cpu,
  Gauge,
  Network,
  RadioTower,
  Server,
  Signal,
  Wrench,
  Zap,
} from "lucide-react";
import { useGame } from "../GameProvider";
import { Modal, Panel, Progress, SectionTitle, Stat } from "../ui";
import { credits } from "@/lib/format";
import { buildIsp, repairIsp, upgradeIsp } from "@/lib/engine";
import type { IspNode } from "@/lib/types";

const KIND_META = {
  edge: { icon: RadioTower, label: "Edge Node", color: "#63f7c3", cost: 90_000 },
  fiber: { icon: Cable, label: "Fiber Trunk", color: "#8fa8ff", cost: 280_000 },
  datacenter: { icon: Server, label: "Data Center", color: "#c9ff4d", cost: 780_000 },
} as const;

export function TelecomView() {
  const { state, act } = useGame();
  const [buildOpen, setBuildOpen] = useState(false);
  if (!state) return null;

  const own = state.isps.filter((n) => n.ownerId === "player");
  const rivals = state.isps.filter((n) => n.ownerId !== "player");
  const capacity = own.reduce((n, x) => n + x.capacity, 0);
  const load = own.reduce((n, x) => n + x.load, 0);
  const uptime = own.length ? own.reduce((n, x) => n + x.uptime, 0) / own.length : 0;
  const revenue = own.reduce((n, x) => n + Math.max(0, x.revenuePerDay - x.upkeep), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-acid" />
            <p className="mono text-[9px] uppercase tracking-[0.26em] text-acid">Internet infrastructure</p>
          </div>
          <h1 className="mt-2 text-[26px] font-semibold tracking-[-0.035em] sm:text-[30px]">Own the pipes. Tax the packets.</h1>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted">
            Build edge nodes, fiber trunks, and data centers. Capacity above load keeps uptime high; congestion
            degrades service and revenue. Your rivals are laying cable under the same river.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setBuildOpen(true)}>
          <Zap className="h-3.5 w-3.5" /> Build infrastructure
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat label="Gbps capacity" value={capacity} accent="#c9ff4d" sub={<span className="text-muted">{own.length} owned nodes</span>} />
        <Stat label="Network load" value={`${capacity ? Math.round((load / capacity) * 100) : 0}%`} accent={load > capacity ? "#ff625c" : "#ffb454"} sub={<span className="text-muted">{Math.round(load)} Gbps committed</span>} />
        <Stat label="Avg uptime" value={own.length ? `${uptime.toFixed(2)}%` : "—"} accent={uptime > 99 ? "#63f7c3" : "#ff625c"} sub={<span className="text-muted">Service-level target 99%</span>} />
        <Stat label="Net bandwidth income" value={credits(revenue, true)} accent="#63f7c3" sub={<span className="text-muted">Per simulated day</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel className="p-4 sm:p-5">
          <SectionTitle
            eyebrow="Your backbone"
            title="Owned infrastructure"
            icon={<Network className="h-4 w-4" />}
            action={<span className="chip">{own.length} sites</span>}
          />
          {own.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line/70 p-6 text-center">
              <Network className="mx-auto h-6 w-6 text-dim" />
              <p className="mt-2 text-[12px] font-medium text-ink/80">No physical footprint.</p>
              <p className="mx-auto mt-1 max-w-sm text-[10.5px] leading-relaxed text-muted">
                An edge node is the cheapest way into the market at ₡90K. Fiber moves serious traffic. A data
                center is a moat.
              </p>
              <button className="btn btn-primary mt-3 py-1.5 text-[10.5px]" onClick={() => setBuildOpen(true)}>
                Commission a node
              </button>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {own.map((node) => {
                const meta = KIND_META[node.kind];
                const Icon = meta.icon;
                const utilization = (node.load / Math.max(1, node.capacity)) * 100;
                return (
                  <div key={node.id} className="rounded-xl border border-line/60 bg-abyss/50 p-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${meta.color}12`, color: meta.color }}>
                          <Icon className="h-4 w-4" strokeWidth={1.6} />
                        </div>
                        <div>
                          <p className="text-[11.5px] font-semibold">{node.name}</p>
                          <p className="mono text-[8px] uppercase tracking-[0.12em] text-dim">{meta.label}</p>
                        </div>
                      </div>
                      <span className={`mono flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] uppercase ${node.status === "online" ? "bg-mint/10 text-mint" : node.status === "degraded" ? "bg-ember/10 text-ember" : "bg-danger/10 text-danger"}`}>
                        <CircleDot className="h-2 w-2" /> {node.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex justify-between">
                          <span className="mono text-[8px] uppercase tracking-[0.1em] text-dim">Load / capacity</span>
                          <span className={`mono text-[8.5px] ${utilization > 92 ? "text-danger" : utilization > 78 ? "text-ember" : "text-mint"}`}>{Math.round(node.load)} / {node.capacity} Gbps</span>
                        </div>
                        <Progress value={Math.min(100, utilization)} color={utilization > 92 ? "#ff625c" : utilization > 78 ? "#ffb454" : "#63f7c3"} height={2.5} className="mt-1" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="mono text-[7px] uppercase tracking-[0.1em] text-dim">Uptime</p>
                          <p className={`mono mt-0.5 text-[9.5px] ${node.uptime > 99 ? "text-mint" : "text-ember"}`}>{node.uptime.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="mono text-[7px] uppercase tracking-[0.1em] text-dim">Latency</p>
                          <p className="mono mt-0.5 text-[9.5px]">{node.latency}ms</p>
                        </div>
                        <div>
                          <p className="mono text-[7px] uppercase tracking-[0.1em] text-dim">Net / day</p>
                          <p className="mono mt-0.5 text-[9.5px] text-mint">{credits(node.revenuePerDay - node.upkeep, true)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button className="btn flex-1 py-1 text-[9.5px]" onClick={() => act((s) => upgradeIsp(s, node.id))}>
                        <Zap className="h-3 w-3" /> Upgrade {credits(node.capacity * 1_800, true)}
                      </button>
                      <button className="btn py-1 text-[9.5px]" onClick={() => act((s) => repairIsp(s, node.id))} disabled={node.uptime > 99.5}>
                        <Wrench className="h-3 w-3" /> Repair
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel className="overflow-hidden p-4 sm:p-5">
          <SectionTitle eyebrow="Backbone map" title="City network topology" icon={<Signal className="h-4 w-4" />} />
          <div className="relative mt-4 h-[240px] overflow-hidden rounded-xl border border-line/50 bg-void/60 grid-bg">
            <div className="absolute inset-0 radial-fade opacity-60" />
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 240" fill="none">
              <path d="M50 60 L180 110 L320 50" stroke="rgba(201,255,77,0.25)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M50 60 L110 190 L320 180" stroke="rgba(143,168,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M180 110 L260 140 L320 180" stroke="rgba(99,247,195,0.22)" strokeWidth="1" />
              <path d="M320 50 L260 140" stroke="rgba(255,122,182,0.2)" strokeWidth="1" strokeDasharray="3 5" />
            </svg>
            {state.isps.slice(0, 6).map((node, i) => {
              const positions = [
                { left: "11%", top: "20%" },
                { left: "42%", top: "42%" },
                { left: "77%", top: "15%" },
                { left: "24%", top: "76%" },
                { left: "62%", top: "54%" },
                { left: "77%", top: "72%" },
              ];
              const pos = positions[i] ?? positions[0];
              const isOwn = node.ownerId === "player";
              return (
                <div key={node.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
                  <div className={`relative flex h-3 w-3 items-center justify-center rounded-full ${isOwn ? "bg-acid" : "bg-ice/60"}`}>
                    {isOwn && <span className="absolute h-7 w-7 animate-ping rounded-full bg-acid/10" />}
                  </div>
                  <div className="absolute left-4 top-1/2 w-32 -translate-y-1/2">
                    <p className={`mono truncate text-[8px] ${isOwn ? "text-acid" : "text-muted"}`}>{node.name}</p>
                    <p className="mono text-[7px] text-dim">{node.capacity} Gbps</p>
                  </div>
                </div>
              );
            })}
            <div className="absolute bottom-2 left-2 flex items-center gap-3">
              <span className="mono flex items-center gap-1 text-[7.5px] text-dim"><span className="h-1.5 w-1.5 rounded-full bg-acid" /> yours</span>
              <span className="mono flex items-center gap-1 text-[7.5px] text-dim"><span className="h-1.5 w-1.5 rounded-full bg-ice/60" /> rival</span>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {rivals.map((node) => {
              const meta = KIND_META[node.kind];
              const Icon = meta.icon;
              return (
                <div key={node.id} className="flex items-center gap-2.5 rounded-lg border border-line/50 bg-abyss/40 px-2.5 py-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.6} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] text-ink/80">{node.name}</p>
                    <p className="mono text-[8px] text-dim">{node.ownerName} · {node.capacity} Gbps</p>
                  </div>
                  <div className="w-16">
                    <Progress value={node.load} max={node.capacity} color={node.status === "online" ? "#8fa8ff" : "#ff625c"} height={2} />
                  </div>
                  <span className={`mono w-10 text-right text-[8.5px] ${node.uptime > 98 ? "text-mint" : "text-ember"}`}>{node.uptime.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Panel className="p-4 sm:p-5">
        <SectionTitle eyebrow="Infrastructure economics" title="Why bandwidth is leverage" icon={<Gauge className="h-4 w-4" />} />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Cpu, title: "Congestion", text: "Load above capacity degrades uptime and cuts daily revenue. Upgrade before the peak, not after." },
            { icon: Activity, title: "Uptime", text: "Each node prices uptime into revenue. A 94% node earns like a 94% node — regardless of its capacity." },
            { icon: Wrench, title: "Maintenance", text: "Repairs cost ₡18K and restore 99.9%. Skipping them is a slow-motion sale to your rivals." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-lg border border-line/50 bg-abyss/40 p-3">
                <Icon className="h-4 w-4 text-acid" strokeWidth={1.6} />
                <p className="mt-2 text-[11px] font-semibold">{item.title}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">{item.text}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      <Modal open={buildOpen} onClose={() => setBuildOpen(false)} eyebrow="Capex authorization" title="Build network infrastructure" width="max-w-lg">
        <BuildForm onDone={() => setBuildOpen(false)} />
      </Modal>
    </div>
  );
}

function BuildForm({ onDone }: { onDone: () => void }) {
  const { state, act } = useGame();
  const [kind, setKind] = useState<IspNode["kind"]>("edge");
  const [name, setName] = useState("");
  if (!state) return null;
  const specs = {
    edge: { cost: 90_000, capacity: 20, revenue: 3_200, upkeep: 850, label: "Edge Node", desc: "Last-mile capacity. Cheap, low ceiling, quick payback." },
    fiber: { cost: 280_000, capacity: 70, revenue: 14_000, upkeep: 3_600, label: "Fiber Trunk", desc: "The middle mile. Serious throughput and latency advantages." },
    datacenter: { cost: 780_000, capacity: 180, revenue: 46_000, upkeep: 12_000, label: "Data Center", desc: "A moat with a power bill. Highest capacity and highest risk." },
  } as const;
  const spec = specs[kind];
  const Icon = KIND_META[kind].icon;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(specs) as IspNode["kind"][]).map((key) => {
          const item = specs[key];
          const ItemIcon = KIND_META[key].icon;
          const active = kind === key;
          return (
            <button
              key={key}
              onClick={() => setKind(key)}
              className={`rounded-lg border p-2.5 text-left transition-colors ${active ? "border-acid/40 bg-acid/[0.06]" : "border-line/60 bg-abyss/50 hover:border-line-bright"}`}
            >
              <ItemIcon className={`h-4 w-4 ${active ? "text-acid" : "text-muted"}`} />
              <p className="mt-2 text-[10px] font-semibold">{item.label}</p>
              <p className="mono mt-0.5 text-[8.5px] text-dim">{credits(item.cost, true)}</p>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-muted">{spec.desc}</p>
      <div>
        <label className="mono mb-1 block text-[8.5px] uppercase tracking-[0.14em] text-dim">Node designation</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`${spec.label} ${state.isps.filter((n) => n.ownerId === "player").length + 1}`} maxLength={32} />
      </div>
      <div className="rounded-lg border border-line/60 bg-abyss/50 p-3 space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-muted">Build cost</span><span className="mono">{credits(spec.cost)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Capacity</span><span className="mono text-acid">{spec.capacity} Gbps</span></div>
        <div className="flex justify-between"><span className="text-muted">Revenue / day</span><span className="mono text-mint">{credits(spec.revenue)}</span></div>
        <div className="flex justify-between"><span className="text-muted">Upkeep / day</span><span className="mono text-danger">{credits(spec.upkeep)}</span></div>
      </div>
      <button
        className="btn btn-primary w-full"
        disabled={state.player.cash < spec.cost}
        onClick={() => {
          act((s) => buildIsp(s, kind, name));
          onDone();
        }}
      >
        <Icon className="h-3.5 w-3.5" /> Commission {spec.label}
      </button>
    </div>
  );
}
