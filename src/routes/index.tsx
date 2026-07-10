import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs, useClubName } from "@/lib/store";
import {
  aggregateAllTime,
  historicLeaders,
  platformRecords,
} from "@/lib/stats";
import { wlLabel } from "@/lib/types";
import {
  Trophy,
  Shield,
  Star,
  Award,
  Plus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users,
  Crown,
  Target,
  Percent,
  Activity,
  Medal,
} from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { WLTrendsChart } from "@/components/WLTrendsChart";
import { PositionBadge } from "@/components/PositionBadge";
import { RankBadge } from "@/components/RankBadge";
import { ClubCrest } from "@/components/ClubCrest";
import { PlatformBadge } from "@/components/PlatformBadge";
import { DashboardAIBanner } from "@/components/DashboardAIBanner";
import type { PlayerAgg } from "@/lib/stats";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — PitchSide" },
      { name: "description", content: "Your career-wide Weekend League dashboard for EA FC 26." },
      { property: "og:title", content: "PitchSide Dashboard" },
      { property: "og:description", content: "All-time wins, top scorers, MVPs and more." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const wls = useWLs();
  const matches = useMatches();
  const players = usePlayers();
  const clubName = useClubName();

  const empty = wls.length === 0 && players.length === 0;

  const summary = useMemo(() => aggregateAllTime(wls, matches), [wls, matches]);
  const platformStats = useMemo(() => platformRecords(matches), [matches]);
  const leaders = useMemo(() => historicLeaders(players, matches), [players, matches]);

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <ClubCrest size={44} />
          <div className="min-w-0 leading-tight">
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Champs Tracker</div>
            <h1 className="font-display text-lg sm:text-xl tracking-wider truncate">
              {clubName || "Your Club"}
            </h1>
          </div>
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

      {empty ? (
        <div className="surface-card p-10 text-center">
          <p className="text-muted-foreground">Nothing logged yet. Start by adding players to your database, then create your first Weekend League.</p>
        </div>
      ) : (
        <>
          {/* ---------- TIER 1: General Performance Summary ---------- */}
          <TierHeader
            icon={<Activity className="h-4 w-4 text-primary" />}
            label="Tier 1"
            title="General Performance"
            meta={`${wls.length} WL${wls.length === 1 ? "" : "s"} · ${matches.length} matches`}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 mb-8">
            <SummaryTile icon={<Trophy className="h-4 w-4 text-primary" />} label="Wins" value={summary.wins} tone="primary" />
            <SummaryTile icon={<TrendingDown className="h-4 w-4 text-destructive" />} label="Losses" value={summary.losses} tone="danger" />
            <SummaryTile icon={<SoccerBall size={16} className="text-primary" />} label="Scored" value={summary.goalsFor} />
            <SummaryTile icon={<Shield className="h-4 w-4 text-muted-foreground" />} label="Conceded" value={summary.goalsAgainst} />
            <SummaryTile
              icon={summary.goalDiff >= 0 ? <TrendingUp className="h-4 w-4 text-primary" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
              label="Goal Diff"
              value={`${summary.goalDiff >= 0 ? "+" : ""}${summary.goalDiff}`}
              tone={summary.goalDiff >= 0 ? "primary" : "danger"}
            />
            <SummaryTile
              icon={<Percent className="h-4 w-4 text-primary" />}
              label="Win Rate"
              value={`${Math.round(summary.winRate * 100)}%`}
              tone="primary"
            />
            <div className="surface-card p-3 flex flex-col gap-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" /> Best Result
              </div>
              <div className="font-display stat-num text-2xl leading-none">
                {summary.bestResult ? `${summary.bestResult.wins}W` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {summary.bestResult ? wlLabel(summary.bestResult.wl) : "no data"}
              </div>
            </div>
            <div className="surface-card p-3 flex flex-col gap-1">
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5 text-primary" /> Best / Current Rank
              </div>
              <div className="mt-1"><RankBadge rank={summary.bestRank} size="sm" /></div>
              <div className="mt-0.5"><RankBadge rank={summary.currentRank} size="sm" /></div>
            </div>
          </div>

          {/* ---------- TIER 2: Platform Analytics & AI Insights ---------- */}
          <TierHeader
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Tier 2"
            title="Platform Analytics & AI Insights"
            meta="Split by opponent's platform"
          />
          <div className="mb-4">
            <DashboardAIBanner wls={wls} matches={matches} players={players} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {platformStats.map((p) => {
              const pct = Math.round(p.winRate * 100);
              const tone = p.played === 0 ? "muted" : pct >= 60 ? "good" : pct >= 40 ? "ok" : "bad";
              const color =
                tone === "good" ? "text-primary" :
                tone === "bad" ? "text-destructive" :
                tone === "ok" ? "text-amber-300" : "text-muted-foreground";
              const bar =
                tone === "good" ? "bg-primary" :
                tone === "bad" ? "bg-destructive" :
                tone === "ok" ? "bg-amber-400" : "bg-muted-foreground/40";
              const pMatches = matches.filter((m) => m.platform === p.platform);
              let gf = 0, ga = 0;
              for (const m of pMatches) { gf += m.scoreFor; ga += m.scoreAgainst; }
              return (
                <div key={p.platform} className="surface-card p-4">
                  <div className="flex items-baseline justify-between">
                    <PlatformBadge platform={p.platform} size="sm" />
                    <div className={`font-display stat-num text-2xl ${color}`}>
                      {p.played === 0 ? "—" : `${pct}%`}
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-secondary/60 rounded overflow-hidden">
                    <div className={`h-full transition-all ${bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                    <span>{p.wins}W · {p.losses}L · {p.played} MP</span>
                    <span>{gf}·{ga}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---------- TIER 3: Visual Analytics ---------- */}
          <TierHeader
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
            label="Tier 3"
            title="Visual Analytics"
            meta="Trends across every WL"
          />
          <WLTrendsChart wls={wls} matches={matches} />

          {/* ---------- TIER 4: Historic Leaders Roll ---------- */}
          <TierHeader
            icon={<Medal className="h-4 w-4 text-primary" />}
            label="Tier 4"
            title="Historic Leaders"
            meta="Career-long benchmarks"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <LeaderPodium label="Top Scorer" agg={leaders.topScorer} metric={(a) => `${a.goals}`} sub="goals" icon={<SoccerBall size={14} className="text-primary" />} />
            <LeaderPodium label="Top Assister" agg={leaders.topAssister} metric={(a) => `${a.assists}`} sub="assists" icon={<SoccerBoot size={14} className="text-primary" />} />
            <LeaderPodium label="Top G+A" agg={leaders.topContrib} metric={(a) => `${a.ga}`} sub="contributions" icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} />
            <LeaderPodium label="Most Apps" agg={leaders.mostApps} metric={(a) => `${a.matches}`} sub="appearances" icon={<Trophy className="h-3.5 w-3.5 text-primary" />} />
          </div>

          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-primary" /> Top 3 · Highest Avg Rating
            </h3>
            <span className="text-[10px] text-muted-foreground">Min. 50% of career matches</span>
          </div>
          {leaders.topRated.length === 0 ? (
            <div className="surface-card p-5 text-sm text-muted-foreground text-center">
              Not enough rated appearances yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {leaders.topRated.map((a, i) => (
                <RatedPodium key={a.player.id} agg={a} rank={i + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

// ---------- Presentational helpers ----------

function TierHeader({
  icon,
  label,
  title,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="mt-2 mb-3 flex items-baseline justify-between gap-3">
      <div className="min-w-0 flex items-baseline gap-2">
        <span className="text-[10px] uppercase tracking-[0.35em] text-primary font-bold flex items-center gap-1.5">
          {icon} {label}
        </span>
        <h2 className="font-display text-xl sm:text-2xl tracking-wider truncate">{title}</h2>
      </div>
      {meta && <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold hidden sm:block">{meta}</span>}
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "primary" | "danger" | "muted";
}) {
  const color =
    tone === "primary" ? "text-primary" :
    tone === "danger" ? "text-destructive" :
    "text-foreground";
  return (
    <div className="surface-card p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`font-display stat-num text-2xl sm:text-3xl leading-none mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function LeaderPodium({
  label,
  agg,
  metric,
  sub,
  icon,
}: {
  label: string;
  agg: PlayerAgg | null;
  metric: (a: PlayerAgg) => string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="surface-card p-4 border-l-4 border-l-primary/70">
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
        {icon} {label}
      </div>
      {agg && agg.matches > 0 ? (
        <>
          <div className="mt-2 font-display text-base leading-tight truncate">{agg.player.name}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
            <PositionBadge position={agg.player.position} size="xs" /> {agg.player.overall} OVR
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-display stat-num text-3xl text-primary leading-none">{metric(agg)}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</span>
          </div>
        </>
      ) : (
        <div className="mt-2 text-sm text-muted-foreground">No data yet</div>
      )}
    </div>
  );
}

function RatedPodium({ agg, rank }: { agg: PlayerAgg; rank: number }) {
  const medalText =
    rank === 1 ? "text-amber-300" :
    rank === 2 ? "text-zinc-200" :
    "text-amber-500";
  const border =
    rank === 1 ? "border-amber-400/60" :
    rank === 2 ? "border-zinc-300/50" :
    "border-amber-700/50";
  return (
    <div className={`surface-card relative overflow-hidden p-4 border-l-4 ${border}`}>
      <div className={`absolute -top-2 -right-2 font-display text-[3.5rem] leading-none opacity-10 ${medalText} pointer-events-none select-none`}>
        #{rank}
      </div>
      <div className={`text-[10px] uppercase tracking-[0.25em] font-bold ${medalText}`}>Rank #{rank}</div>
      <div className="font-display text-base truncate mt-1">{agg.player.name}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
        <PositionBadge position={agg.player.position} size="xs" /> {agg.player.overall} OVR
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`font-display stat-num text-3xl leading-none ${medalText}`}>{agg.avgRating.toFixed(2)}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">avg</span>
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
        {agg.ratedMatches} rated · {agg.matches} apps
      </div>
    </div>
  );
}
