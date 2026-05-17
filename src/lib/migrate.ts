import { supabase } from "@/integrations/supabase/client";
import type { Match, Player, WeekendLeague } from "./types";

const LEGACY = {
  players: "fc26_players_v4",
  wls: "fc26_wls_v4",
  matches: "fc26_matches_v4",
  clubCrest: "fc26_club_crest_v1",
  clubName: "fc26_club_name_v1",
  opponentCrest: "fc26_opponent_crest_v1",
  opponentName: "fc26_opponent_name_v1",
};
const FLAG = "fc26_cloud_migrated_v1";
const BUCKET = "crests";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function uploadDataUrl(dataUrl: string, path: string): Promise<string | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const fullPath = `${path}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fullPath, blob, { upsert: true, contentType: blob.type });
    if (error) return null;
    return fullPath;
  } catch {
    return null;
  }
}

/** Detect + migrate legacy localStorage data. Idempotent (flag-gated). */
export async function migrateLocalToCloud(userId: string): Promise<{ migrated: boolean; counts?: { players: number; wls: number; matches: number } }> {
  if (typeof window === "undefined") return { migrated: false };
  if (localStorage.getItem(FLAG)) return { migrated: false };

  const players = readJSON<Player[]>(LEGACY.players, []);
  const wls = readJSON<WeekendLeague[]>(LEGACY.wls, []);
  const matches = readJSON<Match[]>(LEGACY.matches, []);
  const clubCrest = localStorage.getItem(LEGACY.clubCrest);
  const clubName = localStorage.getItem(LEGACY.clubName);
  const opponentCrest = localStorage.getItem(LEGACY.opponentCrest);
  const opponentName = localStorage.getItem(LEGACY.opponentName);

  const hasAny =
    players.length || wls.length || matches.length || clubCrest || clubName || opponentCrest || opponentName;
  if (!hasAny) {
    localStorage.setItem(FLAG, "1");
    return { migrated: false };
  }

  // Players (upload images one-by-one)
  const playerRows: Array<{ id: string; user_id: string; data: unknown; image_path: string | null }> = [];
  for (const p of players) {
    let imagePath: string | null = null;
    let imageUrl = p.imageUrl;
    if (imageUrl?.startsWith("data:")) {
      const path = await uploadDataUrl(imageUrl, `${userId}/players/${p.id}`);
      if (path) {
        imagePath = path;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        imageUrl = data.publicUrl;
      } else {
        imageUrl = undefined;
      }
    }
    playerRows.push({
      id: p.id,
      user_id: userId,
      data: { ...p, imageUrl } as unknown,
      image_path: imagePath,
    });
  }
  if (playerRows.length) {
    const { error } = await supabase.from("players").insert(playerRows as never);
    if (error) throw new Error(`Players: ${error.message}`);
  }

  if (wls.length) {
    const rows = wls.map((w) => ({
      id: w.id,
      user_id: userId,
      number: w.number,
      data: w as unknown,
    }));
    const { error } = await supabase.from("weekend_leagues").insert(rows as never);
    if (error) throw new Error(`WLs: ${error.message}`);
  }

  if (matches.length) {
    const rows = matches.map((m) => ({
      id: m.id,
      user_id: userId,
      wl_id: m.wlId,
      data: m as unknown,
    }));
    const { error } = await supabase.from("matches").insert(rows as never);
    if (error) throw new Error(`Matches: ${error.message}`);
  }

  // Settings + crest uploads
  let clubCrestPath: string | null = null;
  let opponentCrestPath: string | null = null;
  if (clubCrest?.startsWith("data:")) {
    clubCrestPath = await uploadDataUrl(clubCrest, `${userId}/club`);
  }
  if (opponentCrest?.startsWith("data:")) {
    opponentCrestPath = await uploadDataUrl(opponentCrest, `${userId}/opponent`);
  }
  if (clubCrestPath || opponentCrestPath || clubName || opponentName) {
    await supabase
      .from("settings")
      .upsert(
        {
          user_id: userId,
          club_name: clubName ?? null,
          opponent_name: opponentName ?? null,
          club_crest_path: clubCrestPath,
          opponent_crest_path: opponentCrestPath,
        },
        { onConflict: "user_id" },
      );
  }

  // Clear legacy keys (frees quota)
  Object.values(LEGACY).forEach((k) => localStorage.removeItem(k));
  localStorage.setItem(FLAG, "1");

  return {
    migrated: true,
    counts: { players: players.length, wls: wls.length, matches: matches.length },
  };
}
