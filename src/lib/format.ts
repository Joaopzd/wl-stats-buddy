import type { Rarity } from "./types";

// Card visuals — bespoke palette per the user's brief.
// Format: gradient base + accent text/border that reads as "details" (gold/silver/etc.).
export const rarityClass = (r: Rarity): string => {
  switch (r) {
    // ===== Standard =====
    case "Gold":
      return "bg-gradient-to-br from-amber-300 to-yellow-600 text-zinc-900";
    case "Silver":
      return "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-900";
    case "Bronze":
      return "bg-gradient-to-br from-amber-700 to-yellow-900 text-amber-50";

    // ===== Promos / Specials (per user spec) =====
    // TOTW: Black with yellow details
    case "TOTW":
      return "bg-gradient-to-br from-zinc-950 to-black text-yellow-300 border border-yellow-300/80";
    // Cornerstone: Light brown and silver
    case "Cornerstone":
      return "bg-gradient-to-br from-amber-200 to-amber-400 text-zinc-200 border border-zinc-200/90";
    // Winter Wildcards: Light green with gold details
    case "Winter Wildcards":
      return "bg-gradient-to-br from-emerald-300 to-lime-400 text-amber-700 border border-amber-400";
    // TOTY: Dark blue with gold details
    case "TOTY":
      return "bg-gradient-to-br from-blue-950 to-blue-800 text-amber-300 border border-amber-300";
    // TOTS: Dark blue with light blue details
    case "TOTS":
      return "bg-gradient-to-br from-blue-950 to-blue-900 text-sky-300 border border-sky-300/80";
    // Ratings Reload: Brown with silver details
    case "Ratings Reload":
      return "bg-gradient-to-br from-amber-900 to-stone-800 text-zinc-200 border border-zinc-300/80";
    // Ultimate Scream: Red with silver details
    case "Ultimate Scream":
      return "bg-gradient-to-br from-red-700 to-red-900 text-zinc-200 border border-zinc-200/80";
    // FoF Captains: keeping the previous red/gold direction
    case "FoF Captains":
      return "bg-gradient-to-br from-red-600 to-rose-900 text-amber-200 border border-amber-300/60";
    // FC Pro Live: Purple with silver details
    case "FC Pro Live":
      return "bg-gradient-to-br from-purple-700 to-purple-950 text-zinc-200 border border-zinc-200/80";
    // Thunderstruck: kept (indigo + electric yellow)
    case "Thunderstruck":
      return "bg-gradient-to-br from-indigo-950 to-yellow-400 text-yellow-100 border border-yellow-300/70";
    // Joga Bonito: Light green with yellow details
    case "Joga Bonito":
      return "bg-gradient-to-br from-emerald-300 to-green-400 text-yellow-300 border border-yellow-300/80";
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

    // Evo: White with light green details
    case "Evo":
      return "bg-gradient-to-br from-white to-zinc-100 text-emerald-500 border border-emerald-400/80";

    // ===== Legends =====
    // Icon Base: White
    case "Icon Base":
      return "bg-gradient-to-br from-white to-zinc-200 text-zinc-900 border border-amber-300/70";
    // Hero Base: Purple
    case "Hero Base":
      return "bg-gradient-to-br from-purple-600 to-purple-900 text-amber-200 border border-amber-300/70";

    default:
      return "bg-muted text-foreground";
  }
};

// Small swatch used in pickers & lists.
export const raritySwatch = (r: Rarity): string => {
  switch (r) {
    case "Gold": return "bg-amber-400";
    case "Silver": return "bg-zinc-300";
    case "Bronze": return "bg-amber-800";
    case "TOTW": return "bg-black ring-1 ring-yellow-300";
    case "Cornerstone": return "bg-amber-300 ring-1 ring-zinc-200";
    case "Winter Wildcards": return "bg-emerald-300 ring-1 ring-amber-400";
    case "TOTY": return "bg-blue-950 ring-1 ring-amber-300";
    case "TOTS": return "bg-blue-900 ring-1 ring-sky-300";
    case "Ratings Reload": return "bg-amber-900 ring-1 ring-zinc-300";
    case "Ultimate Scream": return "bg-red-700 ring-1 ring-zinc-200";
    case "FoF Captains": return "bg-red-600";
    case "FC Pro Live": return "bg-purple-700 ring-1 ring-zinc-200";
    case "Thunderstruck": return "bg-yellow-400";
    case "Joga Bonito": return "bg-emerald-300 ring-1 ring-yellow-300";
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
    case "Evo": return "bg-white ring-1 ring-emerald-400";
    case "Icon Base": return "bg-white ring-1 ring-amber-400";
    case "Hero Base": return "bg-purple-700 ring-1 ring-amber-300";
    default: return "bg-muted";
  }
};

export const fmt = (n: number, digits = 0) => n.toFixed(digits);
