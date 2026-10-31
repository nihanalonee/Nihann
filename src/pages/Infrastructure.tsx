import {
  Activity,
  ArrowRight,
  Cable,
  CircuitBoard,
  Cpu,
  Gauge,
  HardDrive,
  HeartPulse,
  MapPin,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Server,
  ShieldCheck,
  Signal,
  Wrench,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { MiniBars, Sparkline } from "../components/charts";
import { Badge, Button, Label, Modal, Panel, Progress } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtCompact, fmtMoney, fmtNum } from "../lib/format";
import { cn } from "../lib/cn";

export function Infrastructure() {
  const { state, dispatch } = useGame();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [buildOpen, setBuildOpen] = useState(false);
  const [buildDistrict, setBuildDistrict] = useState("foundry");
  const [priceDraft, setPriceDraft] = useState(state.isp.pricePerGb);

  const isp = state.isp;
  const node = isp.nodes.find((n) => n.id === selectedNode);
  const totalCapacity = isp.nodes.reduce((s, n) => s + n.capacity, 0);
  const totalLoad = isp.nodes.reduce((s, n) => s + n.load, 0);
  const avgLatency = isp.nodes.reduce((s, n) => s + n.latency, 0) / Math.max(1, isp.nodes.length);
  const online = isp.nodes.filter((n) => n.status !== "offline");
  const health = isp.nodes.reduce((s, n) => s + n.health, 0) / Math.max(1, isp.nodes.length);
  const revenue = isp.subscribers * isp.pricePerGb * 0.07;

  const links = useMemo(() => {
    if (!isp.nodes.length) return [];
    const root = isp.nodes[0];
    return isp.nodes.slice(1).map((target) => ({ from: root, to: target }));
  }, [isp.nodes]);

  const position = (districtId: string) => {
    const district = state.districts.find((d) => d.id === districtId);
    if (!district) return { x: 50, y: 50 };
    return { x: district.x + district.w / 2, y: district.y + district.h / 2 };
  };

  const statusColor = (status: string) => (status === "online" ? "#7CF7C4" : status === "degraded" ? "#F5C451" : "#FF6B6B");

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-mint/70">EMPIRE / PHYSICAL LAYER</span>
            <Badge variant={isp.uptime > 99.5 ? "mint" : "danger"}>
              <span className="h-1 w-1 rounded-full bg-current" /> {isp.uptime.toFixed(2)}% SLA
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">{isp.name} Backbone</h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            Fibre routes, edge compute and the bandwidth market underneath every digital business in
            the city. If the backbone blinks, the DEX stutters and mining stops.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "TOGGLE_AUTO_REPAIR" })}
          >
            <RefreshCw size={12} /> Auto-repair {isp.autoRepair ? "ON" : "OFF"}
          </Button>
          <Button variant="primary" size="sm" onClick={() => setBuildOpen(true)}>
            <Plus size={12} /> Build node
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Subscribers", value: fmtCompact(isp.subscribers), sub: `${fmtMoney(revenue)} / tick`, icon: <Radio size={13} />, color: "#7CF7C4" },
          { label: "Backbone load", value: `${fmtNum(totalLoad)} / ${fmtNum(totalCapacity)} Gb`, sub: `${((totalLoad / Math.max(1, totalCapacity)) * 100).toFixed(0)}% utilized`, icon: <Activity size={13} />, color: "#B69CFF" },
          { label: "Average latency", value: `${avgLatency.toFixed(1)} ms`, sub: `${online.length}/${isp.nodes.length} nodes online`, icon: <Signal size={13} />, color: "#F5C451" },
          { label: "Network health", value: `${health.toFixed(1)}%`, sub: `${isp.reputation.toFixed(0)} reputation`, icon: <HeartPulse size={13} />, color: "#7FB2FF" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="label">{stat.label}</div>
                <div className="num mt-2 text-[23px] leading-none text-white">{stat.value}</div>
                <div className="mt-2 text-[9.5px] text-white/30">{stat.sub}</div>
              </div>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{ color: stat.color, borderColor: `${stat.color}25`, background: `${stat.color}0d` }}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-12">
        <div className="space-y-3 xl:col-span-8">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Network topology</Label>
                <div className="mt-1 text-[13px] text-white/80">Live fibre routes</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[7.5px] uppercase tracking-wider text-mint/60">
                  <span className="h-1 w-1 animate-pulse-dot rounded-full bg-mint" /> TRAFFIC
                </span>
                <Badge variant="violet">{isp.nodes.length} NODES</Badge>
              </div>
            </div>
            <div className="relative h-[300px] overflow-hidden bg-[#070b11]">
              <div className="absolute inset-0 grid-bg opacity-30" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(124,247,196,0.07),transparent_45%)]" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                {links.map((link, index) => {
                  const a = position(link.from.districtId);
                  const b = position(link.to.districtId);
                  const color = statusColor(link.to.status);
                  return (
                    <g key={index}>
                      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeOpacity="0.12" strokeWidth="1.6" />
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={color}
                        strokeOpacity="0.55"
                        strokeWidth="0.45"
                        strokeDasharray="1.4 2.2"
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  );
                })}
                {state.districts.map((district) => {
                  const p = position(district.id);
                  return (
                    <g key={district.id}>
                      <rect x={district.x} y={district.y} width={district.w} height={district.h} fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="0.4" />
                      <text x={p.x} y={p.y + 6.5} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="2.3" fontFamily="monospace" letterSpacing="0.25">
                        {district.name.toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {isp.nodes.map((n) => {
                const p = position(n.districtId);
                const color = statusColor(n.status);
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n.id)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <span
                      className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 transition group-hover:opacity-40"
                      style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
                    />
                    <span
                      className="relative flex h-8 w-8 items-center justify-center rounded-lg border bg-[#0a0f18] transition group-hover:scale-110"
                      style={{ borderColor: `${color}70`, color, boxShadow: `0 0 18px ${color}25` }}
                    >
                      <Server size={13} />
                      <span
                        className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full"
                        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                      />
                    </span>
                    <div className="mt-1.5 whitespace-nowrap rounded border border-white/[0.08] bg-black/60 px-1.5 py-0.5 font-mono text-[6.5px] uppercase tracking-wider text-white/55 backdrop-blur">
                      {n.name} · {n.latency}ms
                    </div>
                  </button>
                );
              })}

              <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-white/[0.07] bg-black/50 px-2.5 py-1.5 backdrop-blur">
                {["online", "degraded", "offline"].map((status) => (
                  <span key={status} className="flex items-center gap-1 font-mono text-[7px] uppercase tracking-wider text-white/35">
                    <span className="h-1 w-1 rounded-full" style={{ background: statusColor(status) }} /> {status}
                  </span>
                ))}
              </div>
              <div className="absolute right-3 top-3 rounded-md border border-white/[0.07] bg-black/50 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-white/30">
                AS-4829 · {fmtNum(totalCapacity)} Gbps
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Edge inventory</Label>
                <div className="mt-1 text-[13px] text-white/80">Node performance</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setBuildOpen(true)}>
                <Plus size={11} /> Expand
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Node</th>
                    <th className="px-3 py-2.5 font-normal">District</th>
                    <th className="px-3 py-2.5 font-normal">Load</th>
                    <th className="px-3 py-2.5 font-normal">Health</th>
                    <th className="px-3 py-2.5 font-normal">Latency</th>
                    <th className="px-3 py-2.5 font-normal">Tier</th>
                    <th className="px-3 py-2.5 font-normal">Status</th>
                    <th className="px-3 py-2.5 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {isp.nodes.map((n) => {
                    const district = state.districts.find((d) => d.id === n.districtId);
                    const loadPct = (n.load / Math.max(1, n.capacity)) * 100;
                    return (
                      <tr key={n.id} className="table-row">
                        <td className="px-4 py-2.5">
                          <button onClick={() => setSelectedNode(n.id)} className="flex items-center gap-2 text-left">
                            <Server size={11} className="text-white/25" />
                            <span className="font-mono text-[8.5px] text-white/60">{n.name}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 text-[9px] text-white/40">{district?.name}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={loadPct} color={loadPct > 92 ? "#FF6B6B" : loadPct > 75 ? "#F5C451" : "#7CF7C4"} height={3} className="w-16" />
                            <span className="num text-[8px] text-white/35">{loadPct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Progress value={n.health} color={n.health < 50 ? "#FF6B6B" : "#7CF7C4"} height={3} className="w-14" />
                            <span className="num text-[8px] text-white/35">{n.health.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">{n.latency}ms</td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/45">T{n.tier}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-mono text-[7px] uppercase tracking-wider" style={{ color: statusColor(n.status) }}>
                            {n.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            onClick={() => setSelectedNode(n.id)}
                            className="rounded border border-white/10 px-2 py-1 font-mono text-[7px] uppercase tracking-wider text-white/35 transition hover:border-mint/30 hover:text-mint"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Wholesale pricing</Label>
                <div className="mt-1 text-[13px] text-white/80">Bandwidth yield</div>
              </div>
              <Gauge size={13} className="text-white/25" />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <div className="num text-[28px] text-white">${priceDraft.toFixed(2)}</div>
                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-white/25">per gigabyte</div>
              </div>
              <div className="text-right">
                <div className="num text-[12px] text-mint">{fmtMoney(revenue)}</div>
                <div className="text-[8px] text-white/25">revenue / tick</div>
              </div>
            </div>
            <input
              type="range"
              min={0.08}
              max={2.5}
              step={0.01}
              value={priceDraft}
              onChange={(e) => setPriceDraft(Number(e.target.value))}
              onMouseUp={() => dispatch({ type: "SET_ISP_PRICE", value: priceDraft })}
              onTouchEnd={() => dispatch({ type: "SET_ISP_PRICE", value: priceDraft })}
              className="mt-3 w-full accent-mint"
            />
            <div className="flex justify-between font-mono text-[7px] text-white/20">
              <span>$0.08</span>
              <span>$2.50</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="label">Subscribers</div>
                <div className="num mt-1 text-[12px] text-white/65">{fmtCompact(isp.subscribers)}</div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="label">Reputation</div>
                <div className="num mt-1 text-[12px] text-white/65">{isp.reputation.toFixed(0)}/100</div>
              </div>
            </div>
            <Button variant="primary" size="sm" className="mt-2 w-full" onClick={() => dispatch({ type: "SET_ISP_PRICE", value: priceDraft })}>
              <Zap size={11} /> Apply price
            </Button>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Capacity allocation</Label>
                <div className="mt-1 text-[13px] text-white/80">District utilization</div>
              </div>
              <Network size={13} className="text-white/25" />
            </div>
            <div className="mt-3 space-y-2.5">
              {isp.nodes.map((n) => {
                const district = state.districts.find((d) => d.id === n.districtId);
                const pct = (n.load / Math.max(1, n.capacity)) * 100;
                return (
                  <div key={n.id}>
                    <div className="flex justify-between text-[9px]">
                      <span className="text-white/35">{district?.name}</span>
                      <span className="num text-white/50">{pct.toFixed(0)}%</span>
                    </div>
                    <Progress value={pct} color={pct > 92 ? "#FF6B6B" : pct > 75 ? "#F5C451" : "#7CF7C4"} height={3} className="mt-1" />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <MiniBars data={[40, 55, 48, 61, 58, 72, 68, 79, 74, 82, 76, 88]} color="#B69CFF" height={38} className="flex-1" />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[7px] uppercase tracking-wider text-white/20">
              <span>06:00</span>
              <span>Now</span>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Digital economy</Label>
                <div className="mt-1 text-[13px] text-white/80">Dependency chain</div>
              </div>
              <Cpu size={13} className="text-white/25" />
            </div>
            <div className="mt-3 space-y-2">
              {[
                { label: "Mining uptime", value: `${(isp.uptime * 0.98).toFixed(2)}%`, icon: <Cpu size={10} />, color: "#F5C451" },
                { label: "DEX execution", value: `${Math.max(1, avgLatency * 0.55).toFixed(1)}ms`, icon: <CircuitBoard size={10} />, color: "#7CF7C4" },
                { label: "Enterprise SLA", value: avgLatency < 10 ? "OPTIMAL" : "AT RISK", icon: <ShieldCheck size={10} />, color: avgLatency < 10 ? "#7CF7C4" : "#FF6B6B" },
                { label: "Node maintenance", value: `${isp.nodes.filter((n) => n.health < 60).length} due`, icon: <Wrench size={10} />, color: "#FF8FB1" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[9px] text-white/35">
                    {row.icon} {row.label}
                  </span>
                  <span className="num text-[9px]" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={!!node}
        onClose={() => setSelectedNode(null)}
        title={node?.name ?? "Node"}
        subtitle={node ? `${state.districts.find((d) => d.id === node.districtId)?.name} · Tier ${node.tier}` : ""}
      >
        {node && (
          <div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Capacity", `${node.capacity} Gb`],
                ["Current load", `${node.load.toFixed(0)} Gb`],
                ["Health", `${node.health.toFixed(0)}%`],
                ["Latency", `${node.latency} ms`],
                ["Status", node.status.toUpperCase()],
                ["Tier", `T${node.tier} / 5`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="label">{label}</div>
                  <div className="num mt-1 text-[13px] text-white/75">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <div className="mb-1 flex justify-between text-[9px] text-white/35">
                  <span>Load</span>
                  <span className="num">{(node.load / Math.max(1, node.capacity) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(node.load / Math.max(1, node.capacity)) * 100} color="#B69CFF" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[9px] text-white/35">
                  <span>Health</span>
                  <span className="num">{node.health.toFixed(0)}%</span>
                </div>
                <Progress value={node.health} color={node.health < 50 ? "#FF6B6B" : "#7CF7C4"} />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  dispatch({ type: "REPAIR_NODE", nodeId: node.id });
                  setSelectedNode(null);
                }}
              >
                <Wrench size={11} /> Repair
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  dispatch({ type: "UPGRADE_NODE", nodeId: node.id });
                  setSelectedNode(null);
                }}
              >
                <ArrowRight size={11} /> Upgrade · {fmtMoney(220_000 * node.tier)}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={buildOpen} onClose={() => setBuildOpen(false)} title="Build an edge node" subtitle="Lay fibre into an unserved district. Cost: $450,000.">
        <div className="label mb-1.5">Target district</div>
        <select className="field" value={buildDistrict} onChange={(e) => setBuildDistrict(e.target.value)}>
          {state.districts.map((d) => (
            <option key={d.id} value={d.id} disabled={state.isp.nodes.some((n) => n.districtId === d.id)}>
              {d.name} — {d.type} {state.isp.nodes.some((n) => n.districtId === d.id) ? "(served)" : ""}
            </option>
          ))}
        </select>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="label">Capacity</div>
            <div className="num mt-1 text-[13px] text-white/70">50 Gb</div>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
            <div className="label">Build cost</div>
            <div className="num mt-1 text-[13px] text-white/70">$450K</div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setBuildOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              dispatch({ type: "BUILD_NODE", districtId: buildDistrict });
              setBuildOpen(false);
            }}
          >
            <Cable size={11} /> Break ground
          </Button>
        </div>
      </Modal>
    </div>
  );
}
