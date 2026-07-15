import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Trophy,
  Shield,
  Star,
  AlertTriangle,
  Info,
  Archive,
  ArchiveRestore,
  FlaskConical,
  TrendingUp,
  Pencil,
} from "lucide-react";
  ArrowLeft,
  Trophy,
  Shield,
  Star,
  AlertTriangle,
  Info,
  Archive,
  ArchiveRestore,
  FlaskConical,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { PositionBadge } from "@/components/PositionBadge";
import { PlayerCard } from "@/components/PlayerCard";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { RatingDisplay } from "@/components/RatingDisplay";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  aggregatePlayer,
  eyeTestMismatch,
  isCleanSheetEligible,
  isGoalsConcededEligible,
  managerRatingAggregate,
  matchIsWin,
} from "@/lib/stats";
import { store, useMatches, usePlayers, useWLs, useStoreLoading } from "@/lib/store";
import { wlLabel } from "@/lib/types";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/players/$id")({
  head: () => ({
    meta: [
      { title: "Player Profile — PitchSide" },
      { name: "description", content: "Career stats, last WL stats, and evolution charts for this player." },
    ],
  }),
  component: PlayerProfilePage,
  notFoundComponent: () => (
    <AppShell>
      <div className="surface-card p-8 text-center text-sm text-muted-foreground">
        Player not found.
      </div>
    </AppShell>
  ),
});

function PlayerProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const players = usePlayers();
  const matches = useMatches();
  const wls = useWLs();
  const loading = useStoreLoading();

  const player = players.find((p) => p.id === id);

  if (loading && !player) {
    return (
      <AppShell>
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }
  if (!player) {
    return (
      <AppShell>
        <div className="surface-card p-8 text-center space-y-3">
          <div className="text-sm text-muted-foreground">This player doesn't exist or was removed.</div>
          <Link
            to="/players"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-xs uppercase tracking-wider font-semibold hover:border-primary/60"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Players
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PlayerProfile
        player={player}
        matches={matches}
        wls={wls}
        onBack={() => navigate({ to: "/players" })}
      />
    </AppShell>
  );
}

function PlayerProfile({
  player,
  matches,
  wls,
  onBack,
}: {
  player: Player;
  matches: Match[];
  wls: WeekendLeague[];
  onBack: () => void;
}) {
  const career = useMemo(() => aggregatePlayer(player, matches), [player, matches]);

  const wlsWithPlayer = useMemo(() => {
    const sorted = [...wls].sort((a, b) => a.number - b.number || a.createdAt - b.createdAt);
    return sorted
      .map((wl) => {
        const wlMatches = matches.filter((m) => m.wlId === wl.id);
        const played = wlMatches.some((m) => m.performances.some((p) => p.playerId === player.id));
        return played ? { wl, wlMatches } : null;
      })
      .filter((x): x is { wl: WeekendLeague; wlMatches: Match[] } => x !== null);
  }, [player, matches, wls]);

  const lastWL = wlsWithPlayer.length ? wlsWithPlayer[wlsWithPlayer.length - 1] : null;
  const lastAgg = useMemo(
    () => (lastWL ? aggregatePlayer(player, lastWL.wlMatches) : null),
    [player, lastWL],
  );

  const managerCareer = useMemo(() => managerRatingAggregate(player.id, wls), [player.id, wls]);
  const managerLast = useMemo(
    () => (lastWL ? managerRatingAggregate(player.id, [lastWL.wl]) : { avg: 0, count: 0 }),
    [player.id, lastWL],
  );
  const eyeTest = eyeTestMismatch(
    career.avgRating,
    career.matches,
    managerCareer.avg,
    managerCareer.count,
  );

  // ----- Chart data -----
  // Rating evolution — one point per rated match, chronological.
  const ratingSeries = useMemo(() => {
    const points: { idx: number; label: string; rating: number }[] = [];
    let idx = 0;
    const sortedWls = [...wls].sort((a, b) => a.number - b.number || a.createdAt - b.createdAt);
    for (const wl of sortedWls) {
      const wlMatches = matches
        .filter((m) => m.wlId === wl.id)
        .sort((a, b) => a.index - b.index || a.createdAt - b.createdAt);
      for (const m of wlMatches) {
        const perf = m.performances.find((p) => p.playerId === player.id);
        if (!perf || !perf.rating || perf.rating <= 0) continue;
        idx += 1;
        points.push({ idx, label: `WL${wl.number} M${m.index}`, rating: perf.rating });
      }
    }
    return points;
  }, [player.id, matches, wls]);

  // Win% evolution — cumulative win rate per WL played.
  const winSeries = useMemo(() => {
    let played = 0;
    let wins = 0;
    const points: { wl: string; winPct: number; wlWinPct: number }[] = [];
    for (const { wl, wlMatches } of wlsWithPlayer) {
      let wlPlayed = 0;
      let wlWins = 0;
      for (const m of wlMatches) {
        const perf = m.performances.find((p) => p.playerId === player.id);
        if (!perf) continue;
        played += 1;
        wlPlayed += 1;
        if (matchIsWin(m)) {
          wins += 1;
          wlWins += 1;
        }
      }
      points.push({
        wl: `WL${wl.number}`,
        winPct: played ? (wins / played) * 100 : 0,
        wlWinPct: wlPlayed ? (wlWins / wlPlayed) * 100 : 0,
      });
    }
    return points;
  }, [player.id, wlsWithPlayer]);

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-foreground hover:border-primary/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const next = !player.isInDevelopment;
              store.updatePlayer(player.id, {
                isInDevelopment: next,
                ...(next ? { isArchived: false } : {}),
              });
              toast.success(
                next ? `${player.name} marked In Development` : `${player.name} moved back to active`,
              );
            }}
            disabled={player.isArchived}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-accent/60 text-[11px] uppercase tracking-wider font-semibold disabled:opacity-40"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            {player.isInDevelopment ? "Active" : "In Dev"}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !player.isArchived;
              store.updatePlayer(player.id, {
                isArchived: next,
                ...(next ? { isInDevelopment: false } : {}),
              });
              toast.success(next ? `${player.name} archived` : `${player.name} restored`);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-primary/60 text-[11px] uppercase tracking-wider font-semibold"
          >
            {player.isArchived ? (
              <ArchiveRestore className="h-3.5 w-3.5" />
            ) : (
              <Archive className="h-3.5 w-3.5" />
            )}
            {player.isArchived ? "Restore" : "Archive"}
          </button>
        </div>
      </div>

      {/* Identity */}
      <div className="surface-glow p-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5">
        <div className="flex justify-center sm:block">
          <PlayerCard
            name={player.name}
            overall={player.overall}
            position={player.position}
            rarity={player.rarity}
            imageUrl={player.imageUrl}
            size="xl"
          />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl tracking-wider truncate">{player.name}</h1>
            {player.isArchived && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                Archived
              </span>
            )}
            {player.isInDevelopment && !player.isArchived && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/40">
                In Development
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            <Meta label="OVR" value={String(player.overall)} accent />
            <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
                Pos
              </div>
              <div className="mt-1">
                <PositionBadge position={player.position} size="md" />
              </div>
            </div>
            <Meta label="Rarity" value={player.rarity} small />
          </div>

          {lastWL && (
            <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-[11px] leading-tight flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="uppercase tracking-wider font-bold text-primary">Last WL played:</span>
              <Link
                to="/weekend-leagues/$wlId"
                params={{ wlId: lastWL.wl.id }}
                className="font-display tracking-wider hover:text-primary underline underline-offset-2"
              >
                {wlLabel(lastWL.wl)}
              </Link>
            </div>
          )}

          {eyeTest && (
            <div className="rounded-md border border-warn-caution/50 bg-warn-caution/10 px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warn-caution shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight flex-1">
                <div className="font-bold uppercase tracking-wider text-warn-caution flex items-center gap-1">
                  Eye-test mismatch
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label="When does this warning appear?"
                          className="inline-flex items-center justify-center text-warn-caution/80 hover:text-warn-caution"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[260px] text-[11px] leading-snug">
                        Shown when a player has:
                        <br />• Matches played ≥ 9
                        <br />• System Rating ≥ 7.00
                        <br />• Manager Rating count ≥ 3
                        <br />• Manager Rating avg &lt; 6.00
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-muted-foreground">
                  Strong system rating ({career.avgRating.toFixed(2)}) but Manager Rating is low (
                  {managerCareer.avg.toFixed(2)}).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Career & Last WL stats side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-4">
          <SectionHeader title="Career — All WLs" />
          <StatGrid
            agg={career}
            player={player}
            managerAvg={managerCareer.avg}
            managerCount={managerCareer.count}
          />
        </div>
        <div className="surface-card p-4">
          <SectionHeader title={lastWL ? `Last WL — ${wlLabel(lastWL.wl)}` : "Last WL"} />
          {lastAgg && lastAgg.matches > 0 ? (
            <StatGrid
              agg={lastAgg}
              player={player}
              managerAvg={managerLast.avg}
              managerCount={managerLast.count}
            />
          ) : (
            <div className="text-xs text-muted-foreground italic">Hasn't played a match yet.</div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-4">
          <SectionHeader title="Rating Evolution" />
          {ratingSeries.length >= 2 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingSeries} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                  <CartesianGrid stroke="hsl(var(--border) / 0.4)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="idx"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[Math.max(0, Math.floor(Math.min(...ratingSeries.map((p) => p.rating)) - 0.5)), 10]}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    labelFormatter={(_, items) => items?.[0]?.payload?.label ?? ""}
                    formatter={(v: number) => [v.toFixed(2), "Rating"]}
                  />
                  <ReferenceLine y={6} stroke="hsl(var(--muted-foreground) / 0.5)" strokeDasharray="2 4" />
                  <ReferenceLine y={career.avgRating || 0} stroke="hsl(var(--primary) / 0.4)" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="Need at least 2 rated matches to draw the trend." />
          )}
        </div>

        <div className="surface-card p-4">
          <SectionHeader title="Win % Evolution" />
          {winSeries.length >= 2 ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winSeries} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
                  <CartesianGrid stroke="hsl(var(--border) / 0.4)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="wl"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <RTooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    formatter={(v: number, name) => [`${v.toFixed(0)}%`, name === "winPct" ? "Career" : "This WL"]}
                  />
                  <ReferenceLine y={50} stroke="hsl(var(--muted-foreground) / 0.5)" strokeDasharray="2 4" />
                  <Line
                    type="monotone"
                    dataKey="wlWinPct"
                    stroke="hsl(var(--accent))"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2, fill: "hsl(var(--accent))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="winPct"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="Need at least 2 WLs played to draw the trend." />
          )}
          {winSeries.length >= 2 && (
            <div className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-1.5 w-4 rounded-sm bg-primary" /> Career
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="inline-block h-1.5 w-4 rounded-sm bg-accent opacity-70" /> Per WL
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="h-40 grid place-items-center text-xs text-muted-foreground italic text-center px-4">
      {label}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2">
      {title}
    </div>
  );
}

function Meta({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
        {label}
      </div>
      <div
        className={`font-display tracking-wider truncate ${
          accent ? "text-primary text-xl stat-num" : small ? "text-xs" : "text-base"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function StatGrid({
  agg,
  player,
  managerAvg,
  managerCount,
}: {
  agg: ReturnType<typeof aggregatePlayer>;
  player: Player;
  managerAvg: number;
  managerCount: number;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      <Stat label="MP" value={agg.matches} />
      <Stat label="G" value={agg.goals} icon={<SoccerBall className="h-3 w-3" />} accent />
      <Stat label="A" value={agg.assists} icon={<SoccerBoot className="h-3 w-3" />} />
      <Stat
        label="System"
        value={
          <RatingDisplay
            matches={agg.matches}
            ratedMatches={agg.ratedMatches}
            avgRating={agg.avgRating}
            size="md"
          />
        }
        accent={agg.avgRating >= 8}
      />
      <Stat
        label="Manager"
        value={managerCount > 0 ? managerAvg.toFixed(2) : "—"}
        accent={managerAvg >= 8}
      />
      <Stat
        label="Win %"
        value={agg.matches > 0 ? `${(agg.winRate * 100).toFixed(0)}%` : "—"}
        accent={agg.winRate >= 0.6}
      />
      <Stat label="MVP" value={agg.mvpCount} icon={<Trophy className="h-3 w-3 text-amber-300" />} />
      <Stat label="Wins" value={agg.wins} icon={<Star className="h-3 w-3 text-primary" />} />
      <Stat
        label="Sub Impact"
        value={agg.subMatches > 0 ? agg.subImpact.toFixed(2) : "—"}
        accent={agg.subImpact >= 1.5}
      />

      {isCleanSheetEligible(player.position) && (
        <Stat
          label="CS"
          value={agg.cleanSheets}
          icon={<Shield className="h-3 w-3 text-sky-300" />}
        />
      )}
      {isGoalsConcededEligible(player.position) && (
        <Stat label="GC" value={agg.goalsConceded} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string | React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
        {icon}
        {label}
      </div>
      <div
        className={`font-display stat-num text-base leading-tight ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
