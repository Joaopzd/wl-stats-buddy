import type { Rarity } from "./types";

// Color profile per rarity. Each card uses gradient + text + optional border/glow.
// Designed to feel FUT-authentic while staying within the Stadium Dark theme.
export const rarityClass = (r: Rarity): string => {
  switch (r) {
    // ===== Standard =====
    case "Gold":
      return "bg-gradient-to-br from-amber-300 to-yellow-600 text-zinc-900";
    case "Silver":
      return "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-900";
    case "Bronze":
      return "bg-gradient-to-br from-amber-700 to-yellow-900 text-amber-50";

    // ===== Promos / Specials =====
    case "TOTW":
      return "bg-gradient-to-br from-zinc-900 to-zinc-700 text-amber-300 border border-amber-300/70";
    case "Cornerstone":
      return "bg-gradient-to-br from-stone-700 to-stone-900 text-orange-300 border border-orange-400/50";
    case "Winter Wildcards":
      return "bg-gradient-to-br from-sky-200 to-blue-500 text-blue-950 border border-cyan-100";
    case "TOTY":
      return "bg-gradient-to-br from-blue-900 via-blue-700 to-amber-300 text-amber-200 border border-amber-300";
    case "TOTS":
      return "bg-gradient-to-br from-blue-950 to-cyan-400 text-amber-300 border border-amber-300/70";
    case "Ratings Reload":
      return "bg-gradient-to-br from-fuchsia-500 to-violet-700 text-white border border-fuchsia-300/60";
    case "Ultimate Scream":
      return "bg-gradient-to-br from-purple-900 to-orange-500 text-amber-100 border border-orange-400/60";
    case "FoF Captains":
      return "bg-gradient-to-br from-red-600 to-rose-900 text-amber-200 border border-amber-300/50";
    case "FC Pro Live":
      return "bg-gradient-to-br from-zinc-100 to-zinc-300 text-zinc-900 border border-cyan-400/70";
    case "Thunderstruck":
      return "bg-gradient-to-br from-indigo-950 to-yellow-400 text-yellow-100 border border-yellow-300/70";
    case "Joga Bonito":
      return "bg-gradient-to-br from-yellow-300 via-green-500 to-blue-600 text-white";
    case "Unbreakables":
      return "bg-gradient-to-br from-slate-800 to-slate-500 text-cyan-200 border border-cyan-300/60";
    case "Time Warp":
      return "bg-gradient-to-br from-violet-700 via-fuchsia-500 to-cyan-300 text-white";
    case "Future Stars":
      return "bg-gradient-to-br from-sky-300 to-indigo-700 text-white border border-sky-200/70";
    case "Knockout Royalty":
      return "bg-gradient-to-br from-purple-800 to-amber-400 text-amber-100 border border-amber-300/70";
    case "UEFA Primetime":
      return "bg-gradient-to-br from-blue-950 to-blue-600 text-amber-300 border border-amber-300/60";
    case "UEFA RTTF":
      return "bg-gradient-to-br from-blue-900 to-emerald-400 text-white border border-emerald-200/60";
    case "FUT Birthday":
      return "bg-gradient-to-br from-pink-400 via-fuchsia-500 to-purple-600 text-white border border-pink-200/60";
    case "Fantasy FC":
      return "bg-gradient-to-br from-emerald-400 to-teal-700 text-white border border-emerald-200/60";
    case "FoF Answer the Call":
      return "bg-gradient-to-br from-rose-700 to-amber-400 text-amber-50 border border-amber-300/60";
    case "Path to Glory":
      return "bg-gradient-to-br from-cyan-400 to-blue-700 text-white border border-cyan-200/60";
    case "Trophy Titans":
      return "bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 text-amber-50 border border-amber-200/60";

    // ===== Legends =====
    case "Icon Base":
      return "bg-gradient-to-br from-amber-100 via-amber-300 to-amber-500 text-zinc-900 border border-amber-200";
    case "Hero Base":
      return "bg-gradient-to-br from-fuchsia-500 to-amber-300 text-zinc-900 border border-fuchsia-200/70";

    default:
      return "bg-muted text-foreground";
  }
};

// Small dot/badge color used in selects & lists (no gradient, just a swatch).
export const raritySwatch = (r: Rarity): string => {
  switch (r) {
    case "Gold": return "bg-amber-400";
    case "Silver": return "bg-zinc-300";
    case "Bronze": return "bg-amber-800";
    case "TOTW": return "bg-zinc-900 ring-1 ring-amber-300";
    case "Cornerstone": return "bg-orange-400";
    case "Winter Wildcards": return "bg-sky-300";
    case "TOTY": return "bg-blue-700 ring-1 ring-amber-300";
    case "TOTS": return "bg-cyan-400 ring-1 ring-amber-300";
    case "Ratings Reload": return "bg-fuchsia-500";
    case "Ultimate Scream": return "bg-orange-500";
    case "FoF Captains": return "bg-red-600";
    case "FC Pro Live": return "bg-zinc-100 ring-1 ring-cyan-400";
    case "Thunderstruck": return "bg-yellow-400";
    case "Joga Bonito": return "bg-green-500";
    case "Unbreakables": return "bg-slate-500";
    case "Time Warp": return "bg-violet-500";
    case "Future Stars": return "bg-sky-400";
    case "Knockout Royalty": return "bg-purple-700";
    case "UEFA Primetime": return "bg-blue-700";
    case "UEFA RTTF": return "bg-emerald-400";
    case "FUT Birthday": return "bg-pink-400";
    case "Fantasy FC": return "bg-emerald-500";
    case "FoF Answer the Call": return "bg-rose-600";
    case "Path to Glory": return "bg-cyan-500";
    case "Trophy Titans": return "bg-orange-600";
    case "Icon Base": return "bg-amber-200 ring-1 ring-amber-400";
    case "Hero Base": return "bg-fuchsia-400 ring-1 ring-amber-300";
    default: return "bg-muted";
  }
};

export const fmt = (n: number, digits = 0) => n.toFixed(digits);
