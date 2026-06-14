import type { CSSProperties } from "react";
import type { Position } from "./types";

export type PositionGroup = "GK" | "DEF" | "MID" | "ATT";

export function positionGroup(p: Position): PositionGroup {
  if (p === "GK") return "GK";
  if (p === "CB" || p === "LB" || p === "RB") return "DEF";
  if (p === "CDM" || p === "CM" || p === "CAM" || p === "LM" || p === "RM") return "MID";
  return "ATT";
}

/** Common football kit palette: GK yellow, DEF blue, MID green, ATT red. */
export const POSITION_GROUP_STYLE: Record<
  PositionGroup,
  { bg: string; fg: string; border: string; label: string }
> = {
  GK: { bg: "#facc15", fg: "#1a1a1a", border: "#a16207", label: "Goalkeeper" },
  DEF: { bg: "#3b82f6", fg: "#ffffff", border: "#1d4ed8", label: "Defender" },
  MID: { bg: "#22c55e", fg: "#062e12", border: "#15803d", label: "Midfielder" },
  ATT: { bg: "#ef4444", fg: "#ffffff", border: "#b91c1c", label: "Attacker" },
};

export function positionBadgeStyle(p: Position): CSSProperties {
  const s = POSITION_GROUP_STYLE[positionGroup(p)];
  return { backgroundColor: s.bg, color: s.fg, borderColor: s.border };
}
