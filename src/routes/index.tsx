import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs } from "@/lib/store";
import { aggregateAllPlayers, aggregatePlayer, matchFlagTotals, performanceStatus, platformRecords, rankFromWins, UNDERPERFORM_MIN_MATCHES, wlRecord } from "@/lib/stats";
import { Trophy, Shield, Star, Award, Plus, TrendingUp, TrendingDown, Sparkles, Gamepad2, Users, Crown, AlertTriangle, Zap, Flag as FlagIcon, DoorOpen, ChevronDown, Activity } from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { WLTrendsChart } from "@/components/WLTrendsChart";
import { PositionBadge } from "@/components/PositionBadge";

import { RankBadge } from "@/components/RankBadge";
import { ClubCrest } from "@/components/ClubCrest";
import { PlatformBadge } from "@/components/PlatformBadge";
import { PlayerCard } from "@/components/PlayerCard";
import { useClubName } from "@/lib/store";


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
    let gf = 0, ga = 0, wins = 0, losses = 0;
    let possSum = 0, possCount = 0;
    let xgForSum = 0, xgForCount = 0;
    let xgAgSum = 0, xgAgCount = 0;
    for (const m of matches) {
      gf += m.scoreFor; ga += m.scoreAgainst;
      // Inline win check (avoid extra import)
      const win = m.penalties ? m.penaltyWinner === "us" : m.scoreFor > m.scoreAgainst;
      if (win) wins += 1; else losses += 1;
      if (typeof m.possessionFor === "number") { possSum += m.possessionFor; possCount += 1; }
      if (typeof m.xgFor === "number" && m.xgFor > 0) { xgForSum += m.xgFor; xgForCount += 1; }
      if (typeof m.xgAgainst === "number" && m.xgAgainst > 0) { xgAgSum += m.xgAgainst; xgAgCount += 1; }
    }
    return {
      gf, ga, wins, losses,
      avgPoss: possCount ? possSum / possCount : null,
      possCount,
      avgXgFor: xgForCount ? xgForSum / xgForCount : null,
      avgXgAg: xgAgCount ? xgAgSum / xgAgCount : null,
      xgCount: Math.max(xgForCount, xgAgCount),
    };
  }, [matches]);

  const platformStats = useMemo(() => platformRecords(matches), [matches]);
  const flags = useMemo(() => matchFlagTotals(matches), [matches]);

  const aggs = useMemo(() => aggregateAllPlayers(players, matches), [players, matches]);
  const mostApps = useMemo(() => [...aggs].filter(a => a.matches > 0).sort((a, b) => b.matches - a.matches)[0], [aggs]);
  const topScorer = useMemo(() => [...aggs].sort((a, b) => b.goals - a.goals)[0], [aggs]);
  const topAssist = useMemo(() => [...aggs].sort((a, b) => b.assists - a.assists)[0], [aggs]);
  const topGAperGame = useMemo(() => [...aggs].filter(a => a.matches >= 3).sort((a, b) => b.gaPerGame - a.gaPerGame)[0], [aggs]);

  // Top Rated: must have played at least 9 club matches.
  const RATING_MIN_MATCHES = 9;
  const topRated = useMemo(() => {
    return [...aggs]
      .filter((a) => a.matches >= RATING_MIN_MATCHES && a.avgRating > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3);
  }, [aggs]);

  // MVP of the Week: blends performance quality (rating) with availability
  // (matches played). A great rating in 1 game shouldn't beat a strong run
  // across the whole WL. Score = avgRating × sqrt(matches / totalMatches),
  // which rewards both factors with diminishing returns on participation.
  const wlMVP = useMemo(() => {
    if (!lastWL) return null;
    const wlMatches = matches.filter((m) => m.wlId === lastWL.id);
    const totalMatches = wlMatches.length;
    if (totalMatches === 0) return null;
    const all = players
      .map((p) => aggregatePlayer(p, wlMatches))
      .filter((a) => a.matches >= 1);
    if (all.length === 0) return null;
    const rated = all.filter((a) => a.ratedMatches >= 1 && a.avgRating > 0);
    if (rated.length > 0) {
      const scored = rated.map((a) => ({
        a,
        score: a.avgRating * Math.sqrt(a.matches / totalMatches),
      }));
      scored.sort(
        (x, y) =>
          y.score - x.score ||
          y.a.matches - x.a.matches ||
          (y.a.goals + y.a.assists) - (x.a.goals + x.a.assists),
      );
      return scored[0].a;
    }
    // Fallback: contribution weighted by participation
    return all.sort(
      (a, b) =>
        (b.goals + b.assists) * Math.sqrt(b.matches / totalMatches) -
          (a.goals + a.assists) * Math.sqrt(a.matches / totalMatches) ||
        b.matches - a.matches,
    )[0];
  }, [lastWL, matches, players]);

  const empty = wls.length === 0 && players.length === 0;
  // Squad Alerts: outfield starters with 9+ matches who are statistically
  // underperforming (avg rating below 6.5 — covers both "caution" and
  // "critical" tiers). Goalkeepers are excluded — this EA FC version has
  // very high scoring, so GK ratings are systemically lower and would
  // generate false positives. We still surface a GK separately below.
  const squadAlerts = useMemo(() => {
    const starterIds = new Set<string>();
    for (const wl of wls) {
      const assignments = wl.startingAssignments ?? {};
      for (const pid of Object.values(assignments)) if (pid) starterIds.add(pid);
    }
    return aggs
      .filter((a) => starterIds.has(a.player.id))
      .filter((a) => a.player.position !== "GK")
      .filter((a) => {
        const s = performanceStatus(a);
        return s === "critical" || s === "caution";
      })
      .sort((x, y) => x.avgRating - y.avgRating);
  }, [aggs, wls]);

  const clubName = useClubName();

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
          {/* Top tiles: Last WL + All-time Best */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="surface-card p-4 border-l-4 border-l-primary">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> {lastWL ? `WL #${lastWL.number}` : "Last WL"}
              </div>
              <div className="font-display text-3xl stat-num mt-1 text-foreground leading-none">
                {lastRecord ? `${lastRecord.wins}-${lastRecord.losses}` : "—"}
              </div>
              <div className="mt-2">
                {lastRecord
                  ? <RankBadge rank={rankFromWins(lastRecord.wins)} size="sm" />
                  : <span className="text-[11px] text-muted-foreground">No WLs yet</span>}
              </div>
            </div>
            <div className="surface-card p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" /> All-time Best
              </div>
              <div className="font-display text-3xl stat-num mt-1 leading-none">
                {bestWL ? `${bestWL.wins}W` : "—"}
              </div>
              <div className="mt-2">
                {bestWL
                  ? <RankBadge rank={rankFromWins(bestWL.wins)} size="sm" />
                  : <span className="text-[11px] text-muted-foreground">—</span>}
              </div>
            </div>
          </div>

          {/* Cumulative Performance — wins/losses/goals/GD all in one hero panel */}
          {(() => {
            const gd = totals.gf - totals.ga;
            const positive = gd >= 0;
            const totalMatches = totals.wins + totals.losses;
            const winRate = totalMatches ? Math.round((totals.wins / totalMatches) * 100) : 0;
            return (
              <section className="surface-glow mb-8 overflow-hidden">
                <div className="px-5 sm:px-7 pt-5 pb-3 flex items-baseline justify-between gap-3 border-b border-border/60">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold flex items-center gap-2">
                      <Activity className="h-3.5 w-3.5" /> Cumulative Performance
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Across {wls.length} WL{wls.length === 1 ? "" : "s"} · {matches.length} matches
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display stat-num text-3xl text-foreground leading-none">{winRate}%</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1 font-bold">Win Rate</div>
                  </div>
                </div>

                {/* Wins / Losses big number row */}
                <div className="grid grid-cols-2 border-b border-border/60">
                  <div className="px-5 py-4 flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="font-display stat-num text-4xl sm:text-5xl text-primary leading-none">{totals.wins}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 font-bold">Wins</div>
                    </div>
                  </div>
                  <div className="px-5 py-4 flex items-center gap-3 border-l border-border/60">
                    <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
                    <div>
                      <div className="font-display stat-num text-4xl sm:text-5xl text-destructive leading-none">{totals.losses}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 font-bold">Losses</div>
                    </div>
                  </div>
                </div>

                {/* Goals belt: scored / conceded / GD */}
                <div className="grid grid-cols-3 bg-background/40">
                  <div className="px-4 py-3.5 flex items-center gap-2.5">
                    <SoccerBall size={18} className="text-primary shrink-0" />
                    <div>
                      <div className="font-display stat-num text-2xl text-foreground leading-none">{totals.gf}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 font-bold">Scored</div>
                    </div>
                  </div>
                  <div className="px-4 py-3.5 flex items-center gap-2.5 border-l border-border/60">
                    <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="font-display stat-num text-2xl text-foreground leading-none">{totals.ga}</div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 font-bold">Conceded</div>
                    </div>
                  </div>
                  <div className="px-4 py-3.5 flex items-center gap-2.5 border-l border-border/60">
                    {positive
                      ? <TrendingUp className="h-4 w-4 text-primary shrink-0" />
                      : <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
                    <div>
                      <div className={`font-display stat-num text-2xl leading-none ${positive ? "text-primary" : "text-destructive"}`}>
                        {positive ? "+" : ""}{gd}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 font-bold">Goal Diff</div>
                    </div>
                  </div>
                </div>

                {/* Advanced averages: possession + xG */}
                <div className="grid grid-cols-3 border-t border-border/60">
                  <div className="px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-primary" /> Avg Possession
                    </div>
                    <div className="font-display stat-num text-xl mt-0.5 leading-none">
                      {totals.avgPoss === null ? "—" : `${Math.round(totals.avgPoss)}%`}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                      {totals.possCount ? `${totals.possCount} logged` : "no data"}
                    </div>
                  </div>
                  <div className="px-4 py-3 border-l border-border/60">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" /> Avg xG · You
                    </div>
                    <div className="font-display stat-num text-xl mt-0.5 leading-none text-primary">
                      {totals.avgXgFor === null ? "—" : totals.avgXgFor.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono">per match</div>
                  </div>
                  <div className="px-4 py-3 border-l border-border/60">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
                      <TrendingDown className="h-3 w-3 text-destructive" /> Avg xG · Against
                    </div>
                    <div className="font-display stat-num text-xl mt-0.5 leading-none text-destructive">
                      {totals.avgXgAg === null ? "—" : totals.avgXgAg.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono">per match</div>
                  </div>
                </div>
              </section>
            );
          })()}

          <Collapsible
            title="Platform Performance"
            icon={<Gamepad2 className="h-3.5 w-3.5 text-primary" />}
            meta="Win rate by platform"
            defaultOpen={false}
          >
            <div className="grid grid-cols-3 gap-3">
              {platformStats.map((p) => {
                const pct = Math.round(p.winRate * 100);
                const tone = p.played === 0 ? "muted" : pct >= 60 ? "good" : pct >= 40 ? "ok" : "bad";
                const color = tone === "good" ? "text-primary" : tone === "bad" ? "text-destructive" : tone === "ok" ? "text-amber-300" : "text-muted-foreground";
                const bar = tone === "good" ? "bg-primary" : tone === "bad" ? "bg-destructive" : tone === "ok" ? "bg-amber-400" : "bg-muted-foreground/40";
                return (
                  <div key={p.platform} className="rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="flex items-baseline justify-between">
                      <PlatformBadge platform={p.platform} size="sm" />
                      <div className={`font-display stat-num text-2xl ${color}`}>
                        {p.played === 0 ? "—" : `${pct}%`}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-secondary/60 rounded overflow-hidden">
                      <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground font-mono">
                      {p.wins}W · {p.losses}L · {p.played} matches
                    </div>
                  </div>
                );
              })}
            </div>
          </Collapsible>

          <Collapsible
            title="Match Flags"
            icon={<FlagIcon className="h-3.5 w-3.5 text-primary" />}
            meta={`Across ${flags.played} match${flags.played === 1 ? "" : "es"}`}
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <Zap className="h-3 w-3 text-amber-300" /> Extra Time
                </div>
                <div className="font-display stat-num text-3xl mt-1 leading-none">{flags.extraTime}</div>
                <div className="text-[11px] text-muted-foreground mt-1">matches went to ET</div>
              </div>
              <div className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <FlagIcon className="h-3 w-3 text-primary" /> Penalties
                </div>
                <div className="font-display stat-num text-3xl mt-1 leading-none">{flags.penalties}</div>
                <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                  <span className="text-primary">{flags.penaltiesWon}W</span>
                  <span className="text-muted-foreground/50 mx-1">·</span>
                  <span className="text-destructive">{flags.penaltiesLost}L</span>
                </div>
              </div>
              <div className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <DoorOpen className="h-3 w-3 text-primary" /> RQ — Opponent
                </div>
                <div className="font-display stat-num text-3xl mt-1 leading-none text-primary">{flags.rageQuitThem}</div>
                <div className="text-[11px] text-muted-foreground mt-1">they bottled it</div>
              </div>
              <div className="rounded-md border border-border/60 bg-background/40 p-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <DoorOpen className="h-3 w-3 text-destructive" /> RQ — Me
                </div>
                <div className="font-display stat-num text-3xl mt-1 leading-none text-destructive">{flags.rageQuitUs}</div>
                <div className="text-[11px] text-muted-foreground mt-1">times I quit early</div>
              </div>
            </div>
          </Collapsible>

          {wlMVP && lastWL && <MVPCard agg={wlMVP} wlNumber={lastWL.number} />}



          <WLTrendsChart wls={wls} matches={matches} />

          {squadAlerts.length > 0 && (
            <div className="surface-card p-5 mb-8 border-l-4 border-l-warn-caution">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[11px] uppercase tracking-[0.3em] text-warn-caution font-bold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> Squad Alerts
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Outfield starters · avg rating below 6.5 (min. {UNDERPERFORM_MIN_MATCHES} apps)
                </span>
              </div>
              <div className="divide-y divide-border/40">
                {squadAlerts.map((a) => {
                  const critical = performanceStatus(a) === "critical";
                  return (
                    <div key={a.player.id} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        {critical && <AlertTriangle className="h-3.5 w-3.5 text-warn-critical shrink-0" />}
                        <span className="font-semibold truncate">{a.player.name}</span>
                        <PositionBadge position={a.player.position} size="xs" />
                        <span className="text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
                          {a.matches} apps
                        </span>
                      </div>
                      <span className={`font-display stat-num text-lg ${critical ? "text-warn-critical" : "text-warn-caution"}`}>
                        {a.avgRating.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <h2 className="font-display text-2xl tracking-wider mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Club Legends
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <LegendCard label="Most Apps" agg={mostApps} metric={(a) => `${a.matches} matches`} accentIcon={<Trophy className="h-3.5 w-3.5 text-primary" />} />
            <LegendCard label="Top Scorer" agg={topScorer} metric={(a) => `${a.goals} goals`} accentIcon={<SoccerBall size={14} className="text-primary" />} />
            <LegendCard label="Top Assister" agg={topAssist} metric={(a) => `${a.assists} assists`} accentIcon={<SoccerBoot size={14} className="text-accent" />} />
            <LegendCard label="Best G/A per game" agg={topGAperGame} metric={(a) => `${a.gaPerGame.toFixed(2)}`} sub="min. 3 matches" accentIcon={<Sparkles className="h-3.5 w-3.5 text-primary" />} />
          </div>

          <h2 className="font-display text-2xl tracking-wider mt-10 mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Top Rated Players
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Career average match rating · must have played at least 9 club matches.
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

function MVPCard({
  agg,
  wlNumber,
}: {
  agg: ReturnType<typeof aggregateAllPlayers>[number];
  wlNumber: number;
}) {
  return (
    <div
      className="surface-card p-5 mb-8 border-l-4 border-l-primary relative overflow-hidden"
      style={{ boxShadow: "0 0 22px -10px color-mix(in oklab, var(--primary) 45%, transparent)" }}
    >
      <Crown className="absolute -right-3 -top-3 h-24 w-24 text-primary/10 pointer-events-none" />
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-md grid place-items-center bg-primary/15 text-primary border border-primary/30 overflow-hidden relative">
          {agg.player.imageUrl ? (
            <img
              src={agg.player.imageUrl}
              alt={agg.player.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <Crown className="h-7 w-7" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold">MVP of the Week</span>
            <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[11px] font-bold uppercase tracking-wider border border-primary/30">
              WL #{wlNumber}
            </span>
          </div>
          <div className="font-display text-2xl truncate mt-0.5">{agg.player.name}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <PositionBadge position={agg.player.position} size="xs" /> {agg.player.overall} OVR · {agg.player.rarity}
          </div>
          {/* Mini Player-of-the-Match stat row */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1 text-foreground font-semibold">
              <SoccerBall size={13} className="text-primary" /> {agg.goals}
              <span className="text-muted-foreground font-normal">G</span>
            </span>
            <span className="inline-flex items-center gap-1 text-foreground font-semibold">
              <SoccerBoot size={13} className="text-accent" /> {agg.assists}
              <span className="text-muted-foreground font-normal">A</span>
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Trophy className="h-3 w-3" /> {agg.matches} apps
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {agg.ratedMatches > 0 ? (
            <>
              <div className="font-display stat-num text-4xl text-primary leading-none">{agg.avgRating.toFixed(2)}</div>
              <div className="text-[11px] text-muted-foreground mt-1">Avg · {agg.ratedMatches} rated</div>
            </>
          ) : (
            <>
              <div className="font-display stat-num text-4xl text-primary leading-none">{agg.goals + agg.assists}</div>
              <div className="text-[11px] text-muted-foreground mt-1">G+A · no ratings yet</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RatedCard({ agg, rank }: { agg: ReturnType<typeof aggregateAllPlayers>[number]; rank: number }) {
  const isTop = rank === 1;
  const medalBg =
    rank === 1 ? "from-amber-400/30 to-amber-500/5 border-amber-400/60" :
    rank === 2 ? "from-zinc-300/25 to-zinc-400/5 border-zinc-300/50" :
    "from-amber-700/25 to-amber-800/5 border-amber-700/50";
  const medalText =
    rank === 1 ? "text-amber-300" :
    rank === 2 ? "text-zinc-200" :
    "text-amber-500";
  return (
    <div className={`surface-card relative overflow-hidden p-5 bg-gradient-to-br ${medalBg} ${isTop ? "shadow-[0_0_30px_-15px_color-mix(in_oklab,var(--primary)_60%,transparent)]" : ""}`}>
      <div className={`absolute -top-2 -left-2 font-display text-[5rem] leading-none opacity-10 ${medalText} pointer-events-none select-none`}>
        #{rank}
      </div>
      <div className="relative flex items-center gap-4">
        <PlayerCard
          name={agg.player.name}
          overall={agg.player.overall}
          position={agg.player.position}
          rarity={agg.player.rarity}
          imageUrl={agg.player.imageUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <div className={`text-[11px] uppercase tracking-[0.25em] font-bold ${medalText}`}>Rank #{rank}</div>
          <div className="font-display text-xl truncate mt-0.5">{agg.player.name}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
            <PositionBadge position={agg.player.position} size="xs" /> {agg.player.overall} OVR
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={`font-display stat-num text-4xl ${medalText}`}>{agg.avgRating.toFixed(2)}</span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">avg</span>
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
            {agg.ratedMatches} rated · {agg.matches} apps
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendCard({
  label,
  agg,
  metric,
  sub,
  accentIcon,
}: {
  label: string;
  agg: ReturnType<typeof aggregateAllPlayers>[number] | undefined;
  metric: (a: ReturnType<typeof aggregateAllPlayers>[number]) => string;
  sub?: string;
  accentIcon?: React.ReactNode;
}) {
  return (
    <div className="surface-card relative overflow-hidden p-5 border-l-4 border-l-primary/70 hover:border-l-primary transition-colors">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
        {accentIcon}
        {label}
      </div>
      {agg && agg.matches > 0 ? (
        <div className="mt-3 flex items-center gap-3">
          <PlayerCard
            name={agg.player.name}
            overall={agg.player.overall}
            position={agg.player.position}
            rarity={agg.player.rarity}
            imageUrl={agg.player.imageUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="font-display text-base truncate leading-tight">{agg.player.name}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
              <PositionBadge position={agg.player.position} size="xs" /> {agg.player.overall} OVR
            </div>
            <div className="mt-2 font-display stat-num text-2xl text-primary leading-none">{metric(agg)}</div>
            {sub && <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>}
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">No data yet</div>
      )}
    </div>
  );
}

/** Collapsible card section used on the Dashboard. */
function Collapsible({
  title,
  icon,
  meta,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  meta?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="surface-card mb-8 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/40 transition-all duration-300 ease-in-out"
      >
        <h3 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold flex items-center gap-2">
          {icon} {title}
        </h3>
        <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {meta && <span>{meta}</span>}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}


