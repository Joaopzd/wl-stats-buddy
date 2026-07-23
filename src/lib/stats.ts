import type { Match, Platform, Player, Position, WeekendLeague } from "./types";

/** Aggregated counts of "special" match-flag events across a set of matches. */
export interface MatchFlagTotals {
  extraTime: number;
  penalties: number;
  penaltiesWon: number;
  penaltiesLost: number;
  rageQuitUs: number;
  rageQuitThem: number;
  played: number;
}

export function matchFlagTotals(matches: Match[]): MatchFlagTotals {
  let extraTime = 0, penalties = 0, pw = 0, pl = 0, rqUs = 0, rqThem = 0;
  for (const m of matches) {
    if (m.extraTime) extraTime += 1;
    if (m.penalties) {
      penalties += 1;
      if (m.penaltyWinner === "us") pw += 1;
      else if (m.penaltyWinner === "them") pl += 1;
    }
    if (m.rageQuit) {
      const by = m.rageQuitBy ?? "them"; // legacy: rageQuit=true meant opponent
      if (by === "us") rqUs += 1;
      else rqThem += 1;
    }
  }
  return {
    extraTime,
    penalties,
    penaltiesWon: pw,
    penaltiesLost: pl,
    rageQuitUs: rqUs,
    rageQuitThem: rqThem,
    played: matches.length,
  };
}

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

/** High-pressure window: final stretch of a Weekend League (matches 11–15). */
export const CLUTCH_MIN_INDEX = 11;
export const CLUTCH_MAX_INDEX = 15;
/** Minimum high-pressure appearances required before a clutch badge is awarded. */
export const CLUTCH_MIN_MATCHES = 5;
/** Composite clutch score threshold that earns a Pressure Drop badge (any negative delta). */
export const CLUTCH_DROP_DELTA = 0;
/** Weight applied to (G+A per game) delta when composing the clutch score. */
export const CLUTCH_GA_WEIGHT = 1.5;

/** Human-readable tooltip explaining the Clutch King badge rule. */
export const CLUTCH_KING_TOOLTIP =
  `Clutch King — Awarded when a player has at least ${CLUTCH_MIN_MATCHES} appearances in the high-pressure stretch (matches ${CLUTCH_MIN_INDEX}–${CLUTCH_MAX_INDEX}) and their composite clutch score (rating delta + ${CLUTCH_GA_WEIGHT}× G+A/game delta vs baseline) is positive.`;
/** Human-readable tooltip explaining the Pressure Drop badge rule. */
export const CLUTCH_DROP_TOOLTIP =
  `Pressure Drop — Awarded when a player has at least ${CLUTCH_MIN_MATCHES} appearances in matches ${CLUTCH_MIN_INDEX}–${CLUTCH_MAX_INDEX} and their composite clutch score (rating + ${CLUTCH_GA_WEIGHT}× G+A/game vs baseline) is negative compared to their baseline.`;

export function isClutchMatch(m: Match): boolean {
  return m.index >= CLUTCH_MIN_INDEX && m.index <= CLUTCH_MAX_INDEX;
}

export type ClutchBadge = "king" | "drop" | null;

export interface ClutchSplit {
  matches: number;
  goals: number;
  assists: number;
  avgRating: number;
  ratedMatches: number;
}

export interface ClutchAgg {
  player: Player;
  baseline: ClutchSplit;
  clutch: ClutchSplit;
  /** clutch.avgRating - baseline.avgRating; 0 when either side has no rated matches. */
  ratingDelta: number;
  /** (clutch G+A/game) - (baseline G+A/game); 0 when either side has no matches. */
  gaPerGameDelta: number;
  /** Composite ranking score: ratingDelta + CLUTCH_GA_WEIGHT × gaPerGameDelta. */
  clutchScore: number;
  /** Awarded only when clutch.matches >= CLUTCH_MIN_MATCHES and both sides have a rating. */
  badge: ClutchBadge;
}

function toSplit(a: PlayerAgg): ClutchSplit {
  return {
    matches: a.matches,
    goals: a.goals,
    assists: a.assists,
    avgRating: a.avgRating,
    ratedMatches: a.ratedMatches,
  };
}

export function clutchAggregate(player: Player, matches: Match[]): ClutchAgg {
  const baseline = aggregatePlayer(player, matches);
  const clutch = aggregatePlayer(player, matches.filter(isClutchMatch));
  const bothRated = baseline.ratedMatches > 0 && clutch.ratedMatches > 0;
  const ratingDelta = bothRated ? clutch.avgRating - baseline.avgRating : 0;
  const gaPerGameDelta =
    baseline.matches > 0 && clutch.matches > 0 ? clutch.gaPerGame - baseline.gaPerGame : 0;
  const clutchScore = ratingDelta + CLUTCH_GA_WEIGHT * gaPerGameDelta;
  let badge: ClutchBadge = null;
  if (clutch.matches >= CLUTCH_MIN_MATCHES && bothRated) {
    if (clutchScore < 0) badge = "drop";
    else if (clutchScore > 0) badge = "king";
  }
  return {
    player,
    baseline: toSplit(baseline),
    clutch: toSplit(clutch),
    ratingDelta,
    gaPerGameDelta,
    clutchScore,
    badge,
  };
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
  /** Difficulty-adjusted win rate (0–1). Weighted by match index + ET/pen context. */
  adjustedWinRate: number;
}

