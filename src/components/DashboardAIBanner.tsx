import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { runCoach, type CoachInsight } from "@/lib/coach.functions";
import { aggregatePlayer, matchIsWin, wlRecord } from "@/lib/stats";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { wlLabel } from "@/lib/types";

interface Props {
  wls: WeekendLeague[];
  matches: Match[];
  players: Player[];
}

export function DashboardAIBanner({ wls, matches, players }: Props) {
  const call = useServerFn(runCoach);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CoachInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRan, setAutoRan] = useState(false);

  const lastWL = [...wls].sort((a, b) => b.number - a.number)[0];

  const run = async () => {
    if (!lastWL) return;
    setLoading(true);
    setError(null);
    try {
      const wlMatches = matches
        .filter((m) => m.wlId === lastWL.id)
        .sort((a, b) => a.index - b.index);
      const r = wlRecord(lastWL, matches);
      const squad = players
        .map((p) => ({ p, agg: aggregatePlayer(p, wlMatches) }))
        .filter((x) => x.agg.matches > 0)
        .map(({ p, agg }) => ({
          name: p.name,
          position: p.position,
          matches: agg.matches,
          goals: agg.goals,
          assists: agg.assists,
          avgRating: Number(agg.avgRating.toFixed(2)),
        }));
      const timeline = wlMatches.map((m) => (matchIsWin(m) ? "W" : "L")).join("");
      const payload = {
        wl: wlLabel(lastWL),
        record: `${r.wins}W-${r.losses}L`,
        scored: r.goalsFor,
        conceded: r.goalsAgainst,
        goalDiff: r.goalsFor - r.goalsAgainst,
        timeline,
        squad,
      };
      const result = (await call({ data: { mode: "analysis", payload } })) as CoachInsight;
      setReport(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRan && lastWL && !report && !loading) {
      setAutoRan(true);
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastWL?.id]);

  if (!lastWL) return null;

  return (
    <div className="surface-card p-4 border-l-4 border-l-primary flex items-start gap-3">
      <div className="h-10 w-10 rounded-md bg-primary/15 border border-primary/40 text-primary grid place-items-center shrink-0">
        <Brain className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> AI Strategy Insight
          </div>
          <button
            onClick={run}
            disabled={loading}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCcw className="h-3 w-3" />}
            {loading ? "Analyzing" : "Refresh"}
          </button>
        </div>
        {loading && !report && (
          <p className="text-sm text-muted-foreground mt-1">Reading your last Weekend League…</p>
        )}
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
        {report && (
          <div className="mt-1.5 space-y-1.5">
            <p className="text-sm font-semibold text-foreground leading-snug">{report.summary}</p>
            <p className="text-[12px] leading-snug text-muted-foreground">
              <span className="text-primary font-semibold">Tactic:</span> {report.balance}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
