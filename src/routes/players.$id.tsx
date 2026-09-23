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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip as RTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ChartContrastToggle } from "@/components/ChartContrastToggle";
import { useChartTheme } from "@/lib/chartTheme";
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
  clutchAggregate,
  eyeTestMismatch,
  isCleanSheetEligible,
  isGoalsConcededEligible,
  managerRatingAggregate,
  matchIsWin,
} from "@/lib/stats";
import { store, useMatches, usePlayers, useWLs, useStoreLoading } from "@/lib/store";
import { wlLabel } from "@/lib/types";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { Flag } from "@/components/Flag";
import { toast } from "sonner";
import { PlayerForm } from "./players.index";
import { PlatformBadge } from "@/components/PlatformBadge";


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
  const [editOpen, setEditOpen] = useState(false);
  const chart = useChartTheme();
  const career = useMemo(() => aggregatePlayer(player, matches), [player, matches]);
  const clutchCareer = useMemo(() => clutchAggregate(player, matches), [player, matches]);

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
  const clutchLast = useMemo(
    () => (lastWL ? clutchAggregate(player, lastWL.wlMatches) : null),
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
  // Rating evolution — one point per rated match plus 5-match moving average.
  const ratingSeries = useMemo(() => {
    const raw: { idx: number; label: string; rating: number }[] = [];
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
        raw.push({ idx, label: `WL${wl.number} M${m.index}`, rating: perf.rating });
      }
    }
    const WINDOW = 5;
    return raw.map((p, i) => {
      const from = Math.max(0, i - WINDOW + 1);
      const slice = raw.slice(from, i + 1);
      const ma = slice.reduce((s, x) => s + x.rating, 0) / slice.length;
      return { ...p, ma: Number(ma.toFixed(3)) };
    });
  }, [player.id, matches, wls]);

  // Win% evolution — includes ALL WLs. Career carries forward; per-WL is null when not played.
  const winSeries = useMemo(() => {
    const sortedWls = [...wls].sort((a, b) => a.number - b.number || a.createdAt - b.createdAt);
    let played = 0;
    let wins = 0;
    const points: { wl: string; winPct: number | null; wlWinPct: number | null }[] = [];
    for (const wl of sortedWls) {
      const wlMatches = matches.filter((m) => m.wlId === wl.id);
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
        winPct: played ? (wins / played) * 100 : null,
        wlWinPct: wlPlayed ? (wlWins / wlPlayed) * 100 : null,
      });
    }
    return points;
  }, [player.id, matches, wls]);

  // Last 5 matches played (chronological, newest first).
  const last5 = useMemo(() => {
    const rows: { match: Match; wl: WeekendLeague; perf: Match["performances"][number] }[] = [];
    const sortedWls = [...wls].sort((a, b) => a.number - b.number || a.createdAt - b.createdAt);
    for (const wl of sortedWls) {
      const wlMatches = matches
        .filter((m) => m.wlId === wl.id)
        .sort((a, b) => a.index - b.index || a.createdAt - b.createdAt);
      for (const m of wlMatches) {
        const perf = m.performances.find((p) => p.playerId === player.id);
        if (!perf) continue;
        rows.push({ match: m, wl, perf });
      }
    }
    return rows.slice(-5).reverse();
  }, [player.id, matches, wls]);

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
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-primary/60 bg-primary/10 text-primary hover:bg-primary/20 text-[11px] uppercase tracking-wider font-semibold"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
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
                ...(next ? { isInDevelopment: false } : { restoredAt: Date.now() }),
              });
              toast.success(next ? `${player.name} archived` : `${player.name} restored — absence counter reset`);
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

          <div className="grid grid-cols-3 gap-2 max-w-md">
            <Meta
              label="Nationality"
              value={player.nationality || "—"}
              leading={player.nationality ? <Flag country={player.nationality} /> : undefined}
            />
            <Meta label="Height" value={player.heightCm ? `${player.heightCm} cm` : "—"} />
            <Meta
              label="Preferred Foot"
              value={player.preferredFoot ?? "—"}
            />
          </div>

          {(player.club || player.league || player.weightKg || player.birthdate) && (
            <div className="grid grid-cols-3 gap-2 max-w-md">
              <Meta label="Club" value={player.club ?? "—"} small />
              <Meta label="League" value={player.league ?? "—"} small />
              <Meta
                label="Age"
                value={player.birthdate ? String(ageFromBirthdate(player.birthdate)) : "—"}
              />
            </div>
          )}


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

      <CardAttributesPanel player={player} />

      {/* Career & Last WL stats side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-4">
          <SectionHeader title="Career — All WLs" />
          <StatGrid
            agg={career}
            player={player}
            managerAvg={managerCareer.avg}
            managerCount={managerCareer.count}
            clutchScore={clutchCareer.clutchScore}
            clutchApps={clutchCareer.clutch.matches}
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
              clutchScore={clutchLast ? clutchLast.clutchScore : 0}
              clutchApps={clutchLast ? clutchLast.clutch.matches : 0}
            />
          ) : (
            <div className="text-xs text-muted-foreground italic">Hasn't played a match yet.</div>
          )}
        </div>
      </div>

      {/* Last 5 Matches */}
      <div className="surface-card p-4">
        <SectionHeader title="Last 5 Matches" />
        {last5.length === 0 ? (
          <div className="text-xs text-muted-foreground italic">No matches recorded yet.</div>
        ) : (
          <div className="space-y-2">
            {last5.map(({ match, wl, perf }) => {
              const win = matchIsWin(match);
              const ratingColor =
                perf.rating >= 8
                  ? "text-primary"
                  : perf.rating >= 6
                    ? "text-foreground"
                    : perf.rating > 0
                      ? "text-warn-caution"
                      : "text-muted-foreground";
              return (
                <Link
                  key={match.id}
                  to="/weekend-leagues/$wlId"
                  params={{ wlId: wl.id }}
                  className="flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 hover:border-primary/60 transition"
                >
                  <div
                    className={`h-9 w-1 rounded-full shrink-0 ${
                      match.disconnect
                        ? "bg-warn-caution"
                        : win
                          ? "bg-primary"
                          : "bg-destructive"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      <span>{wlLabel(wl)}</span>
                      <span className="opacity-50">·</span>
                      <span>M{match.index}</span>
                      <PlatformBadge platform={match.platform} />
                      {match.disconnect && (
                        <span className="text-warn-caution normal-case">DISC</span>
                      )}
                      {match.mvpPlayerId === player.id && (
                        <Trophy className="h-3 w-3 text-amber-300" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-display stat-num text-base tracking-wider">
                        {match.scoreFor} <span className="text-muted-foreground">–</span> {match.scoreAgainst}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-0.5">
                          <SoccerBall className="h-3 w-3" /> {perf.goals}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <SoccerBoot className="h-3 w-3" /> {perf.assists}
                        </span>
                        {perf.role === "sub" && (
                          <span className="text-[9px] uppercase tracking-wider px-1 rounded bg-muted/50">SUB</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className={`font-display stat-num text-lg ${ratingColor}`}>
                    {perf.rating > 0 ? perf.rating.toFixed(1) : "—"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="mb-2 flex items-center justify-end">
        <ChartContrastToggle />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="surface-card p-4">
          <SectionHeader title="Rating Evolution" />
          {ratingSeries.length >= 2 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingSeries} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={chart.grid} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="idx"
                    stroke={chart.axis}
                    tick={{ fontSize: 11, fill: chart.axis }}
                    tickLine={false}
                    axisLine={{ stroke: chart.axis }}
                    label={{ value: "Matches", position: "insideBottom", offset: -4, fill: chart.axis, fontSize: 10 }}
                  />
                  <YAxis
                    domain={[Math.max(0, Math.floor(Math.min(...ratingSeries.map((p) => p.rating)) - 0.5)), 10]}
                    stroke={chart.axis}
                    tick={{ fontSize: 11, fill: chart.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <RTooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "8px 12px",
                      color: chart.tooltipText,
                    }}
                    labelStyle={{ color: chart.tooltipText, fontWeight: 700, marginBottom: 4 }}
                    itemStyle={{ color: chart.tooltipText }}
                    labelFormatter={(_: unknown, items: Array<{ payload?: { label?: string } }>) => items?.[0]?.payload?.label ?? ""}
                    formatter={(v: unknown, name: unknown) => [typeof v === "number" ? v.toFixed(2) : "—", name as string]}
                    cursor={{ stroke: chart.reference, strokeWidth: 1 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={26}
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 11, color: chart.axis }}
                  />
                  <ReferenceLine
                    y={career.avgRating || 0}
                    stroke={chart.reference}
                    strokeDasharray="4 4"
                    label={{
                      value: `Career avg ${(career.avgRating || 0).toFixed(2)}`,
                      position: "insideTopRight",
                      fill: chart.axis,
                      fontSize: 10,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    name="Match rating"
                    stroke={chart.series[0]}
                    strokeWidth={chart.strokeThin}
                    strokeOpacity={chart.high ? 0.9 : 0.55}
                    dot={{ r: chart.dot, fill: chart.series[0], strokeWidth: 0 }}
                    activeDot={{ r: chart.dot + 2, stroke: "var(--background)", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ma"
                    name="5-match avg"
                    stroke={chart.series[1]}
                    strokeWidth={chart.stroke}
                    dot={false}
                    activeDot={{ r: chart.dot + 2, stroke: "var(--background)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="Need at least 2 rated matches to draw the trend." />
          )}
          {ratingSeries.length >= 2 && (
            <div className="mt-2 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-6 rounded-sm" style={{ background: chart.series[1] }} /> 5-match moving avg
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: chart.series[0] }} /> Match rating
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-px w-6 border-t border-dashed border-muted-foreground" /> Career avg {(career.avgRating || 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <div className="surface-card p-4">
          <SectionHeader title="Win % Evolution" />
          {winSeries.length >= 2 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winSeries} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke={chart.grid} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="wl"
                    stroke={chart.axis}
                    tick={{ fontSize: 11, fill: chart.axis }}
                    tickLine={false}
                    axisLine={{ stroke: chart.axis }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke={chart.axis}
                    tick={{ fontSize: 11, fill: chart.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <RTooltip
                    contentStyle={{
                      background: chart.tooltipBg,
                      border: `1px solid ${chart.tooltipBorder}`,
                      borderRadius: 8,
                      fontSize: 12,
                      padding: "8px 12px",
                      color: chart.tooltipText,
                    }}
                    labelStyle={{ color: chart.tooltipText, fontWeight: 700, marginBottom: 4 }}
                    itemStyle={{ color: chart.tooltipText }}
                    formatter={(v: number, name) => [typeof v === "number" ? `${v.toFixed(0)}%` : "—", name]}
                    cursor={{ stroke: chart.reference, strokeWidth: 1 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={26}
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 11, color: chart.axis }}
                  />
                  <ReferenceLine y={50} stroke={chart.reference} strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="wlWinPct"
                    name="Per WL"
                    stroke={chart.series[1]}
                    strokeWidth={chart.stroke}
                    connectNulls
                    dot={{ r: chart.dot + 1, fill: chart.series[1], strokeWidth: 0 }}
                    activeDot={{ r: chart.dot + 3, stroke: "var(--background)", strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="winPct"
                    name="Career"
                    stroke={chart.series[0]}
                    strokeWidth={chart.strokeThin}
                    strokeDasharray="6 4"
                    connectNulls
                    dot={{ r: chart.dot, fill: chart.series[0], strokeWidth: 0 }}
                    activeDot={{ r: chart.dot + 2, stroke: "var(--background)", strokeWidth: 2 }}
                  />

                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartEmpty label="Need at least 2 WLs played to draw the trend." />
          )}
          {winSeries.length >= 2 && (
            <div className="mt-2 flex items-center gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1 w-6 rounded-sm" style={{ background: chart.series[0] }} /> Career (dashed)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-1 w-6 rounded-sm" style={{ background: chart.series[1] }} /> Per WL
              </span>
            </div>
          )}
        </div>
      </div>


      {editOpen && (
        <PlayerForm existing={player} onClose={() => setEditOpen(false)} />
      )}
    </div>
  );
}

function ageFromBirthdate(birthdate: string): number {
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() >= b.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

function AttributeBar({ label, value }: { label: string; value: number }) {
  const color = value >= 85 ? "bg-primary" : value >= 70 ? "bg-accent" : "bg-muted-foreground/60";
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 99)}%` }} />
      </div>
      <span className="w-7 text-right stat-num text-sm font-bold">{value}</span>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < value ? "text-amber-300 fill-amber-300" : "text-muted-foreground/30"}`}
        />
      ))}
    </span>
  );
}

function CardAttributesPanel({ player }: { player: Player }) {
  const facets: { label: string; value: number | undefined }[] = [
    { label: "Pace", value: player.pace },
    { label: "Shooting", value: player.shooting },
    { label: "Passing", value: player.passing },
    { label: "Dribbling", value: player.dribbling },
    { label: "Defending", value: player.defending },
    { label: "Physical", value: player.physical },
  ];
  const hasFacets = facets.some((f) => typeof f.value === "number");
  const hasExtra = player.skillMoves || player.weakFoot || player.weightKg || (player.playstyles?.length ?? 0) > 0;

  if (!hasFacets && !hasExtra) return null;

  return (
    <div className="surface-card p-4">
      <SectionHeader title="Card Attributes" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        {hasFacets && (
          <div className="space-y-2">
            {facets
              .filter((f): f is { label: string; value: number } => typeof f.value === "number")
              .map((f) => (
                <AttributeBar key={f.label} label={f.label} value={f.value} />
              ))}
          </div>
        )}
        <div className="space-y-3">
          {(player.skillMoves || player.weakFoot) && (
            <div className="flex items-center gap-6">
              {player.skillMoves && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">
                    Skill Moves
                  </div>
                  <StarRating value={player.skillMoves} />
                </div>
              )}
              {player.weakFoot && (
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">
                    Weak Foot
                  </div>
                  <StarRating value={player.weakFoot} />
                </div>
              )}
            </div>
          )}
          {player.weightKg && (
            <Meta label="Weight" value={`${player.weightKg} kg`} small />
          )}
          {player.playstyles && player.playstyles.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1.5">
                PlayStyles
              </div>
              <div className="flex flex-wrap gap-1.5">
                {player.playstyles.map((ps) => (
                  <span
                    key={ps}
                    className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30 font-semibold"
                  >
                    {ps}
                  </span>
                ))}
              </div>
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
  leading,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
  leading?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
        {label}
      </div>
      <div
        className={`font-display tracking-wider truncate flex items-center gap-1.5 ${
          accent ? "text-primary text-xl stat-num" : small ? "text-xs" : "text-base"
        }`}
      >
        {leading}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function StatGrid({
  agg,
  player,
  managerAvg,
  managerCount,
  clutchScore,
  clutchApps,
}: {
  agg: ReturnType<typeof aggregatePlayer>;
  player: Player;
  managerAvg: number;
  managerCount: number;
  clutchScore: number;
  clutchApps: number;
}) {
  const clutchEligible = clutchApps >= 5;
  const clutchAccent = clutchEligible && clutchScore > 0;
  const clutchValue = clutchEligible
    ? `${clutchScore >= 0 ? "+" : ""}${clutchScore.toFixed(2)}`
    : "—";
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
      <Stat
        label="Clutch"
        value={clutchValue}
        icon={<TrendingUp className="h-3 w-3 text-primary" />}
        accent={clutchAccent}
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
