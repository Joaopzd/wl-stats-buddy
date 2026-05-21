import { useMemo } from "react";
import { X, Trophy, Shield, Star, AlertTriangle } from "lucide-react";
import { PlayerCard } from "@/components/PlayerCard";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { RatingDisplay } from "@/components/RatingDisplay";
import {
  aggregatePlayer,
  eyeTestMismatch,
  isCleanSheetEligible,
  isGoalsConcededEligible,
  managerRatingAggregate,
} from "@/lib/stats";
import { wlLabel } from "@/lib/types";
import type { Match, Player, WeekendLeague } from "@/lib/types";

export function PlayerDetailModal({
  player,
  matches,
  wls,
  onClose,
}: {
  player: Player;
  matches: Match[];
  wls: WeekendLeague[];
  onClose: () => void;
}) {
  const career = useMemo(() => aggregatePlayer(player, matches), [player, matches]);

  const lastWL = useMemo(() => {
    // Most recent WL (by number desc) where the player has at least one performance.
    const sorted = [...wls].sort((a, b) => b.number - a.number || b.createdAt - a.createdAt);
    for (const wl of sorted) {
      const wlMatches = matches.filter((m) => m.wlId === wl.id);
      const played = wlMatches.some((m) =>
        m.performances.some((p) => p.playerId === player.id),
      );
      if (played) return { wl, wlMatches };
    }
    return null;
  }, [player, matches, wls]);

  const lastAgg = useMemo(
    () => (lastWL ? aggregatePlayer(player, lastWL.wlMatches) : null),
    [player, lastWL],
  );

  const managerCareer = useMemo(() => managerRatingAggregate(player.id, wls), [player.id, wls]);
  const managerLast = useMemo(() => {
    if (!lastWL) return { avg: 0, count: 0 };
    return managerRatingAggregate(player.id, [lastWL.wl]);
  }, [player.id, lastWL]);
  const eyeTest = eyeTestMismatch(career.avgRating, career.matches, managerCareer.avg, managerCareer.count);

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-glow w-full max-w-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <h2 className="font-display text-2xl tracking-wider truncate">
            {player.name}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-5">
          {/* Card image — full size */}
          <div className="flex justify-center sm:block">
            <PlayerCard
              name={player.name}
              overall={player.overall}
              position={player.position}
              rarity={player.rarity}
              imageUrl={player.imageUrl}
              size="xl"
            />
          </div>

          {/* Info */}
          <div className="min-w-0 space-y-4 sm:pl-2">
            <div className="grid grid-cols-3 gap-2">
              <Meta label="OVR" value={String(player.overall)} accent />
              <Meta label="Pos" value={player.position} />
              <Meta label="Rarity" value={player.rarity} small />
            </div>

            {eyeTest && (
              <div className="rounded-md border border-warn-caution/50 bg-warn-caution/10 px-3 py-2 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warn-caution shrink-0 mt-0.5" />
                <div className="text-[11px] leading-tight">
                  <div className="font-bold uppercase tracking-wider text-warn-caution">Eye-test mismatch</div>
                  <div className="text-muted-foreground">
                    Strong system rating ({career.avgRating.toFixed(2)}) but Manager Rating is low ({managerCareer.avg.toFixed(2)}).
                  </div>
                </div>
              </div>
            )}

            <Section title="Career — All WLs">
              <StatGrid agg={career} player={player} managerAvg={managerCareer.avg} managerCount={managerCareer.count} />
            </Section>

            <Section
              title={
                lastWL
                  ? `Last WL — ${wlLabel(lastWL.wl)}`
                  : "Last WL"
              }
            >
              {lastAgg && lastAgg.matches > 0 ? (
                <StatGrid agg={lastAgg} player={player} managerAvg={managerLast.avg} managerCount={managerLast.count} />
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  Hasn't played a match yet.
                </div>
              )}
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  accent,
  small,
}: {
  label: string;
  value: string;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
        {label}
      </div>
      <div
        className={`font-display tracking-wider truncate ${
          accent ? "text-primary text-xl stat-num" : small ? "text-xs" : "text-base"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function StatGrid({
  agg,
  player,
}: {
  agg: ReturnType<typeof aggregatePlayer>;
  player: Player;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      <Stat label="MP" value={agg.matches} />
      <Stat label="G" value={agg.goals} icon={<SoccerBall className="h-3 w-3" />} accent />
      <Stat label="A" value={agg.assists} icon={<SoccerBoot className="h-3 w-3" />} />
      <Stat
        label="Rating"
        value={<RatingDisplay matches={agg.matches} ratedMatches={agg.ratedMatches} avgRating={agg.avgRating} size="md" />}
        accent={agg.avgRating >= 8}
      />
      <Stat
        label="Win %"
        value={agg.matches > 0 ? `${(agg.winRate * 100).toFixed(0)}%` : "—"}
        accent={agg.winRate >= 0.6}
      />
      <Stat
        label="MVP"
        value={agg.mvpCount}
        icon={<Trophy className="h-3 w-3 text-amber-300" />}
      />
      <Stat
        label="Wins"
        value={agg.wins}
        icon={<Star className="h-3 w-3 text-primary" />}
      />
      <Stat
        label="Sub Impact"
        value={agg.subMatches > 0 ? agg.subImpact.toFixed(2) : "—"}
        accent={agg.subImpact >= 1.5}
      />

      {isCleanSheetEligible(player.position) && (
        <Stat
          label="CS"
          value={agg.cleanSheets}
          icon={<Shield className="h-3 w-3 text-sky-300" />}
        />
      )}
      {isGoalsConcededEligible(player.position) && (
        <Stat label="GC" value={agg.goalsConceded} />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string | React.ReactNode;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
        {icon}
        {label}
      </div>
      <div
        className={`font-display stat-num text-base leading-tight ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
