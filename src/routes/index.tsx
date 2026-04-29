import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { useMatches, usePlayers, useWLs } from "@/lib/store";
import { aggregateAllPlayers, platformRecords, rankFromWins, wlRecord } from "@/lib/stats";
import { Trophy, Target, Shield, Star, Award, Plus, TrendingUp, TrendingDown, Sparkles, Gamepad2, Users } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { ClubCrestUploader } from "@/components/ClubCrestUploader";

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

  const platformStats = useMemo(() => platformRecords(matches), [matches]);

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
      <header className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <ClubCrest size={28} />
          <h1 className="font-display text-sm sm:text-base tracking-[0.3em] uppercase truncate">
            Champs Tracker
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/weekend-leagues"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-[11px] hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" /> New WL
          </Link>
          <Link
            to="/players"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary/50 text-foreground font-semibold uppercase tracking-wider text-[11px] hover:bg-secondary transition"
          >
            <Users className="h-3.5 w-3.5" /> Squad
          </Link>
        </div>
      </header>

      <div className="mb-6">
        <ClubCrestUploader />
      </div>


      {empty ? (
        <div className="surface-card p-10 text-center">
          <p className="text-muted-foreground">Nothing logged yet. Start by adding players to your database, then create your first Weekend League.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="surface-card p-4 border-l-4 border-l-primary">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> {lastWL ? `WL #${lastWL.number}` : "Last WL"}
              </div>
              <div className="font-display text-3xl stat-num mt-1 text-primary leading-none">
                {lastRecord ? `${lastRecord.wins}-${lastRecord.losses}` : "—"}
              </div>
              <div className="mt-2">
                {lastRecord
                  ? <RankBadge rank={rankFromWins(lastRecord.wins)} size="sm" />
                  : <span className="text-[10px] text-muted-foreground">No WLs yet</span>}
              </div>
            </div>
            <div className="surface-card p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" /> All-time Best
              </div>
              <div className="font-display text-3xl stat-num mt-1 leading-none">
                {bestWL ? `${bestWL.wins}W` : "—"}
              </div>
              <div className="mt-2">
                {bestWL
                  ? <RankBadge rank={rankFromWins(bestWL.wins)} size="sm" />
                  : <span className="text-[10px] text-muted-foreground">—</span>}
              </div>
            </div>
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

          <div className="surface-card p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold flex items-center gap-2">
                <Gamepad2 className="h-3.5 w-3.5 text-primary" /> Platform Performance
              </h3>
              <span className="text-[10px] text-muted-foreground">Win rate by platform</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {platformStats.map((p) => {
                const pct = Math.round(p.winRate * 100);
                const tone = p.played === 0 ? "muted" : pct >= 60 ? "good" : pct >= 40 ? "ok" : "bad";
                const color = tone === "good" ? "text-primary" : tone === "bad" ? "text-destructive" : tone === "ok" ? "text-amber-300" : "text-muted-foreground";
                const bar = tone === "good" ? "bg-primary" : tone === "bad" ? "bg-destructive" : tone === "ok" ? "bg-amber-400" : "bg-muted-foreground/40";
                return (
                  <div key={p.platform} className="rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="flex items-baseline justify-between">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {p.platform}
                      </div>
                      <div className={`font-display stat-num text-2xl ${color}`}>
                        {p.played === 0 ? "—" : `${pct}%`}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-secondary/60 rounded overflow-hidden">
                      <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground font-mono">
                      {p.wins}W · {p.losses}L · {p.played} matches
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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
