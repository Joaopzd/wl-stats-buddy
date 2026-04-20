export type Position = "GK" | "DEF" | "MID" | "ATT";
export type Rarity = "Common" | "Rare" | "Gold" | "TOTW" | "Icon" | "Hero" | "Special";
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
  offensive: number; // shots / dribbles
  defensive: number; // tackles / interceptions
}

export interface Match {
  id: string;
  wlId: string;
  index: number; // 1..15
  scoreFor: number;
  scoreAgainst: number;
  platform: Platform;
  performances: MatchPlayerStat[];
  createdAt: number;
}

export interface WeekendLeague {
  id: string;
  number: number;
  squadPlayerIds: string[];
  createdAt: number;
  closed?: boolean;
}
