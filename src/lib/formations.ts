import type { Position } from "./types";

export type FormationName =
  | "4-4-2"
  | "4-3-3"
  | "4-2-3-1"
  | "4-3-2-1"
  | "4-1-2-1-2"
  | "3-5-2"
  | "3-4-3"
  | "5-3-2"
  | "5-2-1-2";

export interface FormationSlot {
  /** Stable id within the formation (e.g. "ST1", "CB2"). */
  id: string;
  position: Position;
  /** % from left (0–100) on a vertical pitch. */
  x: number;
  /** % from top (0–100). 0 = opponent goal, 100 = own goal. */
  y: number;
}

export interface Formation {
  name: FormationName;
  slots: FormationSlot[]; // always 11
}

const gk = (): FormationSlot => ({ id: "GK", position: "GK", x: 50, y: 92 });

// Helper: evenly spaced row
const row = (positions: Position[], y: number, prefix: string): FormationSlot[] => {
  const n = positions.length;
  return positions.map((pos, i) => ({
    id: `${prefix}${i + 1}`,
    position: pos,
    x: ((i + 1) * 100) / (n + 1),
    y,
  }));
};

export const FORMATIONS: Record<FormationName, Formation> = {
  "4-4-2": {
    name: "4-4-2",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "RB"], 72, "D"),
      ...row(["LM", "CM", "CM", "RM"], 48, "M"),
      ...row(["ST", "ST"], 18, "F"),
    ],
  },
  "4-3-3": {
    name: "4-3-3",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "RB"], 72, "D"),
      ...row(["CM", "CM", "CM"], 48, "M"),
      ...row(["LW", "ST", "RW"], 18, "F"),
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "RB"], 74, "D"),
      ...row(["CDM", "CDM"], 56, "DM"),
      ...row(["LM", "CAM", "RM"], 36, "M"),
      ...row(["ST"], 14, "F"),
    ],
  },
  "4-3-2-1": {
    name: "4-3-2-1",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "RB"], 74, "D"),
      ...row(["CM", "CM", "CM"], 54, "M"),
      ...row(["CAM", "CAM"], 32, "AM"),
      ...row(["ST"], 12, "F"),
    ],
  },
  "4-1-2-1-2": {
    name: "4-1-2-1-2",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "RB"], 74, "D"),
      ...row(["CDM"], 58, "DM"),
      ...row(["CM", "CM"], 44, "M"),
      ...row(["CAM"], 30, "AM"),
      ...row(["ST", "ST"], 14, "F"),
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    slots: [
      gk(),
      ...row(["CB", "CB", "CB"], 74, "D"),
      ...row(["LM", "CM", "CM", "CM", "RM"], 48, "M"),
      ...row(["ST", "ST"], 16, "F"),
    ],
  },
  "3-4-3": {
    name: "3-4-3",
    slots: [
      gk(),
      ...row(["CB", "CB", "CB"], 74, "D"),
      ...row(["LM", "CM", "CM", "RM"], 48, "M"),
      ...row(["LW", "ST", "RW"], 16, "F"),
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "CB", "RB"], 74, "D"),
      ...row(["CM", "CM", "CM"], 48, "M"),
      ...row(["ST", "ST"], 18, "F"),
    ],
  },
  "5-2-1-2": {
    name: "5-2-1-2",
    slots: [
      gk(),
      ...row(["LB", "CB", "CB", "CB", "RB"], 74, "D"),
      ...row(["CM", "CM"], 54, "M"),
      ...row(["CAM"], 36, "AM"),
      ...row(["ST", "ST"], 14, "F"),
    ],
  },
};

export const FORMATION_NAMES = Object.keys(FORMATIONS) as FormationName[];

/** Compatibility for assigning a player to a slot (fuzzy: same line is fine). */
export function positionFits(playerPos: Position, slotPos: Position): boolean {
  if (playerPos === slotPos) return true;
  const groups: Position[][] = [
    ["GK"],
    ["LB", "RB", "CB"],
    ["CDM", "CM", "CAM", "LM", "RM"],
    ["LW", "RW", "ST"],
  ];
  return groups.some((g) => g.includes(playerPos) && g.includes(slotPos));
}