/**
 * Difficulty weight for a single match. Later matches in a WL and
 * extra-time / penalty deciders are harder, so wins there are worth more
 * (and losses hurt less proportionally). Weight range ~1.0 → ~1.85.
 */
export function matchDifficultyWeight(m: Match): number {
  const idx = Math.min(15, Math.max(1, m.index || 1));
  let w = 1 + (idx - 1) * 0.05; // 1.00 → 1.70 across M1..M15
  if (m.extraTime) w += 0.1;
  if (m.penalties) w += 0.05;
  return w;
}

/** Weighted win rate over a match set (0–1). Falls back to 0 when empty. */
export function adjustedWinRate(matches: Match[]): number {
  let wsum = 0, wwin = 0;
  for (const m of matches) {
    const w = matchDifficultyWeight(m);
    wsum += w;
    if (matchIsWin(m)) wwin += w;
  }
  return wsum ? wwin / wsum : 0;
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
      adjustedWinRate: adjustedWinRate(ms),
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

/** Consecutive wins counting backwards from the most recent match. */
export function currentWinStreak(matches: Match[]): number {
  const sorted = [...matches].sort((a, b) => a.index - b.index);
  let cur = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (matchIsWin(sorted[i])) cur += 1;
    else break;
  }
  return cur;
}

/**
 * Club identity profile derived from WL snapshots. Each unique
 * (clubName, clubCrestUrl) tuple used across WLs becomes its own profile,
 * so the Club page can split lifetime stats per identity.
 */
export interface ClubProfile {
  id: string;
  name: string;
  crestUrl: string | null;
  wlIds: string[];
}

export function deriveClubProfiles(wls: WeekendLeague[]): ClubProfile[] {
  // Group by normalized club name only. The crest URL can legitimately change
  // between WLs (re-upload, storage path vs data URL, signed URL refresh) for
  // the same club identity — keying by URL caused duplicate profiles for what
  // the user considers a single club. Name is normalized (trimmed + lowercased)
  // so casing/whitespace tweaks don't fork the profile either.
  const map = new Map<string, ClubProfile & { _displayName: string }>();
  for (const wl of wls) {
    const rawName = (wl.clubName ?? "").trim();
    const key = rawName.toLowerCase();
    const crest = wl.clubCrestUrl ?? null;
    let p = map.get(key);
    if (!p) {
      p = {
        id: key || "__unnamed__",
        name: rawName || "Unnamed Club",
        _displayName: rawName,
        crestUrl: crest,
        wlIds: [],
      };
      map.set(key, p);
    } else if (crest && !p.crestUrl) {
      // Prefer any crest we have over null.
      p.crestUrl = crest;
    }
    p.wlIds.push(wl.id);
  }
  return [...map.values()]
    .map(({ _displayName, ...p }) => p)
    .sort((a, b) => b.wlIds.length - a.wlIds.length);
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
      return "rank-badge rank-badge--elite bg-gradient-to-r from-purple-600/30 to-amber-400/30 text-amber-200 border-amber-400/60";
    case "Champion":
      return "rank-badge rank-badge--champion bg-gradient-to-r from-red-600/30 to-amber-500/30 text-amber-200 border-red-500/60";
    case "Contender":
      return "rank-badge rank-badge--contender bg-gradient-to-r from-sky-600/25 to-slate-300/25 text-sky-200 border-sky-400/50";
    default:
      return "rank-badge rank-badge--unranked bg-secondary text-muted-foreground border-border";
  }
}

// ============ All-time / dashboard helpers ============

export interface AllTimeSummary {
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  winRate: number;
  /** Difficulty-adjusted win rate across every logged match. */
  adjustedWinRate: number;
  bestResult: { wl: WeekendLeague; wins: number } | null;
  bestRank: WLRank;
  currentRank: WLRank;
}

export function aggregateAllTime(wls: WeekendLeague[], matches: Match[]): AllTimeSummary {
  let wins = 0, losses = 0, gf = 0, ga = 0;
  for (const m of matches) {
    gf += m.scoreFor; ga += m.scoreAgainst;
    if (matchIsWin(m)) wins += 1; else losses += 1;
  }
  let best: { wl: WeekendLeague; wins: number } | null = null;
  for (const wl of wls) {
    const r = wlRecord(wl, matches);
    if (!best || r.wins > best.wins) best = { wl, wins: r.wins };
  }
  const sorted = [...wls].sort((a, b) => b.number - a.number);
  const last = sorted[0];
  const played = wins + losses;
  return {
    wins,
    losses,
    goalsFor: gf,
    goalsAgainst: ga,
    goalDiff: gf - ga,
    winRate: played ? wins / played : 0,
    adjustedWinRate: adjustedWinRate(matches),
    bestResult: best,
    bestRank: best ? rankFromWins(best.wins) : "Unranked",
    currentRank: last ? rankFromWins(wlRecord(last, matches).wins) : "Unranked",
  };
}

