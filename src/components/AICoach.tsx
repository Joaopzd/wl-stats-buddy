import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, ClipboardList, Loader2, Sparkles, AlertTriangle, ShieldHalf, Activity, Users } from "lucide-react";
import { runCoach, type CoachInsight } from "@/lib/coach.functions";
import { aggregatePlayer, matchIsWin, wlRecord } from "@/lib/stats";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { wlLabel } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  wls: WeekendLeague[];
  matches: Match[];
  players: Player[];
}

export function AICoach({ wls, matches, players }: Props) {
  const call = useServerFn(runCoach);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CoachInsight | null>(null);

  const lastWL = useMemo(
    () => [...wls].sort((a, b) => b.number - a.number)[0],
    [wls],
  );

  const payload = useMemo(() => {
    if (!lastWL) return null;
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
        ovr: p.overall,
        matches: agg.matches,
        goals: agg.goals,
        assists: agg.assists,
        avgRating: Number(agg.avgRating.toFixed(2)),
      }));

    const sequence = wlMatches.map((m) => (matchIsWin(m) ? "W" : "L")).join("");

    return {
      wl: wlLabel(lastWL),
      record: `${r.wins}W-${r.losses}L`,
      scored: r.goalsFor,
      conceded: r.goalsAgainst,
      goalDiff: r.goalsFor - r.goalsAgainst,
      timeline: sequence,
      squad,
    };
  }, [lastWL, matches, players]);

  const onAnalyze = async () => {
    if (!payload) return toast.error("Log a Weekend League first.");
    setLoading(true);
    try {
      const result = await call({ data: { mode: "analysis", payload } });
      setReport(result as CoachInsight);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-2xl tracking-wider flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" /> AI Strategy Coach
        </h2>
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Powered by Lovable AI
        </span>
      </div>

      <div
        className="surface-card p-5 border border-border/60"
        style={{ color: "#F8FAFC" }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold flex items-center gap-2">
              <ClipboardList className="h-3.5 w-3.5 text-primary" /> Diagnostic
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {lastWL
                ? `Run an instant tactical breakdown of ${wlLabel(lastWL)}.`
                : "Log a Weekend League to unlock the coach."}
            </p>
          </div>
          <button
            onClick={onAnalyze}
            disabled={loading || !payload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Analyzing…" : "AI Analysis"}
          </button>
        </div>

        {report && (
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <CoachItem icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Weakest Link" text={report.weakestLink} />
            <CoachItem icon={<ShieldHalf className="h-3.5 w-3.5" />} label="Defensive Balance" text={report.balance} />
            <CoachItem icon={<Activity className="h-3.5 w-3.5" />} label="Tilt Factor" text={report.tilt} />
            <CoachItem icon={<Users className="h-3.5 w-3.5" />} label="Efficiency Gap" text={report.efficiency} />
            <div className="sm:col-span-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm flex items-start gap-2" style={{ color: "#F8FAFC" }}>
              <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="font-semibold">{report.summary}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CoachItem({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-3" style={{ color: "#F8FAFC" }}>
      <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold flex items-center gap-1.5 mb-1">
        {icon} {label}
      </div>
      <p className="text-[13px] leading-relaxed">{text}</p>
    </div>
  );
}
