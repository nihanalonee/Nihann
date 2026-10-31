const STORAGE_KEY = "omnilife.syndicate.save.v1";

export function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed?.assets || !parsed?.player) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistSave(state: unknown) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private mode. The simulation still runs.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
