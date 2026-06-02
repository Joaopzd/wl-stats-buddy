import { motion } from "framer-motion";
import { X, Star, Zap, Flag as FlagIcon, AlertTriangle, Trophy, Pencil } from "lucide-react";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { matchIsWin } from "@/lib/stats";
import { ClubCrest } from "./ClubCrest";
import { OpponentCrest } from "./OpponentCrest";
import { PlatformBadge } from "./PlatformBadge";
import { SoccerBall } from "./icons/SoccerBall";
import { SoccerBoot } from "./icons/SoccerBoot";
import { useClubName, useOpponentName } from "@/lib/store";
import { CREST_SIZE } from "@/lib/ui";

export function MatchDetailModal({
  match,
  players,
  wl,
  onClose,
  onEdit,
}: {
  match: Match;
  players: Player[];
  /** WL this match belongs to. Used to render the historical club identity snapshot. */
  wl?: WeekendLeague;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const playersById = new Map(players.map((p) => [p.id, p]));
  const win = matchIsWin(match);
  const liveClubName = useClubName();
  const clubName = wl?.clubName ?? liveClubName;
  const clubCrestOverride = wl ? wl.clubCrestUrl ?? null : undefined;
  const opponentName = useOpponentName();

  // MVP: explicit mvpPlayerId, else highest rating > 0
  const explicitMvp = match.mvpPlayerId
    ? match.performances.find((p) => p.playerId === match.mvpPlayerId)
    : null;
  const rated = match.performances.filter((p) => (p.rating ?? 0) > 0);
  const mvp = explicitMvp ?? (rated.length
    ? [...rated].sort((a, b) => b.rating - a.rating || (b.goals + b.assists) - (a.goals + a.assists))[0]
    : null);
  const mvpPlayer = mvp ? playersById.get(mvp.playerId) : null;

  const scorers = match.performances
    .filter((p) => p.goals > 0)
    .map((p) => ({ player: playersById.get(p.playerId), goals: p.goals }))
    .filter((x) => x.player)
    .sort((a, b) => b.goals - a.goals);

  const assisters = match.performances
    .filter((p) => p.assists > 0)
    .map((p) => ({ player: playersById.get(p.playerId), assists: p.assists }))
    .filter((x) => x.player)
    .sort((a, b) => b.assists - a.assists);

  const ratings = match.performances
    .map((p) => ({ perf: p, player: playersById.get(p.playerId) }))
    .filter((x) => x.player)
    .sort((a, b) => (b.perf.rating ?? 0) - (a.perf.rating ?? 0));

  return (
    <div
      className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-md grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.35 }}
        onClick={(e) => e.stopPropagation()}
        className="surface-glow w-full max-w-xl my-auto relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className={`px-6 pt-6 pb-5 border-b border-border/60 ${win ? "bg-primary/5" : "bg-destructive/5"}`}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
            Match {match.index} · {win ? "WIN" : "LOSS"}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5 font-display leading-none">
            <div className="flex flex-col items-center justify-self-center gap-1.5 min-w-0 w-full">
              <ClubCrest size={CREST_SIZE.detail} overrideUrl={clubCrestOverride} />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate max-w-[8rem] text-center">
                {clubName || "My Club"}
              </div>
            </div>
            <div className="flex items-baseline justify-center gap-2 sm:gap-3">
              <span className="text-5xl sm:text-6xl stat-num text-foreground">{match.scoreFor}</span>
              <span className="text-2xl sm:text-3xl text-muted-foreground/60">–</span>
              <span className="text-5xl sm:text-6xl stat-num text-foreground">{match.scoreAgainst}</span>
            </div>
            <div className="flex flex-col items-center justify-self-center gap-1.5 min-w-0 w-full">
              <OpponentCrest id={match.opponentCrestId} size={CREST_SIZE.detail} />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate max-w-[8rem] text-center">
                {opponentName}
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <PlatformBadge platform={match.platform} size="md" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            {match.extraTime && (
              <Tag tone="warn" icon={<Zap className="h-3 w-3" />}>Extra Time</Tag>
            )}
            {match.penalties && (
              <Tag tone="info" icon={<FlagIcon className="h-3 w-3" />}>
                Penalties · {match.penaltyWinner === "us" ? "Won" : "Lost"}
              </Tag>
            )}
            {match.rageQuit && (
              <Tag tone="rq" icon={<AlertTriangle className="h-3 w-3" />}>Rage Quit</Tag>
            )}
          </div>
          {match.tactics && match.tactics.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold mr-1">Tactics</span>
              {match.tactics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-primary/15 text-primary border-primary/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* MVP */}
          {mvpPlayer && mvp && (
            <div className="rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/10 to-primary/10 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md grid place-items-center bg-amber-400/20 text-amber-300 shrink-0">
                  <Trophy className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-300">MVP</div>
                  <div className="font-display text-xl truncate">{mvpPlayer.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                    {mvpPlayer.position} · {mvpPlayer.overall} · {mvp.goals}G {mvp.assists}A
                  </div>
                </div>
                <div className="font-display text-3xl stat-num text-amber-300">{mvp.rating.toFixed(1)}</div>
              </div>
            </div>
          )}

          {/* Goals & Assists summary */}
          <div className="grid sm:grid-cols-2 gap-3">
            <SummaryList
              icon={<SoccerBall size={14} />}
              label="Goals"
              empty="No goals"
              items={scorers.map((s) => ({ name: s.player!.name, count: s.goals }))}
              tone="primary"
            />
            <SummaryList
              icon={<SoccerBoot size={14} />}
              label="Assists"
              empty="No assists"
              items={assisters.map((a) => ({ name: a.player!.name, count: a.assists }))}
              tone="info"
            />
          </div>

          {/* Player ratings */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> Player Ratings ({ratings.length})
            </div>
            {ratings.length === 0 ? (
              <div className="surface-card p-3 text-center text-xs text-muted-foreground">No participants logged</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {ratings.map(({ perf, player }) => {
                  const r = perf.rating ?? 0;
                  const tone =
                    r >= 6 ? "text-foreground" :
                    r > 0 ? "text-destructive" :
                    "text-muted-foreground";
                  return (
                    <div
                      key={perf.playerId}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/50 border border-border/60"
                    >
                      <span className="font-display text-base text-foreground stat-num w-7 text-center shrink-0 leading-none">
                        {player!.overall}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0 w-9 text-center">
                        {player!.position}
                      </span>
                      <div className="text-[12px] font-semibold truncate flex-1 leading-tight">{player!.name}</div>
                      <span className="text-[9px] font-mono text-muted-foreground tabular-nums">
                        {perf.goals}G {perf.assists}A
                      </span>
                      <span className={`font-display stat-num text-sm w-10 text-right ${tone}`}>
                        {r > 0 ? r.toFixed(1) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-border bg-secondary/60 text-foreground font-semibold uppercase tracking-wider text-xs hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Match
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Tag({ children, tone, icon }: { children: React.ReactNode; tone: "warn" | "info" | "rq"; icon?: React.ReactNode }) {
  const cls =
    tone === "warn" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
    tone === "info" ? "bg-sky-500/20 text-sky-300 border-sky-500/40" :
    "bg-destructive/20 text-destructive border-destructive/40";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {icon}
      {children}
    </span>
  );
}

function SummaryList({
  icon,
  label,
  items,
  empty,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  items: { name: string; count: number }[];
  empty: string;
  tone: "primary" | "info";
}) {
  const accent = tone === "primary" ? "text-primary" : "text-sky-300";
  return (
    <div className="surface-card p-3">
      <div className={`text-[10px] uppercase tracking-[0.25em] font-bold mb-2 flex items-center gap-1.5 ${accent}`}>
        {icon} {label}
      </div>
      {items.length === 0 ? (
        <div className="text-[11px] text-muted-foreground">{empty}</div>
      ) : (
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={i} className="flex items-center justify-between text-[12px]">
              <span className="truncate font-semibold">{it.name}</span>
              <span className={`stat-num font-mono ${accent} ml-2 shrink-0`}>×{it.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
