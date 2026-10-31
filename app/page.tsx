"use client";

import { useGame } from "@/components/GameProvider";
import { Onboarding } from "@/components/Onboarding";
import { AppShell } from "@/components/AppShell";

export default function Home() {
  const { state, hydrated } = useGame();

  if (!hydrated || !state) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-acid" />
          <p className="mono text-[11px] uppercase tracking-[0.3em] text-muted">Booting the city</p>
        </div>
      </main>
    );
  }

  if (!state.started) return <Onboarding />;
  return <AppShell />;
}
