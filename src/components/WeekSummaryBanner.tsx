import { CalendarDays, TrendingUp, TrendingDown, Minus, Percent, Trophy, Shield, Sparkles } from "lucide-react";
import type { Match, WeekendLeague } from "@/lib/types";
import { wlLabel } from "@/lib/types";
import { weekDelta } from "@/lib/stats";

interface Props {
  wls: WeekendLeague[];
  matches: Match[];
}

export function WeekSummaryBanner({ wls, matches }: Props) {
  const d = weekDelta(wls, matches);
  if (!d.current) return null;

  const inProgress = !d.current.closed && d.played < 15;

  return (
    <div className="surface-card p-4 border-l-4 border-l-primary">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Week Summary
          </div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg tracking-wider truncate">{wlLabel(d.current)}</h3>
            {inProgress && (
              <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> In Progress · {d.played}/15
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {d.previous ? `vs ${wlLabel(d.previous)}` : "no prior WL to compare"}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <DeltaTile
          icon={<Trophy className="h-3 w-3 text-primary" />}
          label="Wins"
          value={String(d.wins)}
          delta={d.previous ? d.winsDelta : null}
          betterHigher
        />
        <DeltaTile
          icon={<Shield className="h-3 w-3 text-destructive" />}
          label="Losses"
          value={String(d.losses)}
          delta={d.previous ? d.lossesDelta : null}
          betterHigher={false}
        />
        <DeltaTile
          icon={<Percent className="h-3 w-3 text-primary" />}
          label="Win Rate"
          value={`${Math.round(d.winRate * 100)}%`}
          delta={d.previous ? d.winRateDelta * 100 : null}
          formatDelta={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
          betterHigher
        />
        <DeltaTile
          icon={<Sparkles className="h-3 w-3 text-primary" />}
          label="Adj. WR"
          value={`${Math.round(d.adjWinRate * 100)}%`}
          delta={d.previous ? d.adjWinRateDelta * 100 : null}
          formatDelta={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
          betterHigher
        />
      </div>
    </div>
  );
}

function DeltaTile({
  icon,
  label,
  value,
  delta,
  betterHigher,
  formatDelta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: number | null;
  betterHigher: boolean;
  formatDelta?: (v: number) => string;
}) {
  const hasDelta = delta !== null && Math.abs(delta) > 0.0001;
  const isGood = hasDelta && (betterHigher ? delta! > 0 : delta! < 0);
  const isBad = hasDelta && (betterHigher ? delta! < 0 : delta! > 0);
  const tone = isGood ? "text-primary" : isBad ? "text-destructive" : "text-muted-foreground";
  const Icon = !hasDelta ? Minus : (betterHigher ? (delta! > 0 ? TrendingUp : TrendingDown) : (delta! > 0 ? TrendingUp : TrendingDown));
  const label2 = hasDelta
    ? (formatDelta ? formatDelta(delta!) : `${delta! > 0 ? "+" : ""}${delta}`)
    : "no change";

  return (
    <div className="rounded-md border border-border/60 bg-background/40 p-2.5">
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="mt-0.5 flex items-baseline justify-between gap-2">
        <span className="font-display stat-num text-xl leading-none tabular-nums">{value}</span>
        <span className={`text-[10px] font-mono inline-flex items-center gap-0.5 ${tone}`}>
          <Icon className="h-3 w-3" />
          {label2}
        </span>
      </div>
    </div>
  );
}
