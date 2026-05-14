import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList, Loader2, Brain } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { runCoach, type CoachBriefing } from "@/lib/coach.functions";
import { aggregateAllPlayers, platformRecords, wlRecord, matchIsWin } from "@/lib/stats";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  wls: WeekendLeague[];
  matches: Match[];
  players: Player[];
}

export function CoachBriefingDialog({ open, onOpenChange, wls, matches, players }: Props) {
  const call = useServerFn(runCoach);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<string[] | null>(null);

  const generate = async () => {
    setLoading(true);
    try {
      const aggs = aggregateAllPlayers(players, matches)
        .filter((a) => a.matches >= 3)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5)
        .map((a) => ({
          name: a.player.name,
          position: a.player.position,
          avgRating: Number(a.avgRating.toFixed(2)),
          goals: a.goals,
          assists: a.assists,
          matches: a.matches,
          winRate: Number((a.winRate * 100).toFixed(0)),
        }));

      const platforms = platformRecords(matches);
      const recent = [...wls]
        .sort((a, b) => b.number - a.number)
        .slice(0, 5)
        .map((w) => {
          const r = wlRecord(w, matches);
          return { wl: w.number, wins: r.wins, losses: r.losses, gd: r.goalsFor - r.goalsAgainst };
        });

      let totalWins = 0, totalLosses = 0;
      for (const m of matches) (matchIsWin(m) ? totalWins++ : totalLosses++);

      const payload = {
        totalWLs: wls.length,
        totalMatches: matches.length,
        career: { wins: totalWins, losses: totalLosses },
        recentWLs: recent,
        platforms,
        topPlayers: aggs,
      };

      const result = (await call({ data: { mode: "briefing", payload } })) as CoachBriefing;
      setTips(result.tips);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setTips(null); }}>
      <DialogContent className="max-w-md" style={{ color: "#F8FAFC" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-wider">
            <ClipboardList className="h-5 w-5 text-primary" /> Coach's Briefing
          </DialogTitle>
          <DialogDescription>
            Personalized pre-WL tips based on your historical performance.
          </DialogDescription>
        </DialogHeader>

        {!tips ? (
          <button
            onClick={generate}
            disabled={loading || matches.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {loading ? "Consulting the coach…" : matches.length === 0 ? "Log matches first" : "Generate briefing"}
          </button>
        ) : (
          <ul className="space-y-2">
            {tips.map((t, i) => (
              <li key={i} className="rounded-md border border-border/60 bg-background/40 p-3 text-sm flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
