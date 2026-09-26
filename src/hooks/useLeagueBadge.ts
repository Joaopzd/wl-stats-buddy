import { useState, useEffect } from "react";
import { resolveLeagueSearchTerm } from "@/lib/leagueAliases";

const THESPORTSDB_KEY = import.meta.env.VITE_THESPORTSDB_KEY || "3";

// Suba junto com CACHE_VERSION do useTeamBadge se mudar a lógica de resolução.
const CACHE_VERSION = "v1";
const ALL_LEAGUES_STORAGE_KEY = `sdbAllLeagues:${CACHE_VERSION}`;

type LeagueListEntry = { idLeague: string; strLeague: string; strSport: string };

const badgeMemoryCache = new Map<string, string | null>();
const inFlightBadgeRequests = new Map<string, Promise<string | null>>();

let allLeaguesPromise: Promise<LeagueListEntry[]> | null = null;

function badgeStorageKey(name: string) {
  return `leagueBadge:${CACHE_VERSION}:${name}`;
}

function readBadgeFromStorage(name: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(badgeStorageKey(name));
    if (raw === null) return undefined;
    return raw === "null" ? null : raw;
  } catch {
    return undefined;
  }
}

function writeBadgeToStorage(name: string, url: string | null) {
  try {
    localStorage.setItem(badgeStorageKey(name), url ?? "null");
  } catch {
    // ignora (modo privado, quota, etc.)
  }
}

/** Busca (e cacheia) a lista completa de ligas — usada só pra achar o idLeague pelo nome. */
function getAllLeagues(): Promise<LeagueListEntry[]> {
  if (allLeaguesPromise) return allLeaguesPromise;

  allLeaguesPromise = (async () => {
    try {
      const cached = localStorage.getItem(ALL_LEAGUES_STORAGE_KEY);
      if (cached) return JSON.parse(cached) as LeagueListEntry[];
    } catch {
      // ignora e busca de novo
    }

    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/all_leagues.php`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const leagues: LeagueListEntry[] = data?.leagues ?? [];

    try {
      localStorage.setItem(ALL_LEAGUES_STORAGE_KEY, JSON.stringify(leagues));
    } catch {
      // ignora
    }
    return leagues;
  })();

  return allLeaguesPromise;
}

function findLeagueId(leagues: LeagueListEntry[], query: string): string | null {
  const q = query.trim().toLowerCase();
  const exact = leagues.find((l) => l.strLeague?.trim().toLowerCase() === q);
  if (exact) return exact.idLeague;

  const partial = leagues.find(
    (l) =>
      l.strSport === "Soccer" &&
      (l.strLeague?.toLowerCase().includes(q) || q.includes(l.strLeague?.toLowerCase() ?? "\0")),
  );
  return partial?.idLeague ?? null;
}

/** Escudos de liga variam por temporada — pega a badge não-nula mais recente disponível. */
async function fetchLatestSeasonBadge(leagueId: string): Promise<string | null> {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/search_all_seasons.php?badge=1&id=${leagueId}`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const seasons: { strBadge?: string | null }[] = data?.seasons ?? [];
  for (let i = seasons.length - 1; i >= 0; i--) {
    if (seasons[i].strBadge) return seasons[i].strBadge as string;
  }
  return null;
}

async function resolveLeagueBadge(leagueName: string): Promise<string | null> {
  const searchTerm = resolveLeagueSearchTerm(leagueName);
  const leagues = await getAllLeagues();
  const id = findLeagueId(leagues, searchTerm);
  if (!id) {
    console.warn(`[useLeagueBadge] Liga "${leagueName}" (buscada como "${searchTerm}") não encontrada na lista.`);
    return null;
  }
  const badge = await fetchLatestSeasonBadge(id);
  if (!badge) {
    console.warn(`[useLeagueBadge] Liga "${leagueName}" encontrada (id ${id}) mas sem badge em nenhuma temporada.`);
  }
  return badge;
}

export function useLeagueBadge(leagueName?: string) {
  const [badgeUrl, setBadgeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!leagueName) {
      setBadgeUrl(null);
      return;
    }

    if (badgeMemoryCache.has(leagueName)) {
      setBadgeUrl(badgeMemoryCache.get(leagueName)!);
      return;
    }

    const stored = readBadgeFromStorage(leagueName);
    if (stored !== undefined) {
      badgeMemoryCache.set(leagueName, stored);
      setBadgeUrl(stored);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Evita disparar a mesma busca várias vezes quando vários cards da mesma
    // liga renderizam ao mesmo tempo (ex.: uma lista de jogadores).
    let promise = inFlightBadgeRequests.get(leagueName);
    if (!promise) {
      promise = resolveLeagueBadge(leagueName).catch((err) => {
        console.error(`[useLeagueBadge] Falha ao buscar "${leagueName}":`, err);
        return null;
      });
      inFlightBadgeRequests.set(leagueName, promise);
      promise.finally(() => inFlightBadgeRequests.delete(leagueName));
    }

    promise.then((badge) => {
      if (cancelled) return;
      badgeMemoryCache.set(leagueName, badge);
      writeBadgeToStorage(leagueName, badge);
      setBadgeUrl(badge);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [leagueName]);

  return { badgeUrl, loading };
}
