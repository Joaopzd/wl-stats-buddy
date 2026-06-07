import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers } from "@/lib/store";
import { aggregateAllPlayers, clutchAggregate, CLUTCH_MIN_MATCHES, CLUTCH_KING_TOOLTIP, CLUTCH_DROP_TOOLTIP, performanceStatus, type ClutchAgg, type PlayerAgg } from "@/lib/stats";
import { RatingDisplay } from "@/components/RatingDisplay";
import { Sparkles, Trophy, Shield, Info, Zap, AlertTriangle, Flame, TrendingDown } from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";

const MIN_MATCHES = 9;

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Club Legends — PitchSide" },
      { name: "description", content: "Top 10 leaderboards: scorers, playmakers and best-rated players in your club." },
      { property: "og:title", content: "Club Legends · Rankings" },
      { property: "og:description", content: "Top 10 leaderboards across your career." },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const players = usePlayers();
  const matches = useMatches();
  const aggs = useMemo(() => aggregateAllPlayers(players, matches), [players, matches]);

  const eligible = useMemo(
    () => aggs.filter((a) => a.matches >= MIN_MATCHES),
    [aggs],
  );

  const topScorers = useMemo(
    () => [...eligible].filter((a) => a.goals > 0).sort((a, b) => b.goals - a.goals || b.gaPerGame - a.gaPerGame).slice(0, 10),
    [eligible],
  );
  const topPlaymakers = useMemo(
    () => [...eligible].filter((a) => a.assists > 0).sort((a, b) => b.assists - a.assists || b.gaPerGame - a.gaPerGame).slice(0, 10),
    [eligible],
  );
  const topRated = useMemo(
    () =>
      [...eligible]
        .filter((a) => a.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 10),
    [eligible],
  );
  const topMvps = useMemo(
    () => [...eligible].filter((a) => a.mvpCount > 0).sort((a, b) => b.mvpCount - a.mvpCount || b.avgRating - a.avgRating).slice(0, 10),
    [eligible],
  );
  const topCleanSheets = useMemo(
    () => [...eligible].filter((a) => a.cleanSheets > 0).sort((a, b) => b.cleanSheets - a.cleanSheets || a.goalsConceded - b.goalsConceded).slice(0, 10),
    [eligible],
  );
  // Super Subs: separate eligibility — at least 2 sub appearances is enough.
  const topSubs = useMemo(
    () =>
      [...aggs]
        .filter((a) => a.subMatches >= 2 && a.subImpact > 0)
        .sort((a, b) => b.subImpact - a.subImpact)
        .slice(0, 10),
    [aggs],
  );

  // Clutch leaderboard: career-wide performance during matches 11–15 vs baseline.
  const topClutch = useMemo<ClutchAgg[]>(
    () =>
      players
        .map((p) => clutchAggregate(p, matches))
        .filter((c) => c.clutch.matches >= CLUTCH_MIN_MATCHES && c.clutch.ratedMatches > 0)
        .sort((a, b) => b.ratingDelta - a.ratingDelta || b.clutch.avgRating - a.clutch.avgRating)
        .slice(0, 10),
    [players, matches],
  );


  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wider flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" /> Club Legends
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Career-wide leaderboards across all your Weekend Leagues.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 border border-border/50 rounded-md px-2 py-1">
          <Info className="h-3 w-3 text-primary" />
          Only players with {MIN_MATCHES}+ matches are eligible for the All-Time Rankings.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Leaderboard
          title="Top 10 Scorers"
          icon={<SoccerBall size={14} />}
          rows={topScorers}
          metric={(a) => `${a.goals}`}
          metricLabel="Goals"
          empty="No goals logged yet."
        />
        <Leaderboard
          title="Top 10 Playmakers"
          icon={<SoccerBoot size={14} />}
          rows={topPlaymakers}
          metric={(a) => `${a.assists}`}
          metricLabel="Assists"
          empty="No assists logged yet."
        />
        <Leaderboard
          title="Top 10 Performance"
          icon={<Sparkles className="h-4 w-4" />}
          rows={topRated}
          metric={(a) => <RatingDisplay matches={a.matches} ratedMatches={a.ratedMatches} avgRating={a.avgRating} />}
          metricLabel="Avg Rating"
          empty={`Need ${MIN_MATCHES}+ matches with a rating.`}
          subline={`Min ${MIN_MATCHES} matches · ⚠ flags Avg < 6.0`}
        />
        <Leaderboard
          title="Top 10 MVPs"
          icon={<Trophy className="h-4 w-4" />}
          rows={topMvps}
          metric={(a) => `${a.mvpCount}`}
          metricLabel="MVPs"
          empty="No MVP awards yet. Highest-rated player per match earns the badge."
        />
        <Leaderboard
          title="Top 10 Clean Sheets"
          icon={<Shield className="h-4 w-4" />}
          rows={topCleanSheets}
          metric={(a) => `${a.cleanSheets}`}
          metricLabel="CS"
          empty="No clean sheets yet."
        />
        <Leaderboard
          title="Top 10 Super Subs"
          icon={<Zap className="h-4 w-4" />}
          rows={topSubs}
          metric={(a) => a.subImpact.toFixed(2)}
          metricLabel="Impact"
          empty="No substitute appearances yet. Mark players as Sub when logging matches."
          subline="Min 2 sub appearances · (G+A/app) × √apps × rating"
        />

        <ClutchLeaderboard rows={topClutch} />
      </div>
    </AppShell>
  );
}