/** Rolling comparison between the latest WL and the one before it. */
export interface WeekDelta {
  current: WeekendLeague | null;
  previous: WeekendLeague | null;
  wins: number;
  winsDelta: number;
  losses: number;
  lossesDelta: number;
  goalDiff: number;
  goalDiffDelta: number;
  winRate: number;
  winRateDelta: number;
  adjWinRate: number;
  adjWinRateDelta: number;
  played: number;
}

export function weekDelta(wls: WeekendLeague[], matches: Match[]): WeekDelta {
  const sorted = [...wls].sort((a, b) => b.number - a.number);
  const current = sorted[0] ?? null;
  const previous = sorted[1] ?? null;
  const curMatches = current ? matches.filter((m) => m.wlId === current.id) : [];
  const prevMatches = previous ? matches.filter((m) => m.wlId === previous.id) : [];
  const curR = current ? wlRecord(current, matches) : { wins: 0, losses: 0, played: 0, goalsFor: 0, goalsAgainst: 0 };
  const prevR = previous ? wlRecord(previous, matches) : { wins: 0, losses: 0, played: 0, goalsFor: 0, goalsAgainst: 0 };
  const curWR = curR.played ? curR.wins / curR.played : 0;
  const prevWR = prevR.played ? prevR.wins / prevR.played : 0;
  const curAdj = adjustedWinRate(curMatches);
  const prevAdj = adjustedWinRate(prevMatches);
  const curGD = curR.goalsFor - curR.goalsAgainst;
  const prevGD = prevR.goalsFor - prevR.goalsAgainst;
  return {
    current,
    previous,
    wins: curR.wins,
    winsDelta: curR.wins - prevR.wins,
    losses: curR.losses,
    lossesDelta: curR.losses - prevR.losses,
    goalDiff: curGD,
    goalDiffDelta: curGD - prevGD,
    winRate: curWR,
    winRateDelta: curWR - prevWR,
    adjWinRate: curAdj,
    adjWinRateDelta: curAdj - prevAdj,
    played: curR.played,
  };
}

export interface HistoricLeaders {
  topScorer: PlayerAgg | null;
  topAssister: PlayerAgg | null;
  topContrib: PlayerAgg | null;
  mostApps: PlayerAgg | null;
  topRated: PlayerAgg[];
}

export function historicLeaders(players: Player[], matches: Match[]): HistoricLeaders {
  const aggs = aggregateAllPlayers(players, matches).filter((a) => a.matches > 0);
  const totalMatches = matches.length;
  // Spec: filter out players with < 50% of matches played.
  const minRatingApps = Math.max(1, Math.ceil(totalMatches * 0.5));
  const byGoals = [...aggs].sort((a, b) => b.goals - a.goals || b.ga - a.ga || b.matches - a.matches);
  const byAssists = [...aggs].sort((a, b) => b.assists - a.assists || b.ga - a.ga || b.matches - a.matches);
  const byGA = [...aggs].sort((a, b) => b.ga - a.ga || b.goals - a.goals || b.matches - a.matches);
  const byApps = [...aggs].sort((a, b) => b.matches - a.matches || b.ga - a.ga);
  const topRated = aggs
    .filter((a) => a.matches >= minRatingApps && a.ratedMatches > 0 && a.avgRating > 0)
    .sort(
      (a, b) =>
        b.avgRating - a.avgRating ||
        b.ratedMatches - a.ratedMatches ||
        b.matches - a.matches ||
        b.ga - a.ga,
    )
    .slice(0, 3);
  return {
    topScorer: byGoals[0] ?? null,
    topAssister: byAssists[0] ?? null,
    topContrib: byGA[0] ?? null,
    mostApps: byApps[0] ?? null,
    topRated,
  };
}

/**
 * Consecutive WL absences counted from the newest WL backwards.
 * A player is considered "absent" from a WL if they have zero match
 * performances in it. Players created after a WL are exempt (loop stops).
 */
export function consecutiveWLAbsence(
  player: Player,
  wls: WeekendLeague[],
  matches: Match[],
): number {
  const sorted = [...wls].sort((a, b) => b.number - a.number);
  let absent = 0;
  for (const wl of sorted) {
    if (player.createdAt > wl.createdAt) break;
    const played = matches.some(
      (m) => m.wlId === wl.id && m.performances.some((p) => p.playerId === player.id),
    );
    if (played) break;
    absent += 1;
  }
  return absent;
}

