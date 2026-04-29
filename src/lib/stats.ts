import type { Match, Platform, Player, Position, WeekendLeague } from "./types";

/** Positions eligible to earn Clean Sheet credit. */
const CS_POSITIONS: Position[] = ["GK", "CB", "LB", "RB"];
/** Positions that track Goals Conceded individually. */
const GC_POSITIONS: Position[] = ["GK"];

export function isCleanSheetEligible(pos: Position): boolean {
  return CS_POSITIONS.includes(pos);
}
export function isGoalsConcededEligible(pos: Position): boolean {
  return GC_POSITIONS.includes(pos);
}

export interface PlayerAgg {
  player: Player;
  matches: number;
  goals: number;
  assists: number;
  ga: number;
  gaPerGame: number;
  /** Career average match rating (0–10). 0 if no rated appearances. */
  avgRating: number;
  /** Number of appearances that had a rating > 0 (used for the avg). */
  ratedMatches: number;
  /** Number of matches the player was the MVP. */
  mvpCount: number;
  /** Number of played matches where opponent scored 0. */
  cleanSheets: number;
  /** Total goals conceded across the player's appearances. */
  goalsConceded: number;
}

/** Auto-MVP fallback: explicit mvpPlayerId, else highest rated performance. */
export function computeMvpId(match: Match): string | null {
  if (match.mvpPlayerId) return match.mvpPlayerId;
  const rated = match.performances.filter((p) => (p.rating ?? 0) > 0);
  if (!rated.length) return null;
  const sorted = [...rated].sort(
    (a, b) =>
      (b.rating ?? 0) - (a.rating ?? 0) ||
      (b.goals + b.assists) - (a.goals + a.assists) ||
      b.goals - a.goals,
  );
  return sorted[0].playerId;
}

export function aggregatePlayer(player: Player, matches: Match[]): PlayerAgg {
  let m = 0, g = 0, a = 0;
  let ratingSum = 0, ratedMatches = 0;
  let mvpCount = 0, cleanSheets = 0, goalsConceded = 0;
  for (const match of matches) {
    const perf = match.performances.find((p) => p.playerId === player.id);
    if (!perf) continue;
    m += 1;
    g += perf.goals;
    a += perf.assists;
    const r = perf.rating ?? 0;
    if (r > 0) {
      ratingSum += r;
      ratedMatches += 1;
    }
    goalsConceded += match.scoreAgainst;
    if (match.scoreAgainst === 0) cleanSheets += 1;
    if (computeMvpId(match) === player.id) mvpCount += 1;
  }
  const ga = g + a;
  return {
    player,
    matches: m,
    goals: g,
    assists: a,
    ga,
    gaPerGame: m ? ga / m : 0,
    avgRating: ratedMatches ? ratingSum / ratedMatches : 0,
    ratedMatches,
    mvpCount,
    cleanSheets,
    goalsConceded,
  };
}

export function aggregateAllPlayers(players: Player[], matches: Match[]): PlayerAgg[] {
  return players.map((p) => aggregatePlayer(p, matches));
}

export interface PlatformRecord {
  platform: Platform;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
}

export function platformRecords(matches: Match[]): PlatformRecord[] {
  const platforms: Platform[] = ["PC", "PS5", "Xbox"];
  return platforms.map((platform) => {
    const ms = matches.filter((m) => m.platform === platform);
    let wins = 0, losses = 0;
    for (const m of ms) {
      if (matchIsWin(m)) wins += 1;
      else losses += 1;
    }
    return {
      platform,
      played: ms.length,
      wins,
      losses,
      winRate: ms.length ? wins / ms.length : 0,
    };
  });
}

export interface WLRecord {
  wins: number;
  losses: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
}

export function wlRecord(wl: WeekendLeague, matches: Match[]): WLRecord {
  const ms = matches.filter((m) => m.wlId === wl.id);
  let wins = 0, losses = 0, gf = 0, ga = 0;
  for (const m of ms) {
    gf += m.scoreFor;
    ga += m.scoreAgainst;
    if (matchIsWin(m)) wins += 1;
    else losses += 1;
  }
  return { wins, losses, played: ms.length, goalsFor: gf, goalsAgainst: ga };
}

/** Determine if a match is a win, taking into account penalty shootouts. */
export function matchIsWin(m: Match): boolean {
  if (m.penalties && m.penaltyWinner) return m.penaltyWinner === "us";
  return m.scoreFor > m.scoreAgainst;
}

export function bestStreak(matches: Match[]): number {
  let best = 0, cur = 0;
  const sorted = [...matches].sort((a, b) => a.index - b.index);
  for (const m of sorted) {
    if (matchIsWin(m)) {
      cur += 1;
      best = Math.max(best, cur);
    } else cur = 0;
  }
  return best;
}

export type RankTier = "Elite" | "Champion" | "Contender" | "Unranked";

export type WLRank =
  | "Unranked"
  | "Contender V" | "Contender IV" | "Contender III" | "Contender II" | "Contender I"
  | "Champion V" | "Champion IV" | "Champion III" | "Champion II" | "Champion I"
  | "Elite V" | "Elite IV" | "Elite III" | "Elite II" | "Elite I";

export function rankFromWins(wins: number): WLRank {
  if (wins >= 15) return "Elite I";
  if (wins === 14) return "Elite II";
  if (wins === 13) return "Elite III";
  if (wins === 12) return "Elite IV";
  if (wins === 11) return "Elite V";
  if (wins === 10) return "Champion I";
  if (wins === 9) return "Champion II";
  if (wins === 8) return "Champion III";
  if (wins === 7) return "Champion IV";
  if (wins === 6) return "Champion V";
  if (wins === 5) return "Contender I";
  if (wins === 4) return "Contender II";
  if (wins === 3) return "Contender III";
  if (wins === 2) return "Contender IV";
  if (wins === 1) return "Contender V";
  return "Unranked";
}

export function rankTier(rank: WLRank): RankTier {
  if (rank.startsWith("Elite")) return "Elite";
  if (rank.startsWith("Champion")) return "Champion";
  if (rank.startsWith("Contender")) return "Contender";
  return "Unranked";
}

/** Tailwind classes for a rank badge based on its tier. */
export function rankBadgeClasses(rank: WLRank): string {
  const tier = rankTier(rank);
  switch (tier) {
    case "Elite":
      return "bg-gradient-to-r from-purple-600/30 to-amber-400/30 text-amber-200 border-amber-400/60";
    case "Champion":
      return "bg-gradient-to-r from-red-600/30 to-amber-500/30 text-amber-200 border-red-500/60";
    case "Contender":
      return "bg-gradient-to-r from-sky-600/25 to-slate-300/25 text-sky-200 border-sky-400/50";
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}
