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
  createdAt: number;
}

export interface MatchPlayerStat {
  playerId: string;
  goals: number;
  assists: number;
  offensive: number;
  defensive: number;
  /** Match rating 0–10, one decimal. 0 = no rating recorded yet (legacy migration). */
  rating: number;
}

export interface Match {
  id: string;
  wlId: string;
  index: number;
  scoreFor: number;
  scoreAgainst: number;
  platform: Platform;
  performances: MatchPlayerStat[];
  createdAt: number;
}

import type { FormationName } from "./formations";

export interface WeekendLeague {
  id: string;
  number: number;
  squadPlayerIds: string[];
  createdAt: number;
  closed?: boolean;
  /** Tactical formation chosen for this WL. Optional for legacy WLs. */
  formation?: FormationName;
  /** Map slot id (e.g. "ST1") → playerId. Starting 11. */
  startingAssignments?: Record<string, string>;
  /** Bench player IDs (subset of squadPlayerIds, not in startingAssignments). */
  benchPlayerIds?: string[];
}
