import {
  AlertTriangle,
  Banknote,
  Check,
  CornerDownLeft,
  Droplets,
  Flame,
  Landmark,
  Lock,
  Power,
  RefreshCw,
  ShieldOff,
  Skull,
  Terminal as TerminalIcon,
  TrendingDown,
  TrendingUp,
  Trash2,
  Unlock,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Gauge } from "../components/charts";
import { Avatar, Badge, Button, Label, Modal, Panel, Progress } from "../components/ui";
import { useGame } from "../game/GameContext";
import { fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { cn } from "../lib/cn";

export function GodMode() {
  const { state, dispatch, reset } = useGame();
  const [email, setEmail] = useState("");
  const [command, setCommand] = useState("");
  const [terminal, setTerminal] = useState<string[]>([
    "OMNILIFE ROOT SHELL v1.0.7 — build 2026.10.31",
    "kernel: syndicate-world-engine · local persistence",
    "warning: this terminal can rewrite the simulation state.",
    "type `help` for available directives.",
  ]);
  const [purgeTarget, setPurgeTarget] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const worth = state.stats.netWorthHistory.at(-1) ?? state.player.cash;

  const log = (line: string) => setTerminal((lines) => [...lines.slice(-60), line]);

  const execute = (raw: string) => {
    const input = raw.trim();
    if (!input) return;
    const [base, arg] = input.toLowerCase().split(/\s+/);
    log(`root@omnilife:~$ ${input}`);
    switch (base) {
      case "help":
        log("spawn        credit $1,000,000,000");
        log("pump [asset]  +35% market-wide or target asset");
        log("crash [asset] -42% market-wide or target asset");
        log("amnesty      clear heat, warrants, regulatory pressure");
        log("bailout      recapitalise Helios Trust with $10M");
        log("liquidity    add $5M to every DEX pool");
        log("purge [id]   erase a rival entity");
        log("deflate      burn 50% of liquid cash");
        log("reset        reinitialise the timeline");
        log("clear        clear this terminal");
        break;
      case "spawn":
        dispatch({ type: "GOD", command: "spawn" });
        log("✓ treasury conjured: +$1,000,000,000");
        break;
      case "pump":
        dispatch({ type: "GOD", command: "pump", target: arg });
        log(arg ? `✓ ${arg.toUpperCase()} repriced +35%` : "✓ market-wide pump executed");
        break;
      case "crash":
        dispatch({ type: "GOD", command: "crash", target: arg });
        log(arg ? `✓ ${arg.toUpperCase()} repriced -42%` : "✓ market-wide crash executed");
        break;
      case "amnesty":
        dispatch({ type: "GOD", command: "amnesty" });
        log("✓ heat, warrants and regulatory pressure reset");
        break;
      case "bailout":
        dispatch({ type: "GOD", command: "bailout" });
        log("✓ Helios Trust recapitalised +$10,000,000");
        break;
      case "liquidity":
        dispatch({ type: "GOD", command: "liquidity" });
        log("✓ DEX pools deepened +$5,000,000 each");
        break;
      case "purge":
        if (!arg) {
          log("✗ usage: purge <entity-id>");
        } else {
          dispatch({ type: "GOD", command: "purge", target: arg });
          log(`✓ entity ${arg} erased from registry`);
        }
        break;
      case "deflate":
        dispatch({ type: "GOD", command: "deflate" });
        log("✓ 50% of liquid cash burned");
        break;
      case "reset":
        reset();
        log("✓ timeline reinitialised");
        break;
      case "clear":
        setTerminal([]);
        break;
      default:
        log(`✗ unknown directive: ${base}`);
    }
  };

  if (!state.player.isAdmin) {
    return (
      <div className="animate-fade-up flex min-h-[72vh] items-center justify-center py-8">
        <div className="w-full max-w-xl">
          <Panel className="scanline overflow-hidden border-gold/15">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <TerminalIcon size={13} className="text-gold" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold/70">root shell</span>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-wider text-white/25">access level omega</span>
            </div>
            <div className="p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.06] text-gold shadow-[0_0_50px_rgba(245,196,81,0.12)]">
                <Lock size={26} />
              </div>
              <div className="mt-4 label text-gold/60">restricted system</div>
              <h1 className="mt-1.5 text-[26px] text-white">Server Admin / God Terminal</h1>
              <p className="mx-auto mt-2 max-w-md text-[11.5px] leading-relaxed text-white/35">
                This terminal can spawn capital, rewrite markets, erase entities and reset the
                timeline. Identity is verified against the operator registry.
              </p>

              <div className="mx-auto mt-6 max-w-sm text-left">
                <div className="label mb-1.5">Operator email</div>
                <input
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && dispatch({ type: "ADMIN_UNLOCK", email })}
                  placeholder="operator@domain"
                  autoComplete="off"
                />
                <Button
                  variant="gold"
                  className="mt-2 w-full py-2.5"
                  onClick={() => dispatch({ type: "ADMIN_UNLOCK", email })}
                >
                  <Unlock size={12} /> Authenticate
                </Button>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-white/[0.06] bg-black/25 p-2.5">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0 text-gold/60" />
                  <p className="text-[9px] leading-relaxed text-white/25">
                    The authorised identity is the operator email defined in the master design
                    specification. This is a simulation mechanic, not real authentication.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-white/[0.06] px-4 py-3">
              <div className="flex items-center justify-between font-mono text-[7.5px] uppercase tracking-wider text-white/20">
                <span>trace: 0x8f2c...a91d</span>
                <span className="text-gold/40">secure enclave · offline</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const interventions = [
    { label: "Spawn $1B", desc: "Credit the treasury with one billion clean dollars.", icon: <Banknote size={15} />, color: "#7CF7C4", onClick: () => dispatch({ type: "GOD", command: "spawn" }) },
    { label: "Pump market", desc: "Reprice every listed asset upward by 35%.", icon: <TrendingUp size={15} />, color: "#7CF7C4", onClick: () => dispatch({ type: "GOD", command: "pump" }) },
    { label: "Crash market", desc: "Reprice every listed asset downward by 42%.", icon: <TrendingDown size={15} />, color: "#FF6B6B", onClick: () => dispatch({ type: "GOD", command: "crash" }) },
    { label: "Amnesty", desc: "Void all warrants, heat, and regulatory pressure.", icon: <ShieldOff size={15} />, color: "#B69CFF", onClick: () => dispatch({ type: "GOD", command: "amnesty" }) },
    { label: "Bank bailout", desc: "Recapitalise Helios Trust with $10M reserves.", icon: <Landmark size={15} />, color: "#F5C451", onClick: () => dispatch({ type: "GOD", command: "bailout" }) },
    { label: "Deepen liquidity", desc: "Add $5M to every crypto pool on OmniDEX.", icon: <Droplets size={15} />, color: "#7FB2FF", onClick: () => dispatch({ type: "GOD", command: "liquidity" }) },
    { label: "Burn cash", desc: "Destroy 50% of your liquid capital.", icon: <Flame size={15} />, color: "#FF8FB1", onClick: () => dispatch({ type: "GOD", command: "deflate" }) },
    { label: "Wipe rivals", desc: "Erase 90% of every rival balance sheet.", icon: <Skull size={15} />, color: "#FF6B6B", onClick: () => dispatch({ type: "GOD", command: "purge" }) },
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="label text-gold/70">RESTRICTED / ROOT ACCESS</span>
            <Badge variant="gold">
              <span className="h-1 w-1 animate-pulse-dot rounded-full bg-gold" /> GOD MODE
            </Badge>
          </div>
          <h1 className="mt-2 text-[30px] leading-none text-white md:text-[38px]">
            The God Terminal
          </h1>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-white/40">
            You are no longer playing the game. You are editing it. Every command is logged,
            irreversible, and immediately reflected in the simulation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-gold/20 bg-gold/[0.04] px-3 py-2">
            <div className="label text-gold/50">authenticated as</div>
            <div className="mt-0.5 font-mono text-[10px] text-gold/80">{state.player.email}</div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>
            <Power size={12} /> Reset world
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {[
          { label: "Liquid capital", value: fmtMoney(state.player.cash), sub: "clean funds", icon: <Banknote size={13} />, color: "#7CF7C4" },
          { label: "Net worth", value: fmtMoney(worth), sub: `${fmtNum(state.player.influence)} influence`, icon: <Zap size={13} />, color: "#F5C451" },
          { label: "World tick", value: `${state.world.tick}`, sub: `day ${state.world.day} · ${state.world.phase}`, icon: <RefreshCw size={13} />, color: "#B69CFF" },
          { label: "Entities", value: `${state.corporate.rivals.length + state.assets.length + 1}`, sub: `${state.corporate.rivals.length} rivals · ${state.assets.length} assets`, icon: <Skull size={13} />, color: "#FF6B6B" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="label">{stat.label}</div>
                <div className="num mt-2 text-[23px] leading-none text-white">{stat.value}</div>
                <div className="mt-2 text-[9.5px] text-white/30">{stat.sub}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: stat.color, borderColor: `${stat.color}25`, background: `${stat.color}0d` }}>
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
                <Label>Interventions</Label>
                <div className="mt-1 text-[13px] text-white/80">One-click world edits</div>
              </div>
              <Badge variant="gold">OMEGA CLEARANCE</Badge>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
              {interventions.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="panel panel-hover group p-3 text-left"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border" style={{ color: item.color, borderColor: `${item.color}25`, background: `${item.color}0d` }}>
                    {item.icon}
                  </span>
                  <div className="mt-2 text-[10px] text-white/70">{item.label}</div>
                  <div className="mt-0.5 text-[8px] leading-relaxed text-white/25">{item.desc}</div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Market override</Label>
                <div className="mt-1 text-[13px] text-white/80">Per-asset intervention</div>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-wider text-white/25">LIVE PRICE FEED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-white/[0.05] font-mono text-[7.5px] uppercase tracking-wider text-white/25">
                    <th className="px-4 py-2.5 font-normal">Asset</th>
                    <th className="px-3 py-2.5 font-normal">Price</th>
                    <th className="px-3 py-2.5 font-normal">24h</th>
                    <th className="px-3 py-2.5 font-normal">Supply</th>
                    <th className="px-3 py-2.5 font-normal">Override</th>
                  </tr>
                </thead>
                <tbody>
                  {state.assets.slice(0, 8).map((asset) => {
                    const change = ((asset.price - asset.prevClose) / asset.prevClose) * 100;
                    return (
                      <tr key={asset.id} className="table-row">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: asset.color }} />
                            <span className="text-[9.5px] text-white/60">{asset.name}</span>
                            <span className="font-mono text-[7.5px] text-white/25">{asset.ticker}</span>
                          </div>
                        </td>
                        <td className="num px-3 py-2.5 text-[9px] text-white/55">{fmtMoney(asset.price, 2)}</td>
                        <td className={cn("num px-3 py-2.5 text-[8.5px]", change >= 0 ? "text-mint/65" : "text-danger/65")}>{fmtPct(change)}</td>
                        <td className="num px-3 py-2.5 text-[8.5px] text-white/30">{asset.supply ? fmtNum(asset.supply) : "—"}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex gap-1">
                            <button
                              onClick={() => dispatch({ type: "GOD", command: "pump", target: asset.id })}
                              className="rounded border border-mint/20 bg-mint/[0.05] px-2 py-1 font-mono text-[7px] text-mint/70 transition hover:bg-mint/15"
                            >
                              +35%
                            </button>
                            <button
                              onClick={() => dispatch({ type: "GOD", command: "crash", target: asset.id })}
                              className="rounded border border-danger/20 bg-danger/[0.05] px-2 py-1 font-mono text-[7px] text-danger/70 transition hover:bg-danger/15"
                            >
                              -42%
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div>
                <Label>Entity registry</Label>
                <div className="mt-1 text-[13px] text-white/80">Rivals and balances</div>
              </div>
              <Badge variant="danger">{state.corporate.rivals.length} ENTITIES</Badge>
            </div>
            <div className="p-3">
              {state.corporate.rivals.map((rival) => (
                <div key={rival.id} className="flex items-center gap-2 border-b border-white/[0.04] py-2.5 last:border-0">
                  <Avatar initials={rival.ceo.slice(0, 2)} color={rival.color} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[10px] text-white/60">{rival.name}</div>
                    <div className="truncate font-mono text-[7px] uppercase tracking-wider text-white/20">{rival.ceo} · {rival.id}</div>
                  </div>
                  <span className="num text-[9.5px] text-white/45">{fmtMoney(rival.netWorth, 1)}</span>
                  <button
                    onClick={() => setPurgeTarget(rival.id)}
                    className="rounded border border-danger/15 p-1.5 text-danger/45 transition hover:border-danger/50 hover:text-danger"
                    aria-label={`Erase ${rival.name}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-3 xl:col-span-4">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <TerminalIcon size={13} className="text-mint" />
                <span className="label text-mint/60">Root shell</span>
              </div>
              <span className="font-mono text-[7px] uppercase tracking-wider text-white/20">connected</span>
            </div>
            <div className="h-[280px] overflow-y-auto bg-black/35 p-3 font-mono text-[9px] leading-relaxed">
              {terminal.map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    "whitespace-pre-wrap",
                    line.startsWith("✓") ? "text-mint/70" : line.startsWith("✗") ? "text-danger/70" : line.startsWith("root@") ? "text-gold/70" : "text-white/35",
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.06] p-2.5">
              <span className="font-mono text-[9px] text-mint/70">$</span>
              <input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    execute(command);
                    setCommand("");
                  }
                }}
                placeholder="help"
                className="w-full bg-transparent font-mono text-[9px] text-white outline-none placeholder:text-white/15"
              />
              <button
                onClick={() => { execute(command); setCommand(""); }}
                className="text-mint/50 transition hover:text-mint"
              >
                <CornerDownLeft size={12} />
              </button>
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>System health</Label>
                <div className="mt-1 text-[13px] text-white/80">Simulation integrity</div>
              </div>
              <Check size={13} className="text-mint/60" />
            </div>
            <div className="mt-2 flex flex-col items-center">
              <Gauge value={100} size={140} color="#F5C451" label="NOMINAL" sublabel="Kernel status" />
            </div>
            <div className="space-y-2">
              {[
                ["World engine", state.world.engineMode === "grok" ? "GROK LINK" : "LOCAL FALLBACK", state.world.engineMode === "grok" ? "#7CF7C4" : "#F5C451"],
                ["Persistence", "LOCAL VAULT", "#7CF7C4"],
                ["Tick cadence", "5.5s", "#7FB2FF"],
                ["State size", `${(JSON.stringify(state).length / 1024).toFixed(1)} KB`, "#B69CFF"],
              ].map(([label, value, color]) => (
                <div key={label} className="flex justify-between text-[8.5px]">
                  <span className="text-white/30">{label}</span>
                  <span className="num" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Danger zone</Label>
                <div className="mt-1 text-[13px] text-white/80">Irreversible actions</div>
              </div>
              <AlertTriangle size={13} className="text-danger/60" />
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-white/30">
              Resetting the timeline destroys every asset, corporation, district deed and warrant.
              There is no rollback.
            </p>
            <Button variant="danger" size="sm" className="mt-2 w-full" onClick={() => setResetOpen(true)}>
              <Power size={11} /> Reset world state
            </Button>
          </Panel>
        </div>
      </div>

      <Modal open={!!purgeTarget} onClose={() => setPurgeTarget(null)} title="Erase entity" subtitle="This removes the rival from the simulation permanently.">
        <div className="flex gap-3 rounded-lg border border-danger/20 bg-danger/[0.04] p-3">
          <Skull size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="text-[11px] leading-relaxed text-white/55">
            The entity's holdings, contracts, and market presence will be removed. This action is
            logged in the root shell and cannot be undone.
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPurgeTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (purgeTarget) dispatch({ type: "GOD", command: "purge", target: purgeTarget });
              setPurgeTarget(null);
            }}
          >
            <Trash2 size={11} /> Erase entity
          </Button>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset the timeline" subtitle="All progress will be lost.">
        <div className="flex gap-3 rounded-lg border border-danger/20 bg-danger/[0.04] p-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="text-[11px] leading-relaxed text-white/55">
            A new timeline will be created at Day 412. Your current empire, holdings, bank, media
            channels and criminal record will be erased. God mode will lock again.
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              reset();
              setResetOpen(false);
            }}
          >
            <Power size={11} /> Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
