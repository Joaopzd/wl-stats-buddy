import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, Flame, Star, TrendingDown, X, LayoutGrid, TrendingUp, Shield, Crown, Zap, ChevronDown, Target, Activity } from "lucide-react";
import { SoccerBall } from "./icons/SoccerBall";
import { SoccerBoot } from "./icons/SoccerBoot";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { wlLabel } from "@/lib/types";
import { aggregatePlayer, clutchAggregate, CLUTCH_MIN_MATCHES, CLUTCH_KING_TOOLTIP, CLUTCH_DROP_TOOLTIP, performanceStatus, rankFromWins, type ClutchAgg, type WLRecord } from "@/lib/stats";
import { RatingDisplay } from "@/components/RatingDisplay";
import { AlertTriangle } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { ClubCrest } from "@/components/ClubCrest";
import { OpponentCrest } from "@/components/OpponentCrest";
import { store, useOpponentName } from "@/lib/store";

/** 0, 0.5, 1.0 … 10.0 — values offered in the Manager Rating dropdown. */
const MANAGER_RATING_OPTIONS = Array.from({ length: 21 }, (_, i) => i * 0.5);

export function ReportModal({
  wl,
  matches,
  players,
  record,
  streak,
  onClose,
  onBackToList,
}: {
  wl: WeekendLeague;
  matches: Match[];
  players: Player[];
  record: WLRecord;
  streak: number;
  onClose: () => void;
  onBackToList: () => void;
}) {
  const opponentName = useOpponentName();
  const squad = players.filter((p) => wl.squadPlayerIds.includes(p.id));
  const aggs = squad.map((p) => aggregatePlayer(p, matches));

  let totalG = 0, totalA = 0;
  for (const m of matches) {
    for (const p of m.performances) {
      totalG += p.goals;
      totalA += p.assists;
    }
  }

  const mvp = [...aggs].sort((a, b) => b.ga - a.ga || b.goals - a.goals)[0];
  const topScorer = [...aggs].filter((a) => a.goals > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists)[0];
  const topAssister = [...aggs].filter((a) => a.assists > 0).sort((a, b) => b.assists - a.assists || b.goals - a.goals)[0];

  const minMatches = Math.ceil(matches.length / 2);
  const eligible = aggs.filter((a) => a.matches >= minMatches);
  const under = eligible.length
    ? [...eligible].sort((a, b) => a.gaPerGame - b.gaPerGame || a.avgRating - b.avgRating)[0]
    : null;

  const rank = rankFromWins(record.wins);

  const gfPerMatch = matches.length ? totalG / matches.length : 0;
  const gaPerMatch = matches.length ? record.goalsAgainst / matches.length : 0;
  const gd = totalG - record.goalsAgainst;
  const winPct = matches.length ? Math.round((record.wins / matches.length) * 100) : 0;
  const clubName = wl.clubName || "My Club";

  // Possession / xG averages for matches that recorded them.
  let possSum = 0, possCount = 0, xgFor = 0, xgForC = 0, xgAg = 0, xgAgC = 0;
  for (const m of matches) {
    if (typeof m.possessionFor === "number") { possSum += m.possessionFor; possCount += 1; }
    if (typeof m.xgFor === "number" && m.xgFor > 0) { xgFor += m.xgFor; xgForC += 1; }
    if (typeof m.xgAgainst === "number" && m.xgAgainst > 0) { xgAg += m.xgAgainst; xgAgC += 1; }
  }
  const avgPoss = possCount ? Math.round(possSum / possCount) : null;
  const avgXgFor = xgForC ? xgFor / xgForC : null;
  const avgXgAg = xgAgC ? xgAg / xgAgC : null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl my-auto relative rounded-2xl overflow-hidden border border-border bg-card shadow-[var(--shadow-card)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-foreground/80 hover:text-foreground bg-black/20 hover:bg-black/40 rounded-full p-1.5">
          <X className="h-4 w-4" />
        </button>

        {/* MATCH-CENTER STYLE HEADER */}
        <div
          className="relative px-5 sm:px-8 pt-7 pb-6"
          style={{ background: "linear-gradient(135deg, #1D2344 0%, #282F54 55%, #1D2344 100%)" }}
        >
          {/* Pitch lines overlay */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
            backgroundImage: "repeating-linear-gradient(90deg, transparent 0 39px, rgba(255,255,255,0.5) 39px 40px)",
          }} />

          <div className="relative">
            <div className="text-center mb-4">
              <div className="text-[11px] uppercase tracking-[0.4em] text-primary font-bold">FULL TIME · WEEKEND LEAGUE</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">{wlLabel(wl)}</div>
            </div>

            {/* Crests + Scoreline */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              {/* Home (You) */}
              <div className="flex flex-col items-center text-center">
                <ClubCrest size={64} overrideUrl={wl.clubCrestUrl} />
                <div className="mt-2 font-display text-base sm:text-lg tracking-wider font-bold uppercase truncate max-w-full">
                  {clubName}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">You</div>
              </div>

              {/* Wins / Losses — the headline result */}
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-3 leading-none">
                  <span className="font-display stat-num text-6xl sm:text-7xl text-primary font-bold tabular-nums">{record.wins}</span>
                  <span className="text-3xl text-muted-foreground font-display">–</span>
                  <span className="font-display stat-num text-6xl sm:text-7xl text-foreground font-bold tabular-nums">{record.losses}</span>
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Wins · Losses</div>
                <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  gd >= 0
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-destructive/15 text-destructive border border-destructive/30"
                }`}>
                  {gd >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {totalG}–{record.goalsAgainst} · GD {gd >= 0 ? "+" : ""}{gd}
                </div>
              </div>

              {/* Away (Average opponent) */}
              <div className="flex flex-col items-center text-center">
                <OpponentCrest size={64} />
                <div className="mt-2 font-display text-base sm:text-lg tracking-wider font-bold uppercase truncate max-w-full">
                  {opponentName || "Opponents"}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Aggregate</div>
              </div>
            </div>

            {/* Rank + meta strip */}
            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
              <RankBadge rank={rank} size="lg" />
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/70 text-foreground text-[11px] font-bold uppercase tracking-wider">
                <Trophy className="h-3 w-3 text-primary" /> {record.wins}W · {record.losses}L · {winPct}%
              </span>
              {wl.formation && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/70 text-foreground text-[11px] font-bold uppercase tracking-wider">
                  <LayoutGrid className="h-3 w-3" /> {wl.formation}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/70 text-foreground text-[11px] font-bold uppercase tracking-wider">
                <Flame className="h-3 w-3 text-primary" /> Best {streak}
              </span>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="px-5 sm:px-7 py-6">
          {/* MATCH STATS — Sofascore/Fotmob bar style */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4 mb-5">
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" /> Match Stats
            </div>
            <StatBar leftLabel="Goals" leftVal={totalG} rightVal={record.goalsAgainst} leftAccent />
            <StatBar leftLabel="Goals / Match" leftVal={gfPerMatch.toFixed(2)} rightVal={gaPerMatch.toFixed(2)} leftAccent={gfPerMatch >= gaPerMatch} />
            {avgPoss !== null && (
              <StatBar leftLabel="Possession" leftVal={`${avgPoss}%`} rightVal={`${100 - avgPoss}%`} leftAccent={avgPoss >= 50} leftPct={avgPoss} />
            )}
            {avgXgFor !== null && avgXgAg !== null && (
              <StatBar
                leftLabel="xG / Match"
                leftVal={avgXgFor.toFixed(2)}
                rightVal={avgXgAg.toFixed(2)}
                leftAccent={avgXgFor >= avgXgAg}
                icon={<Target className="h-3 w-3" />}
              />
            )}
            <StatBar leftLabel="Total Assists" leftVal={totalA} rightVal={"—"} leftAccent icon={<SoccerBoot size={12} />} />
          </div>

          {/* AWARDS BLOCK */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4 mb-5">
            <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-foreground mb-3 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-primary" /> Awards
            </div>
            {mvp && mvp.matches > 0 && (
              <Award
                type="MVP"
                color="primary"
                icon={<Star className="h-5 w-5" />}
                name={mvp.player.name}
                sub={`${mvp.player.position} · ${mvp.player.overall} · ${mvp.player.rarity}`}
                stat={`${mvp.goals}G + ${mvp.assists}A · avg ${mvp.avgRating > 0 ? mvp.avgRating.toFixed(2) : "—"} · ${mvp.matches} apps`}
              />
            )}

            {topScorer && (
              <Award
                type="Top Scorer"
                color="primary"
                icon={<SoccerBall size={20} />}
                name={topScorer.player.name}
                sub={`${topScorer.player.position} · ${topScorer.player.overall} · ${topScorer.player.rarity}`}
                stat={`${topScorer.goals} goals · ${(topScorer.goals / Math.max(1, topScorer.matches)).toFixed(2)} G/match · ${topScorer.matches} apps`}
              />
            )}

            {topAssister && (
              <Award
                type="Top Assister"
                color="primary"
                icon={<SoccerBoot size={20} />}
                name={topAssister.player.name}
                sub={`${topAssister.player.position} · ${topAssister.player.overall} · ${topAssister.player.rarity}`}
                stat={`${topAssister.assists} assists · ${(topAssister.assists / Math.max(1, topAssister.matches)).toFixed(2)} A/match · ${topAssister.matches} apps`}
              />
            )}

            {under && (
              <Award
                type="Weak Link"
                color="destructive"
                icon={<TrendingDown className="h-5 w-5" />}
                name={under.player.name}
                sub={`${under.player.position} · ${under.player.overall} · played ${under.matches}/${matches.length}`}
                stat={`avg ${under.avgRating > 0 ? under.avgRating.toFixed(2) : "—"} · ${under.gaPerGame.toFixed(2)} G+A/game · ${under.goals}G ${under.assists}A`}
              />
            )}

            {!mvp && !topScorer && !topAssister && !under && (
              <div className="text-xs text-muted-foreground text-center py-3">No awards data yet.</div>
            )}
          </div>


          {/* Collapsibles — default closed */}
          <CollapsibleSection title="Squad Performance" icon={<Crown className="h-3.5 w-3.5 text-primary" />}>
            <SquadPerformance aggs={aggs} wl={wl} />
          </CollapsibleSection>

          <CollapsibleSection title="Clutch Factor" icon={<Zap className="h-3.5 w-3.5 text-primary" />}>
            <ClutchFactor squad={squad} matches={matches} />
          </CollapsibleSection>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-bold uppercase tracking-wider text-sm hover:opacity-90">
              Close Report
            </button>
            <button onClick={onBackToList} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm font-semibold uppercase tracking-wider">
              Back to WLs
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/** Football-app style stat bar comparing You vs Opponent. */
function StatBar({
  leftLabel, leftVal, rightVal, leftAccent, leftPct, icon,
}: {
  leftLabel: string;
  leftVal: string | number;
  rightVal: string | number;
  leftAccent?: boolean;
  leftPct?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="py-2 border-b border-border/40 last:border-b-0">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-display stat-num font-bold w-12 text-left ${leftAccent ? "text-primary" : "text-foreground"}`}>{leftVal}</span>
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
          {icon}{leftLabel}
        </span>
        <span className="font-display stat-num font-bold w-12 text-right text-foreground">{rightVal}</span>
      </div>
      {typeof leftPct === "number" && (
        <div className="mt-1.5 flex h-1.5 rounded overflow-hidden bg-secondary/60">
          <div className="bg-primary" style={{ width: `${leftPct}%` }} />
          <div className="bg-destructive/60" style={{ width: `${100 - leftPct}%` }} />
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-lg border border-border bg-secondary/20 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition"
        aria-expanded={open}
      >
        <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-foreground flex items-center gap-1.5">
          {icon} {title}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-2 pb-2">{children}</div>}
    </div>
  );
}

