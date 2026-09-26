import { useState, useEffect } from "react";
import { resolveClubSearchTerm } from "@/lib/clubAliases";

// Cadastre-se gratuitamente em https://www.thesportsdb.com/api.php e coloque
// sua chave em VITE_THESPORTSDB_KEY no .env (a chave de teste "123" foi
// descontinuada e hoje não retorna mais badges).
const THESPORTSDB_KEY = import.meta.env.VITE_THESPORTSDB_KEY || "3";

// Suba esse número sempre que mudar a lógica de busca/escolha do time — isso
// invalida automaticamente qualquer cache antigo salvo no navegador do usuário,
// sem precisar pedir pra ele limpar o localStorage manualmente.
const CACHE_VERSION = "v2";

type TheSportsDbTeam = {
  strTeam?: string;
  strSport?: string;
  strBadge?: string | null;
  intLoved?: string | null;
};

const memoryCache = new Map<string, string | null>();

function storageKey(name: string) {
  return `teamBadge:${CACHE_VERSION}:${name}`;
}

function readFromStorage(name: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(storageKey(name));
    if (raw === null) return undefined;
    return raw === "null" ? null : raw;
  } catch {
    return undefined;
  }
}

function writeToStorage(name: string, url: string | null) {
  try {
    localStorage.setItem(storageKey(name), url ?? "null");
  } catch {
    // modo privado, quota cheia, etc — ignora
  }
}

/**
 * Entre vários times com nomes parecidos (ex.: "Arsenal" existe na Inglaterra,
 * na Rússia e na Argentina), escolhe o mais provável:
 * 1) nome exatamente igual ao termo buscado
 * 2) só times de futebol (descarta clubes de outros esportes com o mesmo nome)
 * 3) o mais "popular" (intLoved), que costuma ser o time profissional relevante
 */
function pickBestTeam(teams: TheSportsDbTeam[], query: string): TheSportsDbTeam | null {
  if (!teams || teams.length === 0) return null;

  const soccerTeams = teams.filter((t) => t.strSport === "Soccer");
  const pool = soccerTeams.length > 0 ? soccerTeams : teams;

  const q = query.trim().toLowerCase();
  const exact = pool.find((t) => t.strTeam?.trim().toLowerCase() === q);
  if (exact) return exact;

  const sorted = [...pool].sort(
    (a, b) => (Number(b.intLoved) || 0) - (Number(a.intLoved) || 0),
  );
  return sorted[0] ?? null;
}

export function useTeamBadge(teamName?: string) {
  const [badgeUrl, setBadgeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teamName) {
      setBadgeUrl(null);
      return;
    }

    if (memoryCache.has(teamName)) {
      setBadgeUrl(memoryCache.get(teamName)!);
      return;
    }

    const stored = readFromStorage(teamName);
    if (stored !== undefined) {
      memoryCache.set(teamName, stored);
      setBadgeUrl(stored);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const searchTerm = resolveClubSearchTerm(teamName);
    const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(searchTerm)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const best = pickBestTeam(data?.teams ?? [], searchTerm);
        const badge: string | null = best?.strBadge || null;
        if (!badge) {
          // Ajuda a diagnosticar: chave inválida, apelido sem alias cadastrado, etc.
          console.warn(
            `[useTeamBadge] Sem badge para "${teamName}" (buscado como "${searchTerm}"). Resposta:`,
            data,
          );
        }
        memoryCache.set(teamName, badge);
        writeToStorage(teamName, badge);
        setBadgeUrl(badge);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[useTeamBadge] Falha ao buscar "${teamName}":`, err);
        memoryCache.set(teamName, null);
        setBadgeUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamName]);

  return { badgeUrl, loading };
}
