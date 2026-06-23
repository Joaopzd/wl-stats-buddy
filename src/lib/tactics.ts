import { Scale, Zap, Repeat, Shield, ArrowUp, Flame, type LucideIcon } from "lucide-react";
import type { BuildUpStyle, Position, WLTactics } from "./types";

/** Group used for picking available roles/focuses. */
export type RoleGroup = "GK" | "CB" | "FB" | "CMID" | "CAM" | "WIDE" | "ST";

export function roleGroupFor(p: Position): RoleGroup {
  if (p === "GK") return "GK";
  if (p === "CB") return "CB";
  if (p === "LB" || p === "RB") return "FB";
  if (p === "CDM" || p === "CM") return "CMID";
  if (p === "CAM") return "CAM";
  if (p === "LM" || p === "RM" || p === "LW" || p === "RW") return "WIDE";
  return "ST";
}

interface RoleSpec {
  roles: string[];
  defaultRole: string;
  focuses: string[];
  defaultFocus: string;
  label: string;
}

export const ROLE_SPECS: Record<RoleGroup, RoleSpec> = {
  GK: {
    label: "Goalkeeper",
    roles: ["Goalkeeper", "Sweeper Keeper", "Ball-Playing Keeper"],
    defaultRole: "Goalkeeper",
    focuses: ["Balance", "Build Up"],
    defaultFocus: "Balance",
  },
  CB: {
    label: "Center Back",
    roles: ["Defender", "Stopper", "Ball-Playing Defender", "Wide Back"],
    defaultRole: "Defender",
    focuses: ["Defend", "Balance", "Build Up"],
    defaultFocus: "Defend",
  },
  FB: {
    label: "Fullback",
    roles: ["Fullback", "Wingback", "Falseback", "Attacking Wingback", "Inverted Wingback"],
    defaultRole: "Fullback",
    focuses: ["Balance", "Support", "Attack"],
    defaultFocus: "Balance",
  },
  CMID: {
    label: "Central Midfielder",
    roles: ["Box-to-Box", "Holding", "Deep-Lying Playmaker", "Playmaker", "Half-Winger"],
    defaultRole: "Box-to-Box",
    focuses: ["Balance", "Ball-Winning", "Defend", "Build-Up", "Attack", "Support", "Roaming"],
    defaultFocus: "Balance",
  },
  CAM: {
    label: "Attacking Midfielder",
    roles: ["Playmaker", "Shadow Striker", "Classic 10", "Half-Winger"],
    defaultRole: "Playmaker",
    focuses: ["Balance", "Roaming", "Build-Up", "Attack", "Versatile"],
    defaultFocus: "Balance",
  },
  WIDE: {
    label: "Wide Player",
    roles: ["Winger", "Inside Forward", "Wide Playmaker"],
    defaultRole: "Winger",
    focuses: ["Balance", "Attack", "Versatile", "Build-Up", "Roaming"],
    defaultFocus: "Balance",
  },
  ST: {
    label: "Striker",
    roles: ["Advanced Forward", "Poacher", "False 9", "Target Forward"],
    defaultRole: "Advanced Forward",
    focuses: ["Attack", "Build-Up", "Roaming", "Versatile", "Support", "Wide", "Balance"],
    defaultFocus: "Attack",
  },
};

export function defaultPlayerTactics(p: Position) {
  const spec = ROLE_SPECS[roleGroupFor(p)];
  return { role: spec.defaultRole, focus: spec.defaultFocus };
}

export const BUILD_UP_STYLES: { value: BuildUpStyle; icon: LucideIcon; description: string }[] = [
  { value: "Balance", icon: Scale, description: "Adaptive shape, mixed tempo" },
  { value: "Counter Attack", icon: Zap, description: "Sit deep, break fast" },
  { value: "Short Pass", icon: Send, description: "Possession, patient build-up" },
];

export interface DefApproachStep {
  label: string;
  icon: LucideIcon;
  color: string;
}

export function defensiveApproachLabel(value: number): DefApproachStep {
  if (value <= 30) return { label: "Deep-Lying", icon: Shield, color: "#1e40af" };
  if (value <= 70) return { label: "Balance", icon: Scale, color: "#30503A" };
  if (value <= 90) return { label: "High Press", icon: ArrowUp, color: "#b45309" };
  return { label: "Aggressive Press", icon: Flame, color: "#b91c1c" };
}

export const DEFAULT_TACTICS: WLTactics = {
  buildUpStyle: "Balance",
  defensiveApproach: 50,
  playerRoles: {},
};