function BigStat({ label, value, accent, danger, icon }: { label: string; value: number; accent?: boolean; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="surface-card p-4 text-center">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center justify-center gap-1">{icon}{label}</div>
      <div className={`font-display text-5xl mt-1 leading-none ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function SmallStat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="surface-card p-3 flex items-center justify-between">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">{icon}{label}</div>
      <div className="stat-num font-display text-2xl">{value}</div>
    </div>
  );
}

function Award({ type, color, icon, name, sub, stat }: { type: string; color: "primary" | "destructive"; icon: React.ReactNode; name: string; sub: string; stat: string }) {
  const isP = color === "primary";
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className={`mb-3 p-4 rounded-lg border ${isP ? "border-primary/40 bg-primary/10" : "border-destructive/40 bg-destructive/5"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-md grid place-items-center ${isP ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] uppercase tracking-[0.25em] font-bold ${isP ? "text-primary" : "text-destructive"}`}>{type}</div>
          <div className="font-display text-xl truncate">{name}</div>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{sub}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground stat-num">{stat}</div>
      </div>
    </motion.div>
  );
}

function SquadPerformance({
  aggs,
  wl,
}: {
  aggs: ReturnType<typeof aggregatePlayer>[];
  wl: WeekendLeague;
}) {
  const rows = [...aggs]
    .filter((a) => a.matches > 0)
    .sort((a, b) => b.avgRating - a.avgRating || (b.goals + b.assists) - (a.goals + a.assists));
  if (rows.length === 0) return null;
  const ratings = wl.managerRatings ?? {};

  const setRating = (playerId: string, value: number) => {
    const next = { ...(wl.managerRatings ?? {}) };
    if (value <= 0) delete next[playerId];
    else next[playerId] = value;
    store.updateWL(wl.id, { managerRatings: next });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-4 p-4 rounded-lg border border-border bg-secondary/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-foreground flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-primary" /> Squad Performance · Sorted by Rating
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{rows.length} players</div>
      </div>
      <div className="grid grid-cols-12 gap-2 px-2 pb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/50">
        <div className="col-span-4">Player</div>
        <div className="col-span-1 text-center">Pos</div>
        <div className="col-span-1 text-center">G</div>
        <div className="col-span-1 text-center">A</div>
        <div className="col-span-1 text-center">MP</div>
        <div className="col-span-2 text-right">System</div>
        <div className="col-span-2 text-right">Manager</div>
      </div>
      <div className="divide-y divide-border/30">
        {rows.map((a, i) => {
          const status = performanceStatus(a);
          const rowCls =
            status === "critical"
              ? "bg-warn-critical/5"
              : status === "caution"
                ? "bg-warn-caution/5"
                : "";
          const mgr = ratings[a.player.id] ?? 0;
          return (
            <div key={a.player.id} className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 text-xs ${rowCls}`}>
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="font-semibold truncate">{a.player.name}</span>
                {i === 0 && <Crown className="h-3 w-3 text-primary shrink-0" />}
                {status === "critical" && <AlertTriangle className="h-3 w-3 text-warn-critical shrink-0" />}
              </div>
              <div className="col-span-1 text-center text-[11px] font-mono text-muted-foreground uppercase">{a.player.position}</div>
              <div className="col-span-1 text-center stat-num">{a.goals}</div>
              <div className="col-span-1 text-center stat-num">{a.assists}</div>
              <div className="col-span-1 text-center stat-num text-muted-foreground">{a.matches}</div>
              <div className="col-span-2 text-right font-display stat-num text-base">
                <RatingDisplay matches={a.matches} ratedMatches={a.ratedMatches} avgRating={a.avgRating} size="md" />
              </div>
              <div className="col-span-2 flex justify-end items-center gap-1">
                <select
                  value={mgr}
                  onChange={(e) => setRating(a.player.id, parseFloat(e.target.value))}
                  className="h-7 px-1.5 rounded border border-border bg-background/60 text-foreground text-xs font-semibold font-display stat-num focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label={`Manager rating for ${a.player.name}`}
                >
                  <option value={0}>—</option>
                  {MANAGER_RATING_OPTIONS.filter((v) => v > 0).map((v) => (
                    <option key={v} value={v}>{v.toFixed(1)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setRating(a.player.id, 0)}
                  disabled={mgr <= 0}
                  className="h-7 w-7 grid place-items-center rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={`Clear manager rating for ${a.player.name}`}
                  title="Clear rating"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground italic">
        Manager Rating is your subjective tactical review. Saved automatically.
      </div>
    </motion.div>
  );
}

function ClutchFactor({ squad, matches }: { squad: Player[]; matches: Match[] }) {
  const rows: ClutchAgg[] = squad
    .map((p) => clutchAggregate(p, matches))
    .filter((c) => c.clutch.matches > 0)
    .sort((a, b) => {
      const aBadged = a.badge ? 1 : 0;
      const bBadged = b.badge ? 1 : 0;
      if (aBadged !== bBadged) return bBadged - aBadged;
      return b.ratingDelta - a.ratingDelta || b.clutch.avgRating - a.clutch.avgRating;
    });

  if (rows.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
      className="mt-4 p-4 rounded-lg border border-border bg-secondary/30"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-foreground flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Clutch Factor · Matches 11–15
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Badges need {CLUTCH_MIN_MATCHES}+ clutch apps
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mb-3">
        High-pressure stretch: the final five WL matches where ranks are decided.
      </div>
      <div className="space-y-1.5">
        {rows.map((c) => {
          const delta = c.ratingDelta;
          const deltaTone = delta >= 0.0001 ? "text-primary" : delta <= -0.0001 ? "text-destructive" : "text-muted-foreground";
          const deltaSign = delta > 0 ? "+" : "";
          return (
            <div
              key={c.player.id}
              className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded text-xs border ${
                c.badge === "king"
                  ? "border-primary/40 bg-primary/10"
                  : c.badge === "drop"
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border/40 bg-background/40"
              }`}
            >
              <div className="col-span-5 min-w-0 flex items-center gap-1.5">
                <span className="font-semibold truncate">{c.player.name}</span>
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
              <div className="col-span-2 text-center stat-num text-[11px] text-muted-foreground">
                {c.clutch.matches} cl · {c.baseline.matches} tot
              </div>
              <div className="col-span-2 text-center stat-num text-[11px]">
                {c.clutch.goals}G/{c.clutch.assists}A
              </div>
              <div className="col-span-3 text-right font-display stat-num">
                <span className="text-foreground">{c.clutch.avgRating > 0 ? c.clutch.avgRating.toFixed(2) : "—"}</span>
                <span className="text-muted-foreground"> vs </span>
                <span className="text-muted-foreground">{c.baseline.avgRating > 0 ? c.baseline.avgRating.toFixed(2) : "—"}</span>
                {c.clutch.ratedMatches > 0 && c.baseline.ratedMatches > 0 && (
                  <span className={`ml-1.5 text-[11px] font-mono ${deltaTone}`}>
                    {deltaSign}{delta.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
