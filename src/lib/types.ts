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
  | "Prime Heroes"
  | "World Tour"
  | "EOAE"
  | "FUT Birthday Icon"
  | "Heroes Ultimate Scream"
  | "Journey of Nations"
  | "National Pride"
  | "Icon TOTY"
  | "MH TOTS"
  | "TOTS Highlights"
  | "UEFA Europa League"
  | "UEFA Champions League"
  | "UEFA Conference League"
  | "Showdown"
  | "FOF: Greats of The Game Icon"
  | "FOF: Greats of The Game Hero"
  | "FOF: Glory Hunters"
  | "FOF: Star Perform"
  | "FOF: Phenoms"
  | "FoF: Summer Star"
  | "Futties"
  // Legends
  | "Icon Base"
  | "Hero Base";

export type Platform = "PC" | "PS5" | "Xbox";

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}
 
export interface PlayerEvolution {
  /** Nome livre pra identificar a evolução, ex: "Evo Finalização". */
  label?: string;
  /** Overall resultante depois de aplicar a evolução. */
  newOverall: number;
  /** Raridade resultante (evoluções normalmente sobem de raridade). */
  newRarity: Rarity;
  /** Só os atributos que mudaram — some com os atributos base na hora de exibir. */
  attributeDeltas: Partial<PlayerAttributes>;
  appliedAt: number;
}


export interface Player {
  id: string;
  name: string;// novos campos vindos do catálogo FC 27
club?: string;
league?: string;
gender?: string;
skillMoves?: number;
weakFoot?: number;
weightKg?: number;
birthdate?: string;
playstyles?: string[];
pace?: number;
shooting?: number;
passing?: number;
dribbling?: number;
defending?: number;
physical?: number;
catalogPlayerId?: number; // liga a carta ao fc27_ratings.id — útil pra evolução depois
  position: Position;
  /** Up to 4 secondary positions the player can also play. */
  secondaryPositions?: Position[];
  overall: number;
  rarity: Rarity;
  /** Optional direct URL to a player card image (e.g. Futbin / EA). Falls back to the rarity card when empty or broken. */
  imageUrl?: string;
  /** When true, hide the player from the active roster but keep historical match data. */
  isArchived?: boolean;
  /** Player is being trained / tested. Hidden from active roster, still searchable in WL squad picker. */
  isInDevelopment?: boolean;
  /** Timestamp when the player was last manually restored to Active/Dev from Archive. Resets the auto-archive absence counter. */
  restoredAt?: number;
  /** ISO country code or country name for the player's nationality. */
  nationality?: string;
  /** Height in centimeters. */
  heightCm?: number;
  /** Preferred foot. */
  preferredFoot?: "Left" | "Right";
  createdAt: number;
   /** Ratings/atributos (PAC/SHO/PAS/DRI/DEF/PHY). Opcional p/ jogadores legados. */
  attributes?: PlayerAttributes;
//   /** id da linha em fc27_ratings de onde os atributos foram importados, se veio do catálogo. */
  catalogId?: number;
//   /** Evolução aplicada nesta carta (simples: só valores + raridade, sem árvore complexa). */
  evolution?: PlayerEvolution;
  
}

export interface MatchPlayerStat {
  playerId: string;
  goals: number;
  assists: number;
  /** Match rating 0–10, one decimal. 0 = no rating recorded yet. */
  rating: number;
  /** Whether the player was a starter or came off the bench. Defaults to "starter" for legacy matches. */
  role?: PlayerRole;
}

export type PenaltyWinner = "us" | "them";

/** Tactical adjustments / context tags applied during a match. */
export type MatchTactic =
  | "Mudança Defensiva"
  | "Esquema Tático"
  | "Mudança Meio Campo"
  | "Mudança Ataque"
  | "High-Press Tático"
  | "Delay Game"
  | "Conta de Cliente"
  | "Break Time";

