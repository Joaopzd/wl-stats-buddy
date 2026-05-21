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

/** Performance tiers based on average rating with a sample-size guard. */
export type PerformanceStatus = "ok" | "caution" | "critical" | "insufficient";
/** Minimum matches before underperformance warnings apply. */
export const UNDERPERFORM_MIN_MATCHES = 9;
export function performanceStatus(agg: { matches: number; avgRating: number; ratedMatches: number }): PerformanceStatus {
  if (agg.matches < UNDERPERFORM_MIN_MATCHES) return "insufficient";
  if (agg.ratedMatches === 0 || agg.avgRating <= 0) return "insufficient";
  if (agg.avgRating < 6.0) return "critical";
  if (agg.avgRating < 6.5) return "caution";
  return "ok";
}

/** Career manager-rating aggregate across all WLs that scored this player. */
export function managerRatingAggregate(
  playerId: string,
  wls: WeekendLeague[],
): { avg: number; count: number } {
  let sum = 0, count = 0;
  for (const wl of wls) {
    const r = wl.managerRatings?.[playerId];
    if (typeof r === "number" && r > 0) { sum += r; count += 1; }
  }
  return { avg: count ? sum / count : 0, count };
}

/**
 * Eye-test warning: player looks good on paper (system rating ≥ 7.0 with the
 * usual 9-match sample) but the manager rated them below 6.0 across at least
 * 3 WLs. Surfaces tactical mismatches the automated stats miss.
 */
export function eyeTestMismatch(
  systemAvg: number,
  matches: number,
  managerAvg: number,
  managerCount: number,
): boolean {
  return (
    matches >= UNDERPERFORM_MIN_MATCHES &&
    systemAvg >= 7.0 &&
    managerCount >= 3 &&
    managerAvg > 0 &&
    managerAvg < 6.0
  );
}

/** Club-wide win rate across the given matches. */
export function clubWinRate(matches: Match[]): { wins: number; played: number; rate: number } {
  let wins = 0;
  for (const m of matches) if (matchIsWin(m)) wins += 1;
  return { wins, played: matches.length, rate: matches.length ? wins / matches.length : 0 };
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
  /** Matches won while this player was on the pitch. */
  wins: number;
  /** wins / matches (0–1). 0 if no matches. */
  winRate: number;
  /** Substitute appearances. */
  subMatches: number;
  subGoals: number;
  subAssists: number;
  subGA: number;
  /** Average rating across rated sub appearances. */
  subAvgRating: number;
  /** Composite "Super Sub" index: rewards G+A per sub appearance, volume, and rating. */
  subImpact: number;
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

/** Super-sub impact: (G+A per sub appearance) × √subMatches × rating weight. */
export function computeSubImpact(subGA: number, subMatches: number, subAvgRating: number): number {
  if (subMatches <= 0) return 0;
  const perGame = subGA / subMatches;
  const ratingWeight = (subAvgRating > 0 ? subAvgRating : 6) / 6;
  return perGame * Math.sqrt(subMatches) * ratingWeight;
}

export function aggregatePlayer(player: Player, matches: Match[]): PlayerAgg {
  let m = 0, g = 0, a = 0, wins = 0;
  let ratingSum = 0, ratedMatches = 0;
  let mvpCount = 0, cleanSheets = 0, goalsConceded = 0;
  let subM = 0, subG = 0, subA = 0, subRatingSum = 0, subRated = 0;
  for (const match of matches) {
    const perf = match.performances.find((p) => p.playerId === player.id);
    if (!perf) continue;
    m += 1;
    g += perf.goals;
    a += perf.assists;
    if (matchIsWin(match)) wins += 1;
    const r = perf.rating ?? 0;
    if (r > 0) {
      ratingSum += r;
      ratedMatches += 1;
    }
    if (isGoalsConcededEligible(player.position)) {
      goalsConceded += match.scoreAgainst;
    }
    if (isCleanSheetEligible(player.position) && match.scoreAgainst === 0) {
      cleanSheets += 1;
    }
    if (computeMvpId(match) === player.id) mvpCount += 1;
    if (perf.role === "sub") {
      subM += 1;
      subG += perf.goals;
      subA += perf.assists;
      if (r > 0) { subRatingSum += r; subRated += 1; }
    }
  }
  const ga = g + a;
  const subGA = subG + subA;
  const subAvgRating = subRated ? subRatingSum / subRated : 0;
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
    wins,
    winRate: m ? wins / m : 0,
    subMatches: subM,
    subGoals: subG,
    subAssists: subA,
    subGA,
    subAvgRating,
    subImpact: computeSubImpact(subGA, subM, subAvgRating),
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
