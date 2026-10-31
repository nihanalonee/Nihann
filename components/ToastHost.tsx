"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useGame } from "./GameProvider";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS = {
  success: "#63f7c3",
  error: "#ff625c",
  info: "#8fa8ff",
  warning: "#ffb454",
};

export function ToastHost() {
  const { state, dismissToast } = useGame();
  if (!state?.toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-[100] flex w-[min(360px,calc(100vw-24px))] flex-col gap-2 sm:bottom-5 sm:right-5">
      {state.toasts.map((toast) => {
        const Icon = ICONS[toast.kind];
        const color = COLORS[toast.kind];
        return (
          <div
            key={toast.id}
            className="toast-in pointer-events-auto relative overflow-hidden rounded-xl border border-line-bright/70 bg-panel/95 p-3.5 pr-9 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} strokeWidth={1.8} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-tight text-ink">{toast.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="absolute right-2 top-2 rounded p-1 text-dim transition-colors hover:bg-white/5 hover:text-ink"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute inset-x-0 bottom-0 h-[2px]" style={{ background: color, opacity: 0.45 }} />
          </div>
        );
      })}
    </div>
  );
}
