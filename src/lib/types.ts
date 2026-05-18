export type PlayerRole = "starter" | "sub";

export type Position =
  | "GK"
  | "LB" | "CB" | "RB"
  | "CDM" | "CM" | "LM" | "RM" | "CAM"
  | "LW" | "RW" | "ST";

export type Rarity =
  // Standard
  | "Gold" | "Silver" | "Bronze"
  // Promos / specials
  | "TOTW"
  | "Cornerstone"
  | "Winter Wildcards"
  | "TOTY"
  | "TOTS"
  | "Ratings Reload"
  | "Ultimate Scream"
  | "FoF Captains"
  | "FC Pro Live"
  | "Thunderstruck"
  | "Joga Bonito"
  | "Unbreakables"
  | "Time Warp"
  | "Future Stars"
  | "Knockout Royalty"
  | "UEFA Primetime"
  | "UEFA RTTF"
  | "FUT Birthday"
  | "Fantasy FC"
  | "FoF Answer the Call"
  | "Path to Glory"
  | "Trophy Titans"
  | "Evo"
  | "FUT Champions TOTS"
  // Legends
  | "Icon Base"
  | "Hero Base";

export type Platform = "PC" | "PS5" | "Xbox";

export interface Player {
  id: string;
  name: string;
  position: Position;
  overall: number;
  rarity: Rarity;
  /** Optional direct URL to a player card image (e.g. Futbin / EA). Falls back to the rarity card when empty or broken. */
  imageUrl?: string;
  createdAt: number;
}

export interface MatchPlayerStat {
  playerId: string;
  goals: number;
  assists: number;
  /** Match rating 0–10, one decimal. 0 = no rating recorded yet. */
  rating: number;
}

export type PenaltyWinner = "us" | "them";

export interface Match {
  id: string;
  wlId: string;
  index: number;
  scoreFor: number;
  scoreAgainst: number;
  platform: Platform;
  performances: MatchPlayerStat[];
  /** Match went to extra time. */
  extraTime?: boolean;
  /** Match went to penalty shootout. */
  penalties?: boolean;
  /** Who won the shootout (only meaningful if penalties=true). */
  penaltyWinner?: PenaltyWinner;
  /** Opponent rage-quit early. */
  rageQuit?: boolean;
  /** Player designated as MVP for this match (must also have a performance entry). */
  mvpPlayerId?: string;
  /** Selected generic opponent crest id (see lib/crests). */
  opponentCrestId?: string;
  createdAt: number;
}

import type { FormationName } from "./formations";

export interface WeekendLeague {
  id: string;
  number: number;
  /** User-provided custom name (e.g. "TOTS Premiere WL"). Falls back to "WL #N" when empty. */
  customName?: string;
  squadPlayerIds: string[];
  createdAt: number;
  closed?: boolean;
  /** Tactical formation chosen for this WL. Optional for legacy WLs. */
  formation?: FormationName;
  /** Map slot id (e.g. "ST1") → playerId. Starting 11. */
  startingAssignments?: Record<string, string>;
  /** Bench player IDs (subset of squadPlayerIds, not in startingAssignments). */
  benchPlayerIds?: string[];
  /** Player IDs added via the end-of-WL Player Pick (Red Pick) flow. */
  playerPickIds?: string[];
}

/** Convenience: render the user-facing label for a WL. */
export function wlLabel(wl: Pick<WeekendLeague, "number" | "customName">): string {
  return wl.customName?.trim() || `WL #${wl.number}`;
}
