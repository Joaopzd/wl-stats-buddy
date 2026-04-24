import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { useMatches, usePlayers, useWLs } from "@/lib/store";
import { aggregateAllPlayers, rankFromWins, wlRecord } from "@/lib/stats";
import { Trophy, Target, Shield, Star, Award, Plus, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WL Tracker" },
      { name: "description", content: "Your career-wide Weekend League dashboard for EA FC 26." },
      { property: "og:title", content: "WL Tracker Dashboard" },
      { property: "og:description", content: "All-time wins, top scorers, MVPs and more." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const wls = useWLs();
  const matches = useMatches();
  const players = usePlayers();

  const sortedWLs = useMemo(() => [...wls].sort((a, b) => b.number - a.number), [wls]);
  const lastWL = sortedWLs[0];
  const lastRecord = lastWL ? wlRecord(lastWL, matches) : null;

  const bestWL = useMemo(() => {
    let best: { wl: typeof wls[number]; wins: number; losses: number } | null = null;
    for (const wl of wls) {
      const r = wlRecord(wl, matches);
      if (!best || r.wins > best.wins) best = { wl, wins: r.wins, losses: r.losses };
    }
    return best;
  }, [wls, matches]);

  const totals = useMemo(() => {
    let gf = 0, ga = 0;
    for (const m of matches) { gf += m.scoreFor; ga += m.scoreAgainst; }
    return { gf, ga };
  }, [matches]);

  const aggs = useMemo(() => aggregateAllPlayers(players, matches), [players, matches]);
  const mostApps = useMemo(() => [...aggs].filter(a => a.matches > 0).sort((a, b) => b.matches - a.matches)[0], [aggs]);
  const topScorer = useMemo(() => [...aggs].sort((a, b) => b.goals - a.goals)[0], [aggs]);
  const topAssist = useMemo(() => [...aggs].sort((a, b) => b.assists - a.assists)[0], [aggs]);
  const topGAperGame = useMemo(() => [...aggs].filter(a => a.matches >= 3).sort((a, b) => b.gaPerGame - a.gaPerGame)[0], [aggs]);

  // Top Rated: must have played >= 50% of total club matches.
  const totalClubMatches = matches.length;
  const ratingMinMatches = Math.max(1, Math.ceil(totalClubMatches / 2));
  const topRated = useMemo(() => {
    return [...aggs]
      .filter((a) => a.ratedMatches >= ratingMinMatches && a.avgRating > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3);
  }, [aggs, ratingMinMatches]);

  const empty = wls.length === 0 && players.length === 0;

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-2xl border border-border/60 mb-8 p-6 sm:p-10" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative z-10 max-w-2xl">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">EA FC 26 · Champs Tracker</div>
          <h1 className="font-display text-4xl sm:text-6xl mt-2 leading-none">
            Your Weekend League, <span className="text-gradient-primary">decoded</span>.
          </h1>
          <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-xl">
            Log every match, track your squad's performance, and uncover MVPs, streaks and weak links — one Champs at a time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/weekend-leagues" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition shadow-[var(--shadow-neon)]">
              <Plus className="h-4 w-4" /> New WL
            </Link>
            <Link to="/players" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border bg-secondary/50 text-foreground font-semibold uppercase tracking-wider text-sm hover:bg-secondary transition">
              Manage Squad
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 opacity-30 pointer-events-none hidden sm:block">
          <Trophy className="h-64 w-64 text-primary" strokeWidth={0.6} />
        </div>
      </section>

      {empty ? (
        <div className="surface-card p-10 text-center">
          <p className="text-muted-foreground">Nothing logged yet. Start by adding players to your database, then create your first Weekend League.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatTile
              label={lastWL ? `WL #${lastWL.number}` : "Last WL"}
              value={lastRecord ? `${lastRecord.wins}-${lastRecord.losses}` : "—"}
              sub={lastRecord ? `${rankFromWins(lastRecord.wins)} · ${lastRecord.played}/15` : "No WLs yet"}
              accent
              icon={<Trophy />}
            />
            <StatTile
              label="All-time best"
              value={bestWL ? `${bestWL.wins}W` : "—"}
              sub={bestWL ? `${rankFromWins(bestWL.wins)} · WL #${bestWL.wl.number}` : ""}
              icon={<Award />}
            />
            <StatTile label="Goals scored" value={totals.gf} icon={<Target />} />
            <StatTile label="Goals conceded" value={totals.ga} icon={<Shield />} />
          </div>

          {(() => {
            const gd = totals.gf - totals.ga;
            const positive = gd >= 0;
            return (
              <div className="surface-card p-5 mb-8 flex items-center justify-between gap-4 border-l-4" style={{ borderLeftColor: positive ? "hsl(var(--primary))" : "hsl(var(--destructive))" }}>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold flex items-center gap-2">
                    {positive ? <TrendingUp className="h-3.5 w-3.5 text-primary" /> : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                    Cumulative Goal Difference
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Across all {wls.length} WL{wls.length === 1 ? "" : "s"} · {matches.length} matches</div>
                </div>
                <div className={`font-display text-5xl stat-num ${positive ? "text-primary" : "text-destructive"}`}>
                  {positive ? "+" : ""}{gd}
                </div>
              </div>
            );
          })()}

          <h2 className="font-display text-2xl tracking-wider mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Club Legends
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LegendCard label="Most Apps" agg={mostApps} metric={(a) => `${a.matches} matches`} />
            <LegendCard label="Top Scorer" agg={topScorer} metric={(a) => `${a.goals} goals`} />
            <LegendCard label="Top Assister" agg={topAssist} metric={(a) => `${a.assists} assists`} />
            <LegendCard label="Best G/A per game" agg={topGAperGame} metric={(a) => `${a.gaPerGame.toFixed(2)}`} sub="min. 3 matches" />
          </div>

          <h2 className="font-display text-2xl tracking-wider mt-10 mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Top Rated Players
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Career average match rating · must have played at least {ratingMinMatches} of {totalClubMatches} club matches (50%).
          </p>
          {topRated.length === 0 ? (
            <div className="surface-card p-6 text-sm text-muted-foreground text-center">
              Not enough rated appearances yet. Log match ratings to populate this leaderboard.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topRated.map((a, i) => (
                <RatedCard key={a.player.id} agg={a} rank={i + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function RatedCard({ agg, rank }: { agg: ReturnType<typeof aggregateAllPlayers>[number]; rank: number }) {
  const medal = rank === 1 ? "text-primary" : rank === 2 ? "text-foreground" : "text-muted-foreground";
  return (
    <div className={`surface-card p-5 border-l-4 ${rank === 1 ? "border-l-primary" : "border-l-border"}`}>
      <div className="flex items-baseline justify-between">
        <div className={`font-display text-3xl ${medal}`}>#{rank}</div>
        <div className="font-display text-4xl stat-num text-primary">{agg.avgRating.toFixed(2)}</div>
      </div>
      <div className="mt-2 font-display text-xl truncate">{agg.player.name}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {agg.player.position} · {agg.player.overall} OVR · {agg.player.rarity}
      </div>
      <div className="text-[10px] text-muted-foreground mt-1">
        {agg.ratedMatches} rated apps · {agg.matches} total
      </div>
    </div>
  );
}

function LegendCard({
  label,
  agg,
  metric,
  sub,
}: {
  label: string;
  agg: ReturnType<typeof aggregateAllPlayers>[number] | undefined;
  metric: (a: ReturnType<typeof aggregateAllPlayers>[number]) => string;
  sub?: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{label}</div>
      {agg && agg.matches > 0 ? (
        <>
          <div className="mt-2 font-display text-2xl truncate">{agg.player.name}</div>
          <div className="text-xs text-muted-foreground">{agg.player.position} · {agg.player.overall} OVR · {agg.player.rarity}</div>
          <div className="mt-3 stat-num text-primary text-lg">{metric(agg)}</div>
          {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
        </>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">No data yet</div>
      )}
    </div>
  );
}