export const MATCH_TACTICS: MatchTactic[] = [
  "Mudança Defensiva",
  "Esquema Tático",
  "Mudança Meio Campo",
  "Mudança Ataque",
  "High-Press Tático",
  "Delay Game",
  "Conta de Cliente",
  "Break Time",
];

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
  /** A rage quit occurred. (Legacy: true === opponent quit.) */
  rageQuit?: boolean;
  /** Who rage-quit. Defaults to "them" when rageQuit=true and this is unset (legacy). */
  rageQuitBy?: "us" | "them";
  /** Player designated as MVP for this match (must also have a performance entry). */
  mvpPlayerId?: string;
  /** Selected generic opponent crest id (see lib/crests). */
  opponentCrestId?: string;
  /** Optional tactical adjustments / context tags taken during the match. */
  tactics?: MatchTactic[];
  /** Possession % for the user's team (0–100). Opponent is the complement. */
  possessionFor?: number;
  /** Expected Goals for the user's team. */
  xgFor?: number;
  /** Expected Goals for the opponent. */
  xgAgainst?: number;
  /** Total passes attempted/completed by the user's team. */
  passesFor?: number;
  /** Total passes attempted/completed by the opponent. */
  passesAgainst?: number;
  /** Total shots (finalizações) taken by the user's team. */
  shotsFor?: number;
  /** Total shots taken by the opponent. */
  shotsAgainst?: number;
  /** Match ended in a disconnect — auto-loss, no per-player stats counted. */
  disconnect?: boolean;
  /** Match connection quality, 0 (unplayable) → 5 (no delay). Optional for legacy matches. */
  connection?: number;
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
  /** Subjective post-WL manager rating per player (0–10, 0.5 increments). */
  managerRatings?: Record<string, number>;
  /** Snapshot of the active club name at the moment this WL was created. Frozen forever. */
  clubName?: string;
  /** Snapshot of the active club crest URL at the moment this WL was created. Frozen forever. */
  clubCrestUrl?: string | null;
  /** Watermark element id (see lib/watermarks). Empty = auto from title. */
  watermarkId?: string;
  /** Hex color for the watermark element. */
  watermarkColor?: string;
  /** Tactical setup (FC IQ style). */
  tactics?: WLTactics;
  /** Coach's tactical notes captured on the post-WL final report. */
  coachNotes?: string;
}

export type BuildUpStyle = "Balance" | "Counter Attack" | "Short Pass";

export interface PlayerTactics {
  role: string;
  focus: string;
}

export interface WLTactics {
  buildUpStyle: BuildUpStyle;
  /** Defensive approach 1–100. */
  defensiveApproach: number;
  /** Map playerId → role/focus. */
  playerRoles: Record<string, PlayerTactics>;
}


/** Convenience: render the user-facing label for a WL. */
export function wlLabel(wl: Pick<WeekendLeague, "number" | "customName">): string {
  return wl.customName?.trim() || `WL #${wl.number}`;
}

/** Overall efetivo da carta, já considerando evolução aplicada. */
export function getEffectiveOverall(player: Pick<Player, "overall" | "evolution">): number {
  return player.evolution?.newOverall ?? player.overall;
}
 
/** Raridade efetiva da carta, já considerando evolução aplicada. */
export function getEffectiveRarity(player: Pick<Player, "rarity" | "evolution">): Rarity {
  return player.evolution?.newRarity ?? player.rarity;
}
 
/** Atributos efetivos (base + deltas da evolução), prontos pra renderizar no card. */
export function getEffectiveAttributes(
  player: Pick<Player, "attributes" | "evolution">
): PlayerAttributes | undefined {
  if (!player.attributes) return undefined;
  if (!player.evolution) return player.attributes;
  const deltas = player.evolution.attributeDeltas;
  const clamp99 = (n: number) => Math.max(0, Math.min(99, n));
  return {
    pace: clamp99(player.attributes.pace + (deltas.pace ?? 0)),
    shooting: clamp99(player.attributes.shooting + (deltas.shooting ?? 0)),
    passing: clamp99(player.attributes.passing + (deltas.passing ?? 0)),
    dribbling: clamp99(player.attributes.dribbling + (deltas.dribbling ?? 0)),
    defending: clamp99(player.attributes.defending + (deltas.defending ?? 0)),
    physical: clamp99(player.attributes.physical + (deltas.physical ?? 0)),
  };
}
