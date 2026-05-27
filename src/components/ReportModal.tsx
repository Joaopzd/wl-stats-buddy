import { motion } from "framer-motion";
import { Trophy, Flame, Star, TrendingDown, X, LayoutGrid, TrendingUp, Shield, Crown, Zap } from "lucide-react";
import { SoccerBall } from "./icons/SoccerBall";
import { SoccerBoot } from "./icons/SoccerBoot";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { wlLabel } from "@/lib/types";
import { aggregatePlayer, clutchAggregate, CLUTCH_MIN_MATCHES, performanceStatus, rankFromWins, type ClutchAgg, type WLRecord } from "@/lib/stats";
import { RatingDisplay } from "@/components/RatingDisplay";
import { AlertTriangle } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { store } from "@/lib/store";

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

  const minMatches = Math.ceil(matches.length / 2);
  const eligible = aggs.filter((a) => a.matches >= minMatches);
  const under = eligible.length
    ? [...eligible].sort((a, b) => a.gaPerGame - b.gaPerGame || a.avgRating - b.avgRating)[0]
    : null;

  const rank = rankFromWins(record.wins);

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="surface-glow w-full max-w-2xl p-6 sm:p-8 my-auto relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>

        <div className="text-center mb-6">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="inline-block">
            <Trophy className="h-14 w-14 text-primary mx-auto" />
          </motion.div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary font-bold mt-3">Weekend League Complete</div>
          <h2 className="font-display text-4xl sm:text-5xl mt-2 leading-none">{wlLabel(wl)}</h2>
          {wl.customName && <div className="text-xs text-muted-foreground mt-1">WL #{wl.number}</div>}
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <RankBadge rank={rank} size="lg" />
            {wl.formation && (
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-secondary text-foreground text-xs font-semibold uppercase tracking-wider">
                <LayoutGrid className="h-3 w-3" /> {wl.formation}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <BigStat label="Wins" value={record.wins} accent />
          <BigStat label="Losses" value={record.losses} danger />
          <BigStat label="Best Streak" value={streak} icon={<Flame className="h-3 w-3" />} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <SmallStat label="Total Goals" value={totalG} icon={<SoccerBall size={14} />} />
          <SmallStat label="Total Assists" value={totalA} icon={<SoccerBoot size={14} />} />
        </div>

        {matches.length > 0 && (() => {
          const gfPerMatch = totalG / matches.length;
          const gaPerMatch = record.goalsAgainst / matches.length;
          const positive = gfPerMatch >= gaPerMatch;
          const diff = gfPerMatch - gaPerMatch;
          return (
            <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-foreground flex items-center gap-1.5">
                  {positive
                    ? <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    : <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                  Match Averages
                </div>
                <div className={`text-[10px] font-mono font-bold ${positive ? "text-primary" : "text-destructive"}`}>
                  {positive ? "+" : ""}{diff.toFixed(2)} GD/match
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-md p-3 border ${positive ? "border-primary/40 bg-primary/10" : "border-border bg-background/40"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    <SoccerBall size={12} /> Goals For / Match
                  </div>
                  <div className={`font-display stat-num text-3xl mt-1 ${positive ? "text-primary" : "text-foreground"}`}>
                    {gfPerMatch.toFixed(2)}
                  </div>
                </div>
                <div className={`rounded-md p-3 border ${!positive ? "border-destructive/40 bg-destructive/10" : "border-border bg-background/40"}`}>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                    <Shield className="h-3 w-3" /> Goals Against / Match
                  </div>
                  <div className={`font-display stat-num text-3xl mt-1 ${!positive ? "text-destructive" : "text-foreground"}`}>
                    {gaPerMatch.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {mvp && mvp.matches > 0 && (
          <Award
            type="MVP"
            color="primary"
            icon={<Star className="h-5 w-5" />}
            name={mvp.player.name}
            sub={`${mvp.player.position} · ${mvp.player.overall} · ${mvp.player.rarity}`}
            stat={`${mvp.goals}G + ${mvp.assists}A · ${mvp.matches} apps`}
          />
        )}

        {under && (
          <Award
            type="Underperformer"
            color="destructive"
            icon={<TrendingDown className="h-5 w-5" />}
            name={under.player.name}
            sub={`${under.player.position} · ${under.player.overall} · played ${under.matches}/${matches.length}`}
            stat={`${under.goals}G + ${under.assists}A · ${under.gaPerGame.toFixed(2)} G+A/game`}
          />
        )}

        <SquadPerformance aggs={aggs} wl={wl} />


        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90">
            Close Report
          </button>
          <button onClick={onBackToList} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">
            Back to WLs
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function BigStat({ label, value, accent, danger, icon }: { label: string; value: number; accent?: boolean; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <div className="surface-card p-4 text-center">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center justify-center gap-1">{icon}{label}</div>
      <div className={`font-display text-5xl mt-1 leading-none ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function SmallStat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="surface-card p-3 flex items-center justify-between">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold flex items-center gap-1.5">{icon}{label}</div>
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
          <div className={`text-[10px] uppercase tracking-[0.25em] font-bold ${isP ? "text-primary" : "text-destructive"}`}>{type}</div>
          <div className="font-display text-xl truncate">{name}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{sub}</div>
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
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-foreground flex items-center gap-1.5">
          <Crown className="h-3.5 w-3.5 text-primary" /> Squad Performance · Sorted by Rating
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{rows.length} players</div>
      </div>
      <div className="grid grid-cols-12 gap-2 px-2 pb-1.5 text-[9px] uppercase tracking-wider text-muted-foreground font-bold border-b border-border/50">
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
                <span className="text-[9px] font-mono text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="font-semibold truncate">{a.player.name}</span>
                {i === 0 && <Crown className="h-3 w-3 text-primary shrink-0" />}
                {status === "critical" && <AlertTriangle className="h-3 w-3 text-warn-critical shrink-0" />}
              </div>
              <div className="col-span-1 text-center text-[10px] font-mono text-muted-foreground uppercase">{a.player.position}</div>
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
      <div className="mt-2 text-[10px] text-muted-foreground italic">
        Manager Rating is your subjective tactical review. Saved automatically.
      </div>
    </motion.div>
  );
}
