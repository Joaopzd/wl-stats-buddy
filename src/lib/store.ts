import { useSyncExternalStore } from "react";
import type { Match, Player, WeekendLeague } from "./types";

const KEYS = {
  players: "fc26_players",
  wls: "fc26_wls",
  matches: "fc26_matches",
} as const;

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const isBrowser = typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser) return;
  localStorage.setItem(key, JSON.stringify(value));
  emit();
}

export const store = {
  getPlayers: (): Player[] => read(KEYS.players, []),
  getWLs: (): WeekendLeague[] => read(KEYS.wls, []),
  getMatches: (): Match[] => read(KEYS.matches, []),

  setPlayers: (p: Player[]) => write(KEYS.players, p),
  setWLs: (w: WeekendLeague[]) => write(KEYS.wls, w),
  setMatches: (m: Match[]) => write(KEYS.matches, m),

  addPlayer: (p: Player) => store.setPlayers([...store.getPlayers(), p]),
  updatePlayer: (id: string, patch: Partial<Player>) =>
    store.setPlayers(store.getPlayers().map((x) => (x.id === id ? { ...x, ...patch } : x))),
  deletePlayer: (id: string) =>
    store.setPlayers(store.getPlayers().filter((x) => x.id !== id)),

  addWL: (w: WeekendLeague) => store.setWLs([...store.getWLs(), w]),
  updateWL: (id: string, patch: Partial<WeekendLeague>) =>
    store.setWLs(store.getWLs().map((x) => (x.id === id ? { ...x, ...patch } : x))),
  deleteWL: (id: string) => {
    store.setWLs(store.getWLs().filter((x) => x.id !== id));
    store.setMatches(store.getMatches().filter((m) => m.wlId !== id));
  },

  addMatch: (m: Match) => store.setMatches([...store.getMatches(), m]),
  updateMatch: (id: string, patch: Partial<Match>) =>
    store.setMatches(store.getMatches().map((x) => (x.id === id ? { ...x, ...patch } : x))),
  deleteMatch: (id: string) =>
    store.setMatches(store.getMatches().filter((x) => x.id !== id)),
};

// cross-tab sync
if (isBrowser) {
  window.addEventListener("storage", emit);
}

function useStoreSlice<T>(getter: () => T): T {
  return useSyncExternalStore(
    subscribe,
    getter,
    getter,
  );
}

export const usePlayers = () => useStoreSlice(store.getPlayers);
export const useWLs = () => useStoreSlice(store.getWLs);
export const useMatches = () => useStoreSlice(store.getMatches);
