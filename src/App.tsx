import { useCallback, useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { GameProvider } from "./game/GameContext";
import { Banking } from "./pages/Banking";
import { Corporate } from "./pages/Corporate";
import { GodMode } from "./pages/GodMode";
import { Government } from "./pages/Government";
import { Infrastructure } from "./pages/Infrastructure";
import { Market } from "./pages/Market";
import { Media } from "./pages/Media";
import { Overview } from "./pages/Overview";
import { Underworld } from "./pages/Underworld";
import { Wire } from "./pages/Wire";
import type { PageId } from "./types";

const PAGE_IDS: PageId[] = [
  "overview",
  "market",
  "banking",
  "infrastructure",
  "media",
  "underworld",
  "corporate",
  "government",
  "wire",
  "godmode",
];

function pageFromHash(): PageId {
  const id = window.location.hash.replace(/^#\/?/, "").trim() as PageId;
  return PAGE_IDS.includes(id) ? id : "overview";
}

export default function App() {
  const [page, setPage] = useState<PageId>(() => pageFromHash());

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const label = page.charAt(0).toUpperCase() + page.slice(1);
    document.title = `${label} · OmniLife: The Syndicate`;
  }, [page]);

  const navigate = useCallback((next: PageId) => {
    if (window.location.hash !== `#${next}`) {
      window.history.replaceState(null, "", `#${next}`);
    }
    setPage(next);
  }, []);

  const renderPage = () => {
    switch (page) {
      case "market":
        return <Market />;
      case "banking":
        return <Banking />;
      case "infrastructure":
        return <Infrastructure />;
      case "media":
        return <Media />;
      case "underworld":
        return <Underworld />;
      case "corporate":
        return <Corporate />;
      case "government":
        return <Government />;
      case "wire":
        return <Wire />;
      case "godmode":
        return <GodMode />;
      default:
        return <Overview onNavigate={navigate} />;
    }
  };

  return (
    <GameProvider>
      <AppShell page={page} setPage={navigate}>
        {renderPage()}
      </AppShell>
    </GameProvider>
  );
}
