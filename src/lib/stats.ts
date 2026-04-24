import type { Match, Player, WeekendLeague } from "./types";

export interface PlayerAgg {
  player: Player;
  matches: number;
  goals: number;
  assists: number;
  offensive: number;
  defensive: number;
  ga: number;
  gaPerGame: number;
  /** Career average match rating (0–10). 0 if no rated appearances. */
  avgRating: number;
  /** Number of appearances that had a rating > 0 (used for the avg). */
  ratedMatches: number;
}

export function aggregatePlayer(player: Player, matches: Match[]): PlayerAgg {
  let m = 0, g = 0, a = 0, off = 0, def = 0;
  let ratingSum = 0, ratedMatches = 0;
  for (const match of matches) {
    const perf = match.performances.find((p) => p.playerId === player.id);
    if (!perf) continue;
    m += 1;
    g += perf.goals;
    a += perf.assists;
    off += perf.offensive;
    def += perf.defensive;
    // Treat undefined / 0 as "no rating recorded" so legacy data doesn't drag averages.
    const r = perf.rating ?? 0;
    if (r > 0) {
      ratingSum += r;
      ratedMatches += 1;
    }
  }
  const ga = g + a;
  return {
    player,
    matches: m,
    goals: g,
    assists: a,
    offensive: off,
    defensive: def,
    ga,
    gaPerGame: m ? ga / m : 0,
    avgRating: ratedMatches ? ratingSum / ratedMatches : 0,
    ratedMatches,
  };
}

export function aggregateAllPlayers(players: Player[], matches: Match[]): PlayerAgg[] {
  return players.map((p) => aggregatePlayer(p, matches));
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
    if (m.scoreFor > m.scoreAgainst) wins += 1;
    else losses += 1;
  }
  return { wins, losses, played: ms.length, goalsFor: gf, goalsAgainst: ga };
}

export function bestStreak(matches: Match[]): number {
  let best = 0, cur = 0;
  const sorted = [...matches].sort((a, b) => a.index - b.index);
  for (const m of sorted) {
    if (m.scoreFor > m.scoreAgainst) {
      cur += 1;
      best = Math.max(best, cur);
    } else cur = 0;
  }
  return best;
}

export type WLRank =
  | "Bronze III" | "Bronze II" | "Bronze I"
  | "Silver III" | "Silver II" | "Silver I"
  | "Gold III" | "Gold II" | "Gold I"
  | "Elite III" | "Elite II" | "Elite I"
  | "Champion";

export function rankFromWins(wins: number): WLRank {
  if (wins >= 14) return "Champion";
  if (wins >= 11) return "Elite I";
  if (wins >= 9) return "Elite II";
  if (wins >= 7) return "Elite III";
  if (wins >= 5) return "Gold I";
  if (wins >= 4) return "Gold II";
  if (wins >= 3) return "Gold III";
  if (wins >= 2) return "Silver I";
  if (wins >= 1) return "Silver II";
  return "Bronze I";
}
