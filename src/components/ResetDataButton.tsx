import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function ResetDataButton() {
  const [busy, setBusy] = useState(false);

  async function resetData() {
    if (!window.confirm("Delete all your players, Weekend Leagues and matches? This cannot be undone.")) return;
    setBusy(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || user.is_anonymous) throw new Error("Sign in before resetting your data.");

      // Delete dependent records first; all queries are limited to the signed-in user.
      for (const table of ["matches", "weekend_leagues", "player_lab_notes", "players"] as const) {
        const { error } = await supabase.from(table).delete().eq("user_id", user.id);
        if (error) throw new Error(`Could not delete ${table}: ${error.message}`);
      }
      toast.success("Your players, Weekend Leagues and matches were deleted.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset your data.");
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="destructive" disabled={busy} onClick={resetData}>
      <Trash2 aria-hidden="true" /> {busy ? "Deleting…" : "Reset my data"}
    </Button>
  );
}