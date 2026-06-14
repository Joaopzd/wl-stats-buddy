import { useMemo } from "react";
import {
  FORMATIONS,
  type Formation,
  type FormationName,
  type FormationSlot,
  positionFits,
} from "@/lib/formations";
import type { Match, Player, WeekendLeague, Rarity } from "@/lib/types";
import { aggregateAllPlayers, type PlayerAgg } from "@/lib/stats";
import { PlayerCard } from "@/components/PlayerCard";
import { PositionBadge } from "@/components/PositionBadge";
import { rarityVisual } from "@/lib/format";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Trophy, Star, Users, Info } from "lucide-react";

const MIN_MATCHES = 9;

/** Find the most-used formation across saved squads. Defaults to 4-3-3. */
export function mostUsedFormation(wls: WeekendLeague[]): FormationName {
  const tally = new Map<FormationName, number>();
  for (const wl of wls) {
    if (wl.formation) {
      tally.set(wl.formation, (tally.get(wl.formation) ?? 0) + 1);
    }
  }
  let best: FormationName = "4-3-3";
  let bestN = 0;
  for (const [name, n] of tally) {
    if (n > bestN) {
      bestN = n;
      best = name;
    }
  }
  return best;
}

/** Positions a player has actually been deployed in (via WL starting assignments). */
function positionsPlayedByPlayer(
  wls: WeekendLeague[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const wl of wls) {
    if (!wl.formation || !wl.startingAssignments) continue;
    const slots = FORMATIONS[wl.formation].slots;
    for (const slot of slots) {
      const pid = wl.startingAssignments[slot.id];
      if (!pid) continue;
      if (!map.has(pid)) map.set(pid, new Set());
      map.get(pid)!.add(slot.position);
    }
  }
  return map;
}

interface SelectionResult {
  starting: Array<{ slot: FormationSlot; agg: PlayerAgg | null }>;
  bench: PlayerAgg[];
}

function score(a: PlayerAgg): number {
  return a.avgRating * 1.0 + a.gaPerGame * 0.5;
}

function pickBestXI(
  formation: Formation,
  aggs: PlayerAgg[],
  positionsPlayed: Map<string, Set<string>>,
): SelectionResult {
  const eligible = aggs.filter((a) => a.matches >= MIN_MATCHES);
  const used = new Set<string>();
  const starting: SelectionResult["starting"] = [];

  for (const slot of formation.slots) {
    const candidates = eligible
      .filter((a) => !used.has(a.player.id))
      .filter((a) => {
        const played = positionsPlayed.get(a.player.id);
        if (!played || played.size === 0) {
          return positionFits(a.player.position, slot.position);
        }
        return played.has(slot.position);
      })
      .sort((a, b) => {
        const sa = score(a);
        const sb = score(b);
        if (sb !== sa) return sb - sa;
        if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
        return b.matches - a.matches;
      });

    const pick = candidates[0] ?? null;
    if (pick) used.add(pick.player.id);
    starting.push({ slot, agg: pick });
  }

  const bench = eligible
    .filter((a) => !used.has(a.player.id))
    .sort((a, b) => {
      const sa = score(a);
      const sb = score(b);
      if (sb !== sa) return sb - sa;
      if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
      return b.matches - a.matches;
    })
    .slice(0, 7);

  return { starting, bench };
}

/** Disc filled with the player's rarity palette. */
function RarityDot({ rarity, size = 28 }: { rarity: Rarity; size?: number }) {
  const v = rarityVisual(rarity);
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "9999px",
    boxShadow: "0 1px 3px rgba(0,0,0,.4)",
    flexShrink: 0,
  };
  if (v.style) {
    return (
      <span
        className="inline-block border-2"
        style={{
          ...baseStyle,
          background: v.style.background as string,
          borderColor: v.style.borderColor as string,
        }}
      />
    );
  }
  return <span className={`inline-block ${v.className}`} style={baseStyle} />;
}

function StatsCard({ a }: { a: PlayerAgg }) {
  return (
    <>
      <div className="font-display text-base truncate">{a.player.name}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
        {a.player.position} · {a.player.overall} OVR · {a.player.rarity}
      </div>
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Games</dt>
        <dd className="font-mono text-right">{a.matches}</dd>
        <dt className="text-muted-foreground">Win Rate</dt>
        <dd className="font-mono text-right text-primary">{Math.round(a.winRate * 100)}%</dd>
        <dt className="text-muted-foreground">Goals</dt>
        <dd className="font-mono text-right">{a.goals}</dd>
        <dt className="text-muted-foreground">Assists</dt>
        <dd className="font-mono text-right">{a.assists}</dd>
        <dt className="text-muted-foreground">MVPs</dt>
        <dd className="font-mono text-right">{a.mvpCount}</dd>
        <dt className="text-muted-foreground">Avg Rating</dt>
        <dd className="font-mono text-right text-primary">{a.avgRating.toFixed(2)}</dd>
      </dl>
      <WinRateBar pct={a.winRate * 100} />
    </>
  );
}

