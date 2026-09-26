import { useState, useEffect } from "react";

// Cadastre-se gratuitamente em https://www.thesportsdb.com/api.php e coloque
// sua chave em VITE_THESPORTSDB_KEY no .env (a chave de teste "123" foi
// descontinuada e hoje não retorna mais badges).
const THESPORTSDB_KEY = import.meta.env.VITE_THESPORTSDB_KEY || "3";

const memoryCache = new Map<string, string | null>();

function readFromStorage(name: string): string | null | undefined {
  try {
    const raw = localStorage.getItem(`teamBadge:${name}`);
    if (raw === null) return undefined;
    return raw === "null" ? null : raw;
  } catch {
    return undefined;
  }
}

function writeToStorage(name: string, url: string | null) {
  try {
    localStorage.setItem(`teamBadge:${name}`, url ?? "null");
  } catch {
    // modo privado, quota cheia, etc — ignora
  }
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

    const url = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const badge: string | null = data?.teams?.[0]?.strBadge || null;
        if (!badge) {
          // Ajuda a diagnosticar: chave inválida, time não encontrado, etc.
          console.warn(`[useTeamBadge] Sem badge para "${teamName}". Resposta:`, data);
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