function ClutchLeaderboard({ rows }: { rows: ClutchAgg[] }) {
  return (
    <div className="surface-card p-5 lg:col-span-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-primary">
          <Flame className="h-4 w-4" />
          <h2 className="font-display text-lg tracking-wider">Clutch Leaderboard</h2>
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Δ Rating · Matches 11–15
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mb-3">
        Career performance during the final WL stretch vs baseline. Min {CLUTCH_MIN_MATCHES} clutch apps.
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No player has {CLUTCH_MIN_MATCHES}+ rated appearances in matches 11–15 yet.
        </div>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((c, i) => {
            const rank = i + 1;
            const medal =
              rank === 1 ? "text-amber-300" :
              rank === 2 ? "text-zinc-300" :
              rank === 3 ? "text-amber-700" :
              "text-muted-foreground";
            const delta = c.ratingDelta;
            const deltaTone = delta >= 0.0001 ? "text-primary" : delta <= -0.0001 ? "text-destructive" : "text-muted-foreground";
            const sign = delta > 0 ? "+" : "";
            return (
              <li
                key={c.player.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-md border ${
                  c.badge === "king"
                    ? "border-primary/40 bg-primary/10"
                    : c.badge === "drop"
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border/40 bg-background/50"
                }`}
              >
                <div className={`stat-num font-display text-xl w-7 text-right shrink-0 ${medal}`}>{rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate flex items-center gap-1.5">
                    {c.player.name}
                    {c.badge === "king" && (
                      <span
                        title={CLUTCH_KING_TOOLTIP}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] uppercase tracking-wider font-bold cursor-help"
                      >
                        <Flame className="h-2.5 w-2.5" /> Clutch King
                      </span>
                    )}
                    {c.badge === "drop" && (
                      <span
                        title={CLUTCH_DROP_TOOLTIP}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/20 text-destructive text-[11px] uppercase tracking-wider font-bold cursor-help"
                      >
                        <TrendingDown className="h-2.5 w-2.5" /> Pressure Drop
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    {c.player.position} · {c.clutch.matches} clutch · {c.baseline.matches} total · {c.clutch.goals}G/{c.clutch.assists}A
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-display text-base stat-num">
                    <span className="text-foreground">{c.clutch.avgRating.toFixed(2)}</span>
                    <span className="text-muted-foreground text-xs"> vs {c.baseline.avgRating.toFixed(2)}</span>
                  </div>
                  <div className={`text-[11px] font-mono ${deltaTone}`}>
                    {sign}{delta.toFixed(2)}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function Leaderboard({
  title, icon, rows, metric, metricLabel, empty, subline,
}: {
  title: string;
  icon: React.ReactNode;
  rows: PlayerAgg[];
  metric: (a: PlayerAgg) => React.ReactNode;
  metricLabel: string;
  empty: string;
  subline?: string;
}) {
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <h2 className="font-display text-lg tracking-wider">{title}</h2>
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{metricLabel}</div>
      </div>
      {subline && <div className="text-[11px] text-muted-foreground mb-3 -mt-2">{subline}</div>}
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">{empty}</div>
      ) : (
        <>
          {/* Podium: top 3 highlighted */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {top3.map((a, i) => {
              const rank = i + 1;
              const tone =
                rank === 1
                  ? { ring: "ring-2 ring-amber-300/70", bg: "bg-gradient-to-b from-amber-400/20 to-amber-500/5", medal: "text-amber-300", crown: "👑" }
                  : rank === 2
                    ? { ring: "ring-1 ring-zinc-300/60", bg: "bg-gradient-to-b from-zinc-300/15 to-zinc-400/5", medal: "text-zinc-200", crown: "🥈" }
                    : { ring: "ring-1 ring-amber-700/50", bg: "bg-gradient-to-b from-amber-700/15 to-amber-800/5", medal: "text-amber-600", crown: "🥉" };
              const isFirst = rank === 1;
              return (
                <div
                  key={a.player.id}
                  className={`relative rounded-lg p-3 flex flex-col items-center text-center ${tone.bg} ${tone.ring} ${isFirst ? "scale-[1.04]" : ""}`}
                  style={isFirst ? { boxShadow: "0 0 20px -6px rgba(250, 204, 21, 0.4)" } : undefined}
                >
                  <div className={`absolute -top-2 left-2 font-display stat-num text-base ${tone.medal}`}>
                    #{rank}
                  </div>
                  <div className="text-xl mb-1" aria-hidden>{tone.crown}</div>
                  <div className={`font-display ${isFirst ? "text-3xl" : "text-2xl"} stat-num text-primary leading-none`}>
                    {metric(a)}
                  </div>
                  <div className="font-semibold text-xs mt-2 truncate w-full" title={a.player.name}>
                    {a.player.name}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5">
                    {a.player.position} · {a.matches}MP
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact list: positions 4+ */}
          {rest.length > 0 && (
            <ol className="space-y-1.5">
              {rest.map((a, i) => {
                const rank = i + 4;
                const status = performanceStatus(a);
                const rowAlert =
                  status === "critical"
                    ? "border-warn-critical/60 bg-warn-critical/5"
                    : status === "caution"
                      ? "border-warn-caution/50 bg-warn-caution/5"
                      : "bg-background/50 border-border/40";
                return (
                  <li key={a.player.id} className={`flex items-center gap-3 px-3 py-2 rounded-md transition border ${rowAlert}`}>
                    <div className="stat-num font-display text-base w-7 text-right shrink-0 text-muted-foreground">{rank}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate flex items-center gap-1.5 text-sm">
                        {status === "critical" && <AlertTriangle className="h-3 w-3 text-warn-critical shrink-0" />}
                        {a.player.name}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                        {a.player.position} · {a.player.overall} · {a.matches} apps
                      </div>
                    </div>
                    <div className="font-display text-lg stat-num text-primary shrink-0">{metric(a)}</div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
