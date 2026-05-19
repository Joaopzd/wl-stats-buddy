import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers } from "@/lib/store";
import { aggregateAllPlayers, onlyWL, type PlayerAgg } from "@/lib/stats";
import { Sparkles, Trophy, Shield, Info, Zap } from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";

const MIN_MATCHES = 9;

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Club Legends — WL Tracker" },
      { name: "description", content: "Top 10 leaderboards: scorers, playmakers and best-rated players in your club." },
      { property: "og:title", content: "Club Legends · Rankings" },
      { property: "og:description", content: "Top 10 leaderboards across your career." },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const players = usePlayers();
  const allMatches = useMatches();
  // PZD Lab matches are excluded from career leaderboards.
  const matches = useMemo(() => onlyWL(allMatches), [allMatches]);
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
          metric={(a) => a.avgRating.toFixed(2)}
          metricLabel="Avg Rating"
          empty={`Need ${MIN_MATCHES}+ matches with a rating.`}
          subline={`Min ${MIN_MATCHES} matches`}
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

      </div>
    </AppShell>
  );
}

function Leaderboard({
  title, icon, rows, metric, metricLabel, empty, subline,
}: {
  title: string;
  icon: React.ReactNode;
  rows: PlayerAgg[];
  metric: (a: PlayerAgg) => string;
  metricLabel: string;
  empty: string;
  subline?: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          {icon}
          <h2 className="font-display text-lg tracking-wider">{title}</h2>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{metricLabel}</div>
      </div>
      {subline && <div className="text-[10px] text-muted-foreground mb-3 -mt-2">{subline}</div>}
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">{empty}</div>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((a, i) => {
            const rank = i + 1;
            const medal =
              rank === 1 ? "text-amber-300" :
              rank === 2 ? "text-zinc-300" :
              rank === 3 ? "text-amber-700" :
              "text-muted-foreground";
            return (
              <li key={a.player.id} className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${rank <= 3 ? "bg-primary/5 border border-primary/20" : "bg-background/50 border border-border/40"}`}>
                <div className={`stat-num font-display text-xl w-7 text-right shrink-0 ${medal}`}>{rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{a.player.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                    {a.player.position} · {a.player.overall} · {a.matches} apps
                  </div>
                </div>
                <div className="font-display text-xl stat-num text-primary shrink-0">{metric(a)}</div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
