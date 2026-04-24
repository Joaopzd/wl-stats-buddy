import { motion } from "framer-motion";
import { Trophy, Flame, Target, Star, TrendingDown, X, LayoutGrid } from "lucide-react";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { aggregatePlayer, rankFromWins, type WLRecord } from "@/lib/stats";

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

  // Underperformer: must have played >=50% of matches
  const minMatches = Math.ceil(matches.length / 2);
  const eligible = aggs.filter((a) => a.matches >= minMatches);
  const under = eligible.length
    ? [...eligible].sort((a, b) =>
        (a.ga + a.offensive * 0.1 + a.defensive * 0.1) -
        (b.ga + b.offensive * 0.1 + b.defensive * 0.1)
      )[0]
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
          <h2 className="font-display text-5xl mt-2 leading-none">WL #{wl.number}</h2>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wider">
              {rank}
            </span>
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
          <SmallStat label="Total Goals" value={totalG} icon={<Target className="h-3.5 w-3.5" />} />
          <SmallStat label="Total Assists" value={totalA} icon={<Star className="h-3.5 w-3.5" />} />
        </div>

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

        {wl.startingAssignments && Object.keys(wl.startingAssignments).length > 0 && (
          <StartingXI wl={wl} aggs={aggs} />
        )}

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

function StartingXI({ wl, aggs }: { wl: WeekendLeague; aggs: ReturnType<typeof aggregatePlayer>[] }) {
  const slots = wl.startingAssignments ?? {};
  const aggsById = new Map(aggs.map((a) => [a.player.id, a]));
  const rows = Object.entries(slots).map(([slotId, playerId]) => {
    const a = aggsById.get(playerId);
    return { slotId, agg: a };
  }).filter((r) => r.agg);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mt-4 p-4 rounded-lg border border-border bg-secondary/30"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-foreground">Starting XI · Avg Ratings</div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{wl.formation}</div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {rows.map(({ slotId, agg }) => {
          if (!agg) return null;
          const r = agg.avgRating;
          const tone = r >= 8 ? "text-primary" : r >= 6 ? "text-foreground" : r > 0 ? "text-destructive" : "text-muted-foreground";
          return (
            <div key={slotId} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-background/40 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold w-10 shrink-0">{slotId.replace(/\d+$/, "")}</span>
                <span className="font-semibold truncate">{agg.player.name}</span>
              </div>
              <div className={`stat-num font-display text-base ${tone}`}>
                {r > 0 ? r.toFixed(2) : "—"}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
