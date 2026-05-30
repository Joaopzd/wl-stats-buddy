import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

interface Input {
  anonUserId: string;
  accessToken: string;
}

const BUCKET = "crests";

/**
 * Transfers ownership of all rows from an anonymous user to the
 * caller (a newly-signed-in permanent user). Verifies the caller's
 * access token, then re-parents players / WLs / matches / settings
 * and migrates storage objects under their new user_id folder.
 */
export const migrateAnonymousUser = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => d)
  .handler(async ({ data }) => {
    const { anonUserId, accessToken } = data;
    if (!anonUserId || !accessToken) throw new Error("Missing parameters");

    // Verify the caller via their bearer token (uses anon key + token).
    const url = process.env.SUPABASE_URL!;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser();
    if (uErr || !u.user) throw new Error("Not authenticated");
    const newUserId = u.user.id;
    if (newUserId === anonUserId) {
      return { migrated: false, reason: "same-user" as const };
    }
    if (u.user.is_anonymous) {
      throw new Error("Target user is still anonymous");
    }

    // Re-parent rows (RLS bypassed via service role).
    const tables = ["players", "weekend_leagues", "matches"] as const;
    for (const t of tables) {
      const { error } = await supabaseAdmin
        .from(t)
        .update({ user_id: newUserId })
        .eq("user_id", anonUserId);
      if (error) throw new Error(`${t}: ${error.message}`);
    }

    // Settings: PK is user_id. If new user has none, re-parent; else merge missing fields.
    const { data: anonSettings } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("user_id", anonUserId)
      .maybeSingle();
    if (anonSettings) {
      const { data: newSettings } = await supabaseAdmin
        .from("settings")
        .select("user_id")
        .eq("user_id", newUserId)
        .maybeSingle();
      if (!newSettings) {
        await supabaseAdmin
          .from("settings")
          .update({ user_id: newUserId })
          .eq("user_id", anonUserId);
      } else {
        // New user already had settings — keep theirs, just delete the anon row.
        await supabaseAdmin.from("settings").delete().eq("user_id", anonUserId);
      }
    }

    // Move storage objects (crests/<anonId>/...) -> (crests/<newId>/...).
    // Updates DB paths accordingly.
    const moved: Array<{ from: string; to: string }> = [];
    async function moveFolder(prefix: string) {
      const { data: list } = await supabaseAdmin.storage.from(BUCKET).list(prefix, { limit: 1000 });
      for (const item of list ?? []) {
        if (item.id === null) {
          // sub-folder
          await moveFolder(`${prefix}/${item.name}`);
          continue;
        }
        const from = `${prefix}/${item.name}`;
        const to = from.replace(`${anonUserId}/`, `${newUserId}/`);
        const { error } = await supabaseAdmin.storage.from(BUCKET).move(from, to);
        if (!error) moved.push({ from, to });
      }
    }
    try {
      await moveFolder(anonUserId);
    } catch {
      // best-effort; ignore listing failures
    }

    // Patch image_path columns that pointed at the old user folder.
    if (moved.length) {
      const { data: players } = await supabaseAdmin
        .from("players")
        .select("id, image_path")
        .eq("user_id", newUserId);
      for (const p of players ?? []) {
        if (p.image_path?.startsWith(`${anonUserId}/`)) {
          await supabaseAdmin
            .from("players")
            .update({ image_path: p.image_path.replace(`${anonUserId}/`, `${newUserId}/`) })
            .eq("id", p.id);
        }
      }
      const { data: s } = await supabaseAdmin
        .from("settings")
        .select("club_crest_path, opponent_crest_path")
        .eq("user_id", newUserId)
        .maybeSingle();
      if (s) {
        const patch: Record<string, string | null> = {};
        if (s.club_crest_path?.startsWith(`${anonUserId}/`)) {
          patch.club_crest_path = s.club_crest_path.replace(`${anonUserId}/`, `${newUserId}/`);
        }
        if (s.opponent_crest_path?.startsWith(`${anonUserId}/`)) {
          patch.opponent_crest_path = s.opponent_crest_path.replace(`${anonUserId}/`, `${newUserId}/`);
        }
        if (Object.keys(patch).length) {
          await supabaseAdmin.from("settings").update(patch).eq("user_id", newUserId);
        }
      }
    }

    // Best-effort: delete the now-empty anonymous user account.
    try {
      await supabaseAdmin.auth.admin.deleteUser(anonUserId);
    } catch {
      // ignore
    }

    return { migrated: true, newUserId, movedFiles: moved.length };
  });
