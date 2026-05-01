import { useSyncExternalStore } from "react";
import type { Match, Player, WeekendLeague } from "./types";

// Bumped to v4: custom WL names, removed off/def actions,
// added match flags (ET / penalties / rage quit). Old data wiped on first load.
const KEYS = {
  players: "fc26_players_v4",
  wls: "fc26_wls_v4",
  matches: "fc26_matches_v4",
  clubCrest: "fc26_club_crest_v1",
  clubName: "fc26_club_name_v1",
} as const;

const LEGACY_KEYS = [
  "fc26_players", "fc26_wls", "fc26_matches",
  "fc26_players_v2", "fc26_wls_v2", "fc26_matches_v2",
  "fc26_players_v3", "fc26_wls_v3", "fc26_matches_v3",
];
const MIGRATION_FLAG = "fc26_schema_v4_migrated";
if (typeof window !== "undefined") {
  try {
    if (!localStorage.getItem(MIGRATION_FLAG)) {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(MIGRATION_FLAG, "1");
    }
  } catch {
    /* ignore */
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => {
  // invalidate caches before notifying
  cache.players = null;
  cache.wls = null;
  cache.matches = null;
  listeners.forEach((l) => l());
};
const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const isBrowser = typeof window !== "undefined";

const EMPTY_PLAYERS: Player[] = [];
const EMPTY_WLS: WeekendLeague[] = [];
const EMPTY_MATCHES: Match[] = [];

// Stable snapshot cache — useSyncExternalStore requires the same reference
// when data hasn't changed, otherwise React loops infinitely.
const cache: {
  players: Player[] | null;
  wls: WeekendLeague[] | null;
  matches: Match[] | null;
  clubCrest: string | null | undefined;
  clubName: string | null | undefined;
} = { players: null, wls: null, matches: null, clubCrest: undefined, clubName: undefined };

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

function getPlayers(): Player[] {
  if (!isBrowser) return EMPTY_PLAYERS;
  if (cache.players === null) cache.players = read<Player[]>(KEYS.players, EMPTY_PLAYERS);
  return cache.players;
}
function getWLs(): WeekendLeague[] {
  if (!isBrowser) return EMPTY_WLS;
  if (cache.wls === null) cache.wls = read<WeekendLeague[]>(KEYS.wls, EMPTY_WLS);
  return cache.wls;
}
function getMatches(): Match[] {
  if (!isBrowser) return EMPTY_MATCHES;
  if (cache.matches === null) cache.matches = read<Match[]>(KEYS.matches, EMPTY_MATCHES);
  return cache.matches;
}

export const store = {
  getPlayers,
  getWLs,
  getMatches,

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

  getClubCrest: (): string | null => {
    if (!isBrowser) return null;
    if (cache.clubCrest === undefined) {
      try { cache.clubCrest = localStorage.getItem(KEYS.clubCrest); }
      catch { cache.clubCrest = null; }
    }
    return cache.clubCrest;
  },
  setClubCrest: (dataUrl: string | null) => {
    if (!isBrowser) return;
    if (dataUrl) localStorage.setItem(KEYS.clubCrest, dataUrl);
    else localStorage.removeItem(KEYS.clubCrest);
    cache.clubCrest = dataUrl;
    listeners.forEach((l) => l());
  },

  getClubName: (): string => {
    if (!isBrowser) return "";
    if (cache.clubName === undefined) {
      try { cache.clubName = localStorage.getItem(KEYS.clubName); }
      catch { cache.clubName = null; }
    }
    return cache.clubName ?? "";
  },
  setClubName: (name: string) => {
    if (!isBrowser) return;
    const trimmed = name.trim();
    if (trimmed) localStorage.setItem(KEYS.clubName, trimmed);
    else localStorage.removeItem(KEYS.clubName);
    cache.clubName = trimmed || null;
    listeners.forEach((l) => l());
  },
};

// cross-tab sync
if (isBrowser) {
  window.addEventListener("storage", emit);
}

function useStoreSlice<T>(getter: () => T, serverFallback: T): T {
  return useSyncExternalStore(subscribe, getter, () => serverFallback);
}

export const usePlayers = () => useStoreSlice(store.getPlayers, EMPTY_PLAYERS);
export const useWLs = () => useStoreSlice(store.getWLs, EMPTY_WLS);
export const useMatches = () => useStoreSlice(store.getMatches, EMPTY_MATCHES);
export const useClubCrest = () =>
  useStoreSlice<string | null>(() => store.getClubCrest(), null);
export const useClubName = () =>
  useStoreSlice<string>(() => store.getClubName(), "");
