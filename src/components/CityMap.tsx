import { Building2, MapPin, Shield, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { useGame } from "../game/GameContext";
import { fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { Badge, Button, Modal, Progress } from "./ui";
import { cn } from "../lib/cn";

export function CityMap({ compact = false }: { compact?: boolean }) {
  const { state, dispatch } = useGame();
  const [selected, setSelected] = useState<string | null>(null);
  const district = state.districts.find((d) => d.id === selected);

  return (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#070b11]",
          compact ? "h-[240px]" : "h-[290px]",
        )}
      >
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(124,247,196,0.08),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(245,196,81,0.06),transparent_30%)]" />
        {/* river */}
        <div className="absolute -left-10 top-[52%] h-16 w-[125%] -rotate-6 bg-gradient-to-r from-[#0b1c25]/80 via-[#0a1820]/90 to-[#0b1c25]/50 blur-[1px]" />
        <div className="absolute -left-10 top-[51.5%] h-px w-[125%] -rotate-6 bg-blue/20" />
        <div className="absolute -left-10 top-[56%] h-px w-[125%] -rotate-6 bg-blue/10" />
        {/* roads */}
        {[22, 48, 74].map((top) => (
          <div key={top} className="absolute left-0 h-px w-full bg-white/[0.055]" style={{ top: `${top}%` }} />
        ))}
        {[32, 66].map((left) => (
          <div key={left} className="absolute top-0 h-full w-px bg-white/[0.055]" style={{ left: `${left}%` }} />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(6,8,13,0.4),transparent_30%)]" />

        {state.districts.map((d, index) => {
          const change = ((d.price - d.basePrice) / d.basePrice) * 100;
          return (
            <button
              key={d.id}
              onClick={() => setSelected(d.id)}
              className={cn(
                "group absolute overflow-hidden rounded-md border p-2 text-left transition-all duration-300 hover:z-20 hover:scale-[1.025]",
                d.owned
                  ? "border-mint/40 bg-mint/[0.07] shadow-[0_0_28px_rgba(124,247,196,0.08)]"
                  : "border-white/[0.12] bg-white/[0.025] hover:border-white/30",
              )}
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: `${d.w}%`,
                height: `${d.h}%`,
                backgroundImage: `linear-gradient(135deg, ${d.color}20, transparent 55%), repeating-linear-gradient(90deg, transparent 0 8px, ${d.color}08 8px 9px)`,
              }}
            >
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-medium leading-tight text-white/90 md:text-[11px]">
                      {d.name}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-[6.5px] uppercase tracking-[0.16em] text-white/35 md:text-[7px]">
                      {d.type}
                    </div>
                  </div>
                  {d.owned ? (
                    <span className="rounded bg-mint/20 px-1 py-0.5 font-mono text-[6px] uppercase tracking-wider text-mint">
                      OWNED
                    </span>
                  ) : (
                    <span className="font-mono text-[6px] text-white/20">0{index + 1}</span>
                  )}
                </div>
                <div>
                  <div className="num text-[9px] text-white/75 md:text-[10px]">{fmtMoney(d.price, 1)}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={cn(
                        "num text-[6.5px]",
                        change >= 0 ? "text-mint/60" : "text-danger/60",
                      )}
                    >
                      {fmtPct(change, 1)}
                    </span>
                    <span className="font-mono text-[6px] text-white/20">CRIME {Math.round(d.crime)}</span>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute bottom-0 left-0 flex h-6 w-full items-end gap-[2px] opacity-20">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-white"
                    style={{ height: `${20 + ((i * 37 + index * 13) % 80)}%` }}
                  />
                ))}
              </div>
            </button>
          );
        })}

        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md border border-white/[0.07] bg-black/50 px-2 py-1 backdrop-blur-md">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-mint" />
          <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-white/45">
            District feed live
          </span>
        </div>
        <div className="absolute bottom-2 right-2 font-mono text-[6.5px] uppercase tracking-[0.18em] text-white/20">
          Grid 04 · Sector 12
        </div>
      </div>

      <Modal
        open={!!district}
        onClose={() => setSelected(null)}
        title={district?.name ?? "District"}
        subtitle={`${district?.type} · District registry`}
      >
        {district && (
          <div>
            <p className="text-[12px] leading-relaxed text-white/50">{district.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { label: "Appraised value", value: fmtMoney(district.price, 2), icon: <Building2 size={11} /> },
                { label: "Monthly yield", value: fmtMoney(district.income, 0), icon: <TrendingUp size={11} /> },
                { label: "Crime index", value: `${Math.round(district.crime)}/100`, icon: <Shield size={11} /> },
                { label: "Demand", value: `${Math.round(district.demand)}/100`, icon: <Users size={11} /> },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                  <div className="label flex items-center gap-1.5">
                    {item.icon} {item.label}
                  </div>
                  <div className="num mt-1.5 text-[14px] text-white/85">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <div>
                <div className="mb-1 flex justify-between text-[9px] text-white/35">
                  <span>Demand</span>
                  <span className="num">{Math.round(district.demand)}%</span>
                </div>
                <Progress value={district.demand} color="#7CF7C4" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[9px] text-white/35">
                  <span>Police coverage</span>
                  <span className="num">{Math.round(district.police)}%</span>
                </div>
                <Progress value={district.police} color="#7FB2FF" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <Badge variant={district.owned ? "mint" : "gold"}>
                <MapPin size={9} /> {district.owned ? "Title deed held" : "Available"}
              </Badge>
              {district.owned ? (
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                  Portfolio asset
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    dispatch({ type: "BUY_PROPERTY", districtId: district.id });
                    setSelected(null);
                  }}
                >
                  Acquire for {fmtMoney(district.price * 1.02, 2)}
                </Button>
              )}
            </div>
            <div className="mt-3 font-mono text-[8px] uppercase tracking-wider text-white/20">
              District population {fmtNum(180_000 + district.demand * 2400)} · grid stability{" "}
              {Math.round(100 - district.crime * 0.4)}%
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