export function BestXI({
  players,
  matches,
  wls,
}: {
  players: Player[];
  matches: Match[];
  wls: WeekendLeague[];
}) {
  const formationName = useMemo(() => mostUsedFormation(wls), [wls]);
  const formation = FORMATIONS[formationName];
  const aggs = useMemo(() => aggregateAllPlayers(players, matches), [players, matches]);
  const positionsPlayed = useMemo(() => positionsPlayedByPlayer(wls), [wls]);
  const { starting, bench } = useMemo(
    () => pickBestXI(formation, aggs, positionsPlayed),
    [formation, aggs, positionsPlayed],
  );

  const filledCount = starting.filter((s) => s.agg).length;

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wider mb-1 flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" /> All-Time Best XI
      </h2>
      <p className="text-xs text-muted-foreground mb-4 inline-flex items-center gap-1.5">
        <Info className="h-3 w-3 text-primary" />
        Default formation:{" "}
        <span className="text-foreground font-semibold">{formationName}</span> ·
        most-used in your saved squads. Min {MIN_MATCHES} matches per player.
      </p>

      <div className="surface-card p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
          {/* LEFT: Pitch */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" /> Starting XI · {formationName}
              </span>
              <span>{filledCount}/11</span>
            </div>
            <div
              className="relative w-full max-w-[280px] mx-auto rounded-lg overflow-hidden border border-emerald-700/40"
              style={{
                aspectRatio: "3 / 4",
                background:
                  "repeating-linear-gradient(0deg, oklch(0.32 0.06 145) 0 8%, oklch(0.36 0.06 145) 8% 16%)",
              }}
            >
              <div className="absolute inset-1.5 border border-white/30 rounded" />
              <div className="absolute left-1/2 top-1.5 bottom-1.5 w-px bg-white/30 -translate-x-1/2" />
              <div className="absolute left-1/2 top-1/2 h-12 w-12 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-1/2 h-8 border border-t-0 border-white/30" />
              <div className="absolute left-1/2 bottom-1.5 -translate-x-1/2 w-1/2 h-8 border border-b-0 border-white/30" />

              {starting.map(({ slot, agg }) => (
                <div
                  key={slot.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  {agg ? (
                    <HoverCard openDelay={100} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <button type="button" className="group relative grid place-items-center focus:outline-none">
                          <RarityDot rarity={agg.player.rarity} size={30} />
                          <span
                            className="absolute inset-0 grid place-items-center font-display text-[10px] font-bold leading-none pointer-events-none"
                            style={{ color: "white", textShadow: "0 0 3px rgba(0,0,0,0.9)" }}
                          >
                            {agg.player.overall}
                          </span>
                          <span
                            className="mt-0.5 text-[9px] uppercase font-bold text-white tracking-wider leading-none"
                            style={{ textShadow: "0 0 3px rgba(0,0,0,0.9)" }}
                          >
                            {agg.player.name.split(" ").slice(-1)[0]}
                          </span>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="w-64 p-3">
                        <div className="flex gap-3">
                          <PlayerCard
                            name={agg.player.name}
                            overall={agg.player.overall}
                            position={agg.player.position}
                            rarity={agg.player.rarity}
                            imageUrl={agg.player.imageUrl}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <StatsCard a={agg} />
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ) : (
                    <div className="h-8 w-8 rounded-full border-2 border-dashed border-white/60 bg-black/30 grid place-items-center">
                      <span className="text-[9px] font-bold text-white tracking-wider">{slot.position}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Honorable mentions */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Honorable Mentions ({bench.length})
            </div>
            {bench.length === 0 ? (
              <div className="surface-card p-4 text-center text-muted-foreground text-xs">No bench candidates yet.</div>
            ) : (
              <div className="space-y-1.5">
                {bench.map((a) => (
                  <HoverCard key={a.player.id} openDelay={100} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <div className="surface-card px-2.5 py-2 flex items-center gap-2.5 cursor-default">
                        <RarityDot rarity={a.player.rarity} size={22} />
                        <span className="font-display text-base text-primary stat-num w-8 text-center shrink-0 leading-none">
                          {a.player.overall}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0 w-10 text-center">
                          {a.player.position}
                        </span>
                        <div className="text-xs font-semibold truncate flex-1 leading-tight">{a.player.name}</div>
                        <span className="font-mono text-[11px] text-primary shrink-0">{a.avgRating.toFixed(2)}</span>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="left" className="w-64 p-3">
                      <div className="flex gap-3">
                        <PlayerCard
                          name={a.player.name}
                          overall={a.player.overall}
                          position={a.player.position}
                          rarity={a.player.rarity}
                          imageUrl={a.player.imageUrl}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <StatsCard a={a} />
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function WinRateBar({ pct }: { pct: number }) {
  const width = Math.max(0, Math.min(100, pct));
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        <span>Win Rate</span>
        <span className="font-mono text-foreground">{Math.round(width)}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-secondary/60 rounded overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
