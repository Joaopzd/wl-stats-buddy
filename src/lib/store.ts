import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Match, Player, WeekendLeague } from "./types";

// --------------------------------------------------------------------
// Cloud-backed store. Same hook surface as before (sync arrays), but
// hydrated from Supabase after sign-in. Mutations are fire-and-forget:
// optimistic local update + async push; on failure we revert + toast.
// --------------------------------------------------------------------

const BUCKET = "crests";
const DEFAULT_OPPONENT = "Challenger FC";

const EMPTY_PLAYERS: Player[] = [];
const EMPTY_WLS: WeekendLeague[] = [];
const EMPTY_MATCHES: Match[] = [];

let userId: string | null = null;
let initPromise: Promise<void> | null = null;

const state = {
  players: EMPTY_PLAYERS as Player[],
  wls: EMPTY_WLS as WeekendLeague[],
  matches: EMPTY_MATCHES as Match[],
  labNotes: {} as Record<string, string>,
  clubCrest: null as string | null,
  clubName: "",
  opponentCrest: null as string | null,
  opponentName: DEFAULT_OPPONENT,
  loading: true,
};
const EMPTY_LAB_NOTES: Record<string, string> = {};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

function publicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

/**
 * If `value` is a data URL, uploads it to storage and returns { path, url }.
 * Otherwise returns { path: null, url: value } (assumes external URL).
 */
async function maybeUploadImage(
  value: string | null | undefined,
  pathBase: string,
): Promise<{ path: string | null; url: string | null }> {
  if (!value) return { path: null, url: null };
  if (!value.startsWith("data:")) return { path: null, url: value };
  const ext = value.match(/^data:image\/([a-zA-Z0-9+]+)/)?.[1] ?? "png";
  const safeExt = ext.toLowerCase().replace("jpeg", "jpg");
  const path = `${pathBase}.${safeExt}`;
  const blob = await dataUrlToBlob(value);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type || `image/${safeExt}` });
  if (error) throw new Error(error.message);
  return { path, url: publicUrl(path) };
}

async function loadAll() {
  if (!userId) return;
  const [p, w, m, s, ln] = await Promise.all([
    supabase.from("players").select("*").order("created_at"),
    supabase.from("weekend_leagues").select("*").order("number"),
    supabase.from("matches").select("*").order("created_at"),
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("player_lab_notes").select("player_id, notes"),
  ]);
  state.players = ((p.data ?? []) as unknown as Array<{ data: Player }>).map((r) => r.data);
  state.wls = ((w.data ?? []) as unknown as Array<{ data: WeekendLeague; session_type: string }>).map(
    (r) => ({ ...r.data, sessionType: (r.session_type as "WL" | "LAB") ?? r.data.sessionType ?? "WL" }),
  );
  state.matches = ((m.data ?? []) as unknown as Array<{ data: Match; session_type: string }>).map(
    (r) => ({ ...r.data, sessionType: (r.session_type as "WL" | "LAB") ?? r.data.sessionType ?? "WL" }),
  );
  const notes: Record<string, string> = {};
  for (const row of (ln.data ?? []) as Array<{ player_id: string; notes: string }>) {
    notes[row.player_id] = row.notes ?? "";
  }
  state.labNotes = notes;
  if (s.data) {
    state.clubName = s.data.club_name ?? "";
    state.opponentName = s.data.opponent_name ?? DEFAULT_OPPONENT;
    state.clubCrest = publicUrl(s.data.club_crest_path);
    state.opponentCrest = publicUrl(s.data.opponent_crest_path);
  }
  state.loading = false;
  emit();
}

async function upsertSettings(patch: Record<string, unknown>) {
  if (!userId) throw new Error("Not signed in");
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
}

function reportError(prefix: string, e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  // eslint-disable-next-line no-console
  console.error(prefix, e);
  toast.error(`${prefix}: ${msg}`);
}

