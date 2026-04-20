import type { Rarity } from "./types";

export const rarityClass = (r: Rarity): string => {
  switch (r) {
    case "Icon": return "bg-gradient-to-br from-amber-100 to-amber-400 text-zinc-900";
    case "Hero": return "bg-gradient-to-br from-fuchsia-400 to-amber-300 text-zinc-900";
    case "TOTW": return "bg-gradient-to-br from-zinc-900 to-zinc-600 text-amber-300 border border-amber-300/50";
    case "Special": return "bg-gradient-to-br from-cyan-400 to-blue-600 text-white";
    case "Gold": return "bg-gradient-to-br from-amber-300 to-yellow-600 text-zinc-900";
    case "Rare": return "bg-gradient-to-br from-yellow-200 to-yellow-500 text-zinc-900";
    default: return "bg-muted text-foreground";
  }
};

export const fmt = (n: number, digits = 0) => n.toFixed(digits);
