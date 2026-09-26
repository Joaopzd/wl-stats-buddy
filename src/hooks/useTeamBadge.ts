import { useState, useEffect } from "react";

const THESPORTSDB_KEY = "123"; // chave pública gratuita da TheSportsDB
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

    fetch(
      `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/searchteams.php?t=${encodeURIComponent(teamName)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const badge: string | null = data?.teams?.[0]?.strTeamBadge || null;
        memoryCache.set(teamName, badge);
        writeToStorage(teamName, badge);
        setBadgeUrl(badge);
      })
      .catch(() => {
        if (cancelled) return;
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