export const store = {
  /** Called once after the user has a session. Hydrates state from Supabase. */
  init(uid: string): Promise<void> {
    if (userId === uid && initPromise) return initPromise;
    userId = uid;
    state.loading = true;
    emit();
    initPromise = loadAll().catch((e) => {
      reportError("Falha ao carregar dados", e);
      state.loading = false;
      emit();
    });
    return initPromise;
  },

  isLoading: () => state.loading,
  getUserId: () => userId,

  // ----- Players ---------------------------------------------------
  getPlayers: () => state.players,
  setPlayers: (p: Player[]) => {
    state.players = p;
    emit();
  },
  addPlayer(p: Player) {
    state.players = [...state.players, p];
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        let next = p;
        let imagePath: string | null = null;
        if (p.imageUrl?.startsWith("data:")) {
          const r = await maybeUploadImage(p.imageUrl, `${userId}/players/${p.id}`);
          imagePath = r.path;
          next = { ...p, imageUrl: r.url ?? undefined };
          state.players = state.players.map((x) => (x.id === p.id ? next : x));
          emit();
        }
        const { error } = await supabase.from("players").insert({
          id: p.id,
          user_id: userId,
          data: next as unknown as never,
          image_path: imagePath,
        });
        if (error) throw new Error(error.message);
      } catch (e) {
        state.players = state.players.filter((x) => x.id !== p.id);
        emit();
        reportError("Falha ao salvar jogador", e);
      }
    })();
  },
  updatePlayer(id: string, patch: Partial<Player>) {
    const prev = state.players.find((x) => x.id === id);
    if (!prev) return;
    const next = { ...prev, ...patch };
    state.players = state.players.map((x) => (x.id === id ? next : x));
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        let finalNext = next;
        const payload: { data: never; image_path?: string | null } = {
          data: next as unknown as never,
        };
        if (patch.imageUrl?.startsWith("data:")) {
          const r = await maybeUploadImage(patch.imageUrl, `${userId}/players/${id}`);
          finalNext = { ...next, imageUrl: r.url ?? undefined };
          payload.data = finalNext as unknown as never;
          payload.image_path = r.path;
          state.players = state.players.map((x) => (x.id === id ? finalNext : x));
          emit();
        } else if (patch.imageUrl === undefined && "imageUrl" in patch === false) {
          // no-op
        } else if (!patch.imageUrl) {
          payload.image_path = null;
        }
        const { error } = await supabase.from("players").update(payload).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (e) {
        state.players = state.players.map((x) => (x.id === id ? prev : x));
        emit();
        reportError("Falha ao atualizar jogador", e);
      }
    })();
  },
  deletePlayer(id: string) {
    const prev = state.players;
    state.players = state.players.filter((x) => x.id !== id);
    emit();
    supabase
      .from("players")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          state.players = prev;
          emit();
          reportError("Falha ao apagar jogador", error);
        }
      });
  },

  // ----- Weekend Leagues -------------------------------------------
  getWLs: () => state.wls,
  setWLs: (w: WeekendLeague[]) => {
    state.wls = w;
    emit();
  },
  addWL(w: WeekendLeague) {
    state.wls = [...state.wls, w];
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        const { error } = await supabase.from("weekend_leagues").insert({
          id: w.id,
          user_id: userId,
          number: w.number,
          data: w as unknown as never,
          session_type: w.sessionType ?? "WL",
        } as never);
        if (error) throw new Error(error.message);
      } catch (e) {
        state.wls = state.wls.filter((x) => x.id !== w.id);
        emit();
        reportError("Falha ao criar WL", e);
      }
    })();
  },
  updateWL(id: string, patch: Partial<WeekendLeague>) {
    const prev = state.wls.find((x) => x.id === id);
    if (!prev) return;
    const next = { ...prev, ...patch };
    state.wls = state.wls.map((x) => (x.id === id ? next : x));
    emit();
    (async () => {
      try {
        const payload: { data: never; number?: number } = { data: next as unknown as never };
        if (patch.number !== undefined) payload.number = patch.number;
        const { error } = await supabase.from("weekend_leagues").update(payload).eq("id", id);
        if (error) throw new Error(error.message);
      } catch (e) {
        state.wls = state.wls.map((x) => (x.id === id ? prev : x));
        emit();
        reportError("Falha ao atualizar WL", e);
      }
    })();
  },
  deleteWL(id: string) {
    const prevWLs = state.wls;
    const prevMatches = state.matches;
    state.wls = state.wls.filter((x) => x.id !== id);
    state.matches = state.matches.filter((m) => m.wlId !== id);
    emit();
    (async () => {
      try {
        // Matches first (FK-like, manual cascade)
        const { error: mErr } = await supabase.from("matches").delete().eq("wl_id", id);
        if (mErr) throw new Error(mErr.message);
        const { error } = await supabase.from("weekend_leagues").delete().eq("id", id);
        if (error) throw new Error(error.message);
      } catch (e) {
        state.wls = prevWLs;
        state.matches = prevMatches;
        emit();
        reportError("Falha ao apagar WL", e);
      }
    })();
  },

  // ----- Matches ---------------------------------------------------
  getMatches: () => state.matches,
  setMatches: (m: Match[]) => {
    state.matches = m;
    emit();
  },
  addMatch(m: Match) {
    state.matches = [...state.matches, m];
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        const { error } = await supabase.from("matches").insert({
          id: m.id,
          user_id: userId,
          wl_id: m.wlId,
          data: m as unknown as never,
          session_type: m.sessionType ?? "WL",
        } as never);
        if (error) throw new Error(error.message);
      } catch (e) {
        state.matches = state.matches.filter((x) => x.id !== m.id);
        emit();
        reportError("Falha ao salvar partida", e);
      }
    })();
  },
  updateMatch(id: string, patch: Partial<Match>) {
    const prev = state.matches.find((x) => x.id === id);
    if (!prev) return;
    const next = { ...prev, ...patch };
    state.matches = state.matches.map((x) => (x.id === id ? next : x));
    emit();
    (async () => {
      try {
        const { error } = await supabase
          .from("matches")
          .update({ data: next as unknown as never })
          .eq("id", id);
        if (error) throw new Error(error.message);
      } catch (e) {
        state.matches = state.matches.map((x) => (x.id === id ? prev : x));
        emit();
        reportError("Falha ao atualizar partida", e);
      }
    })();
  },
  deleteMatch(id: string) {
    const prev = state.matches;
    state.matches = state.matches.filter((x) => x.id !== id);
    emit();
    supabase
      .from("matches")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) {
          state.matches = prev;
          emit();
          reportError("Falha ao apagar partida", error);
        }
      });
  },

  // ----- Settings: club / opponent ---------------------------------
  getClubCrest: () => state.clubCrest,
  setClubCrest(value: string | null) {
    const prev = state.clubCrest;
    state.clubCrest = value; // optimistic; replaced with public URL after upload
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        let path: string | null = null;
        let url: string | null = value;
        if (value?.startsWith("data:")) {
          const r = await maybeUploadImage(value, `${userId}/club`);
          path = r.path;
          url = r.url;
          state.clubCrest = url;
          emit();
        }
        await upsertSettings({ club_crest_path: path });
      } catch (e) {
        state.clubCrest = prev;
        emit();
        reportError("Falha ao salvar escudo do clube", e);
      }
    })();
  },

  getClubName: () => state.clubName,
  setClubName(name: string) {
    const prev = state.clubName;
    const trimmed = name.trim();
    state.clubName = trimmed;
    emit();
    upsertSettings({ club_name: trimmed || null }).catch((e) => {
      state.clubName = prev;
      emit();
      reportError("Falha ao salvar nome do clube", e);
    });
  },

  getOpponentCrest: () => state.opponentCrest,
  setOpponentCrest(value: string | null) {
    const prev = state.opponentCrest;
    state.opponentCrest = value;
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        let path: string | null = null;
        let url: string | null = value;
        if (value?.startsWith("data:")) {
          const r = await maybeUploadImage(value, `${userId}/opponent`);
          path = r.path;
          url = r.url;
          state.opponentCrest = url;
          emit();
        }
        await upsertSettings({ opponent_crest_path: path });
      } catch (e) {
        state.opponentCrest = prev;
        emit();
        reportError("Falha ao salvar escudo do adversário", e);
      }
    })();
  },

  // ----- PZD Lab notes ---------------------------------------------
  getLabNotes: () => state.labNotes,
  getLabNote: (playerId: string) => state.labNotes[playerId] ?? "",
  setLabNote(playerId: string, notes: string) {
    const prev = state.labNotes[playerId] ?? "";
    state.labNotes = { ...state.labNotes, [playerId]: notes };
    emit();
    (async () => {
      try {
        if (!userId) throw new Error("Not signed in");
        const { error } = await supabase
          .from("player_lab_notes")
          .upsert({ user_id: userId, player_id: playerId, notes }, { onConflict: "user_id,player_id" });
        if (error) throw new Error(error.message);
      } catch (e) {
        state.labNotes = { ...state.labNotes, [playerId]: prev };
        emit();
        reportError("Falha ao salvar anotação", e);
      }
    })();
  },
};

// ----- React hooks (stable empty fallback for SSR) ---------------------
function useSlice<T>(getter: () => T, server: T): T {
  return useSyncExternalStore(subscribe, getter, () => server);
}

export const usePlayers = () => useSlice(store.getPlayers, EMPTY_PLAYERS);
export const useWLs = () => useSlice(store.getWLs, EMPTY_WLS);
export const useMatches = () => useSlice(store.getMatches, EMPTY_MATCHES);
export const useLabNotes = () => useSlice(store.getLabNotes, EMPTY_LAB_NOTES);
export const useClubCrest = () => useSlice<string | null>(store.getClubCrest, null);
export const useClubName = () => useSlice<string>(store.getClubName, "");
export const useOpponentCrest = () => useSlice<string | null>(store.getOpponentCrest, null);
export const useOpponentName = () => useSlice<string>(store.getOpponentName, DEFAULT_OPPONENT);
export const useStoreLoading = () => useSlice(store.isLoading, true);
