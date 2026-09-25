import { motion } from "framer-motion";
import { useState } from "react";
import { X, Star, Zap, Flag as FlagIcon, AlertTriangle, Trophy, Pencil, ChevronDown } from "lucide-react";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { matchIsWin, rankFromWins } from "@/lib/stats";
import { RankBadge } from "./RankBadge";
import { ClubCrest } from "./ClubCrest";
import { OpponentCrest } from "./OpponentCrest";
import { PlatformBadge } from "./PlatformBadge";
import { SoccerBall } from "./icons/SoccerBall";
import { SoccerBoot } from "./icons/SoccerBoot";
import { PositionBadge } from "./PositionBadge";
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
  const [gaOpen, setGaOpen] = useState(false);
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
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold">
            Match {match.index} · {win ? "WIN" : "LOSS"}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5 font-display leading-none">
            <div className="flex flex-col items-center justify-self-center gap-1.5 min-w-0 w-full">
              <ClubCrest size={CREST_SIZE.detail} overrideUrl={clubCrestOverride} />
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold truncate max-w-[8rem] text-center">
                {clubName || "My Club"}
              </div>
              {scorers.length > 0 && (
                <div className="flex items-start gap-1.5 max-w-[12rem] text-sm leading-tight text-foreground font-semibold justify-center">
                  <SoccerBall size={14} className="mt-[3px] text-primary shrink-0" />
                  <span className="text-center">
                    {scorers.map((s, i) => (
                      <span key={s.player!.id}>
                        {s.player!.name.split(" ").slice(-1)[0]}
                        {s.goals > 1 ? ` (${s.goals})` : ""}
                        {i < scorers.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-center gap-2 sm:gap-3">
              <span className="text-5xl sm:text-6xl stat-num text-foreground">{match.scoreFor}</span>
              <span className="text-2xl sm:text-3xl text-muted-foreground/60">–</span>
              <span className="text-5xl sm:text-6xl stat-num text-foreground">{match.scoreAgainst}</span>
            </div>
            <div className="flex flex-col items-center justify-self-center gap-1.5 min-w-0 w-full">
              <OpponentCrest id={match.opponentCrestId} size={CREST_SIZE.detail} />
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold truncate max-w-[8rem] text-center">
                {opponentName}
              </div>
              {(match.opponentWins != null || match.opponentLosses != null) && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {match.opponentWins ?? 0}-{match.opponentLosses ?? 0}
                  </span>
                  <RankBadge rank={rankFromWins(match.opponentWins ?? 0)} size="sm" />
                </div>
              )}
              {match.opponentScorers && match.opponentScorers.length > 0 && (
                <div className="flex items-start gap-1.5 max-w-[12rem] text-sm leading-tight text-foreground font-semibold justify-center">
                  <SoccerBall size={14} className="mt-[3px] text-destructive shrink-0" />
                  <span className="text-center">
                    {match.opponentScorers.map((s, i) => (
                      <span key={s.name + i}>
                        {s.name.split(" ").slice(-1)[0]}
                        {s.goals > 1 ? ` (${s.goals})` : ""}
                        {i < match.opponentScorers!.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </span>
                </div>
              )}
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
              <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mr-1">Tactics</span>
              {match.tactics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-primary/15 text-primary border-primary/50"
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
                  <div className="text-[11px] uppercase tracking-[0.25em] font-bold text-amber-300">MVP</div>
                  <div className="font-display text-xl truncate">{mvpPlayer.name}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-1.5">
                    <PositionBadge position={mvpPlayer.position} size="xs" /> {mvpPlayer.overall} · {mvp.goals}G {mvp.assists}A
                  </div>
                </div>
                <div className="font-display text-3xl stat-num text-amber-300">{mvp.rating.toFixed(1)}</div>
              </div>
            </div>
          )}

          {/* Match Stats — For vs Against */}
          <MatchStatsCompare match={match} />

          {/* Goals & Assists — collapsible, two separate cards, starts minimized */}
          {(scorers.length > 0 || assisters.length > 0) && (
            <div className="surface-card overflow-hidden">
              <button
                type="button"
                onClick={() => setGaOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-secondary/40 transition text-left"
                aria-expanded={gaOpen}
              >
                <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
                  Goals & Assists
                </span>
                <span className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                  <span className="inline-flex items-center gap-1 text-primary"><SoccerBall size={11} /> {match.scoreFor}</span>
                  <span className="inline-flex items-center gap-1 text-sky-300"><SoccerBoot size={11} /> {assisters.reduce((s, a) => s + a.assists, 0)}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${gaOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              {gaOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3 pb-3">
                  <div className="rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2 flex items-center gap-1.5 text-primary">
                      <SoccerBall size={12} /> Goals · {match.scoreFor}
                    </div>
                    {scorers.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground">No goal scorers</div>
                    ) : (
                      <ul className="space-y-1">
                        {scorers.map((s) => (
                          <li key={s.player!.id} className="flex items-center justify-between text-[12px]">
                            <span className="truncate font-semibold">{s.player!.name}</span>
                            <span className="stat-num font-mono text-primary ml-2 shrink-0">×{s.goals}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/40 p-3">
                    <div className="text-[11px] uppercase tracking-[0.25em] font-bold mb-2 flex items-center gap-1.5 text-sky-300">
                      <SoccerBoot size={12} /> Assists · {assisters.reduce((s, a) => s + a.assists, 0)}
                    </div>
                    {assisters.length === 0 ? (
                      <div className="text-[11px] text-muted-foreground">No assists</div>
                    ) : (
                      <ul className="space-y-1">
                        {assisters.map((a) => (
                          <li key={a.player!.id} className="flex items-center justify-between text-[12px]">
                            <span className="truncate font-semibold">{a.player!.name}</span>
                            <span className="stat-num font-mono text-sky-300 ml-2 shrink-0">×{a.assists}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Player ratings */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2 flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" /> Player Ratings ({ratings.length})
            </div>
            {ratings.length === 0 ? (
              <div className="surface-card p-3 text-center text-xs text-muted-foreground">No participants logged</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {ratings.map(({ perf, player }, idx) => {
                  const r = perf.rating ?? 0;
                  // Highlight top-3 ratings in the match
                  const topRank = r > 0 && idx < 3 ? idx + 1 : 0;
                  const topStyle =
                    topRank === 1 ? { ring: "border-amber-400/70 bg-amber-400/10", text: "text-amber-300" } :
                    topRank === 2 ? { ring: "border-zinc-300/60 bg-zinc-300/10", text: "text-zinc-200" } :
                    topRank === 3 ? { ring: "border-amber-700/60 bg-amber-700/10", text: "text-amber-500" } :
                    null;
                  const tone = topStyle
                    ? topStyle.text
                    : r >= 6 ? "text-foreground"
                    : r > 0 ? "text-destructive"
                    : "text-muted-foreground";
                  return (
                    <div
                      key={perf.playerId}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md border ${topStyle ? topStyle.ring : "bg-background/50 border-border/60"}`}
                    >
                      <span className="font-display text-base text-foreground stat-num w-7 text-center shrink-0 leading-none">
                        {player!.overall}
                      </span>
                      <PositionBadge position={player!.position} size="xs" />
                      <div className="text-[12px] font-semibold truncate flex-1 leading-tight">{player!.name}</div>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
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
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {icon}
      {children}
    </span>
  );
}

function MatchStatsCompare({ match }: { match: Match }) {
  const rows: {
    label: string;
    forVal: number | undefined;
    againstVal: number | undefined;
    format: (n: number) => string;
    higherIsBetter: boolean;
  }[] = [
    {
      label: "Possession",
      forVal: typeof match.possessionFor === "number" ? match.possessionFor : undefined,
      againstVal:
        typeof match.possessionFor === "number" ? 100 - match.possessionFor : undefined,
      format: (n: number) => `${Math.round(n)}%`,
      higherIsBetter: true,
    },
    {
      label: "xG",
      forVal: typeof match.xgFor === "number" ? match.xgFor : undefined,
      againstVal: typeof match.xgAgainst === "number" ? match.xgAgainst : undefined,
      format: (n: number) => n.toFixed(2),
      higherIsBetter: true,
    },
    {
      label: "Passes",
      forVal: typeof match.passesFor === "number" ? match.passesFor : undefined,
      againstVal: typeof match.passesAgainst === "number" ? match.passesAgainst : undefined,
      format: (n: number) => String(Math.round(n)),
      higherIsBetter: true,
    },
    {
      label: "Shots",
      forVal: typeof match.shotsFor === "number" ? match.shotsFor : undefined,
      againstVal: typeof match.shotsAgainst === "number" ? match.shotsAgainst : undefined,
      format: (n: number) => String(Math.round(n)),
      higherIsBetter: true,
    },
  ].filter((r) => r.forVal !== undefined || r.againstVal !== undefined);

  if (rows.length === 0) return null;

  return (
    <div className="surface-card p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
        Match Stats
      </div>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const f = r.forVal ?? 0;
          const a = r.againstVal ?? 0;
          const total = f + a;
          const fPct = total > 0 ? (f / total) * 100 : 50;
          const aPct = total > 0 ? (a / total) * 100 : 50;
          const fWins = r.forVal !== undefined && r.againstVal !== undefined && (r.higherIsBetter ? f > a : f < a);
          const aWins = r.forVal !== undefined && r.againstVal !== undefined && (r.higherIsBetter ? a > f : a < f);
          return (
            <div key={r.label}>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className={`font-mono stat-num tabular-nums ${fWins ? "text-primary font-bold" : "text-foreground/80"}`}>
                  {r.forVal !== undefined ? r.format(r.forVal) : "—"}
                </span>
                <span className="uppercase tracking-wider text-muted-foreground font-bold">
                  {r.label}
                </span>
                <span className={`font-mono stat-num tabular-nums ${aWins ? "text-destructive font-bold" : "text-foreground/80"}`}>
                  {r.againstVal !== undefined ? r.format(r.againstVal) : "—"}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-background/60 border border-border/60 overflow-hidden flex">
                <div className="h-full bg-primary transition-all" style={{ width: `${fPct}%` }} />
                <div className="h-full bg-destructive/70 transition-all" style={{ width: `${aPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
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
      <div className={`text-[11px] uppercase tracking-[0.25em] font-bold mb-2 flex items-center gap-1.5 ${accent}`}>
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
