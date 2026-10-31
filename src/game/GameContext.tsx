import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { GameState } from "../types";
import { createInitialState } from "./seed";
import { gameReducer, type Action } from "./reducer";
import { loadSave, persistSave } from "./storage";
import { requestWorldEvent } from "./ai";

interface GameContextValue {
  state: GameState;
  dispatch: (action: Action) => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    () => (loadSave() as GameState | null) ?? createInitialState(),
  );
  const aiTickRef = useRef(0);
  const aiInFlight = useRef(false);

  // Core simulation clock.
  useEffect(() => {
    if (state.world.paused) return;
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), 5_500);
    return () => window.clearInterval(timer);
  }, [state.world.paused]);

  // Persist every mutation so a refresh never loses an empire.
  useEffect(() => {
    persistSave(state);
  }, [state]);

  // Auto-dismiss the oldest toast.
  useEffect(() => {
    if (state.toasts.length === 0) return;
    const timer = window.setTimeout(
      () => dispatch({ type: "DISMISS_TOAST", id: state.toasts[0].id }),
      5_200,
    );
    return () => window.clearTimeout(timer);
  }, [state.toasts]);

  // Ask the Grok world engine for an event every 12 ticks. The local Dungeon
  // Master has already been generating events in the meantime.
  useEffect(() => {
    const tick = state.world.tick;
    if (tick === 0 || tick % 12 !== 0 || state.world.paused) return;
    if (aiTickRef.current === tick || aiInFlight.current) return;
    aiTickRef.current = tick;
    aiInFlight.current = true;
    requestWorldEvent(state)
      .then((event) => {
        if (event) dispatch({ type: "APPLY_AI_EVENT", event });
      })
      .finally(() => {
        aiInFlight.current = false;
      });
  }, [state]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, reset }}>{children}</GameContext.Provider>
  );
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error("useGame must be used inside GameProvider");
  return value;
}
