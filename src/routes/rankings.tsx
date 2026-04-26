import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers } from "@/lib/store";
import { aggregateAllPlayers, type PlayerAgg } from "@/lib/stats";
import { Goal, Sparkles, Wand2 } from "lucide-react";

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
  const matches = useMatches();
  const aggs = useMemo(() => aggregateAllPlayers(players, matches), [players, matches]);

  const totalMatches = matches.length;
  const minMatchesForRating = Math.max(1, Math.ceil(totalMatches / 2));

  const topScorers = useMemo(
    () => [...aggs].filter((a) => a.goals > 0).sort((a, b) => b.goals - a.goals || b.gaPerGame - a.gaPerGame).slice(0, 10),
    [aggs],
  );
  const topPlaymakers = useMemo(
    () => [...aggs].filter((a) => a.assists > 0).sort((a, b) => b.assists - a.assists || b.gaPerGame - a.gaPerGame).slice(0, 10),
    [aggs],
  );
  const topRated = useMemo(
    () =>
      [...aggs]
        .filter((a) => a.ratedMatches >= minMatchesForRating && a.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 10),
    [aggs, minMatchesForRating],
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
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Leaderboard
          title="Top 10 Scorers"
          icon={<Goal className="h-4 w-4" />}
          rows={topScorers}
          metric={(a) => `${a.goals}`}
          metricLabel="Goals"
          empty="No goals logged yet."
        />
        <Leaderboard
          title="Top 10 Playmakers"
          icon={<Wand2 className="h-4 w-4" />}
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
          empty={`Need ${minMatchesForRating} of ${totalMatches} club matches with a rating.`}
          subline={`Min ${minMatchesForRating} of ${totalMatches} club matches`}
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
