import type { CSSProperties, ComponentType } from "react";
import {
  Circle, Crown, Trophy, Star, Shield, Swords, Cake, Sparkles, TrendingUp,
  Flame, Snowflake, Music, Rocket, Heart, Award, Zap, Globe, Sun, Moon,
  Compass, Medal, Gem, Wind, Cloud, Drama, Castle, Target, Hexagon,
  type LucideProps,
} from "lucide-react";
import type { Rarity } from "./types";

/** Distinct Lucide icon per rarity for badges in cards, pickers and lists. */
export const rarityIcon = (r: Rarity): ComponentType<LucideProps> => {
  switch (r) {
    case "Gold": return Medal;
    case "Silver": return Medal;
    case "Bronze": return Medal;
    case "TOTW": return Star;
    case "TOTY": return Trophy;
    case "TOTS": return Crown;
    case "FUT Champions TOTS": return Crown;
    case "MH TOTS": return Crown;
    case "TOTS Highlights": return Crown;
    case "Future Stars": return Sparkles;
    case "FUT Birthday": return Cake;
    case "FUT Birthday Icon": return Cake;
    case "Path to Glory": return TrendingUp;
    case "Showdown": return Swords;
    case "Thunderstruck": return Zap;
    case "Winter Wildcards": return Snowflake;
    case "Ultimate Scream": return Drama;
    case "Heroes Ultimate Scream": return Drama;
    case "Prime Heroes": return Award;
    case "Joga Bonito": return Music;
    case "World Tour": return Globe;
    case "Journey of Nations": return Compass;
    case "National Pride": return Shield;
    case "Trophy Titans": return Trophy;
    case "Knockout Royalty": return Crown;
    case "Time Warp": return Moon;
    case "EOAE": return Sun;
    case "FoF Captains": return Castle;
    case "FoF Answer the Call": return Rocket;
    case "FC Pro Live": return Target;
    case "Fantasy FC": return Hexagon;
    case "Ratings Reload": return Wind;
    case "Cornerstone": return Castle;
    case "Unbreakables": return Shield;
    case "Evo": return Cloud;
    case "UEFA Primetime": return Star;
    case "UEFA RTTF": return Star;
    case "UEFA Champions League": return Trophy;
    case "UEFA Europa League": return Trophy;
    case "UEFA Conference League": return Trophy;
    case "Icon Base": return Gem;
    case "Hero Base": return Heart;
    case "Icon TOTY": return Gem;
    case "FOF: Greats of The Game Icon": return Gem;
    case "FOF: Greats of The Game Hero": return Shield;
    case "FOF: Glory Hunters": return Trophy;
    case "FOF: Star Perform": return Star;
    case "FOF: Phenoms": return Sparkles;
    case "FoF: Summer Star": return Sun;
    default: return Circle;
  }
};


/** Visual style for a player card. Combines tailwind classes with optional inline style for bespoke palettes. */
export interface RarityVisual {
  className: string;
  style?: CSSProperties;
}

/**
 * Bespoke palette per the user's brief.
 * Each "specials" rarity uses solid `Principal` background + `Borda` border, with
 * automatic text color (white for dark backgrounds, dark for light).
 */
export const rarityVisual = (r: Rarity): RarityVisual => {
  switch (r) {
    // ===== Standard (kept) =====
    case "Gold":
      return { className: "bg-gradient-to-br from-amber-300 to-yellow-600 text-zinc-900" };
    case "Silver":
      return { className: "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-900" };
    case "Bronze":
      return { className: "bg-gradient-to-br from-amber-700 to-yellow-900 text-amber-50" };

    // ===== Kept promos =====
    case "TOTW":
      return { className: "bg-gradient-to-br from-zinc-950 to-black text-yellow-300 border border-yellow-300/80" };
    case "Path to Glory":
      return solid("#57cb37", "#351858");

    // ===== Solid palettes from the brief =====
    case "Cornerstone":
      return solid("#723325", "#766B80");
    case "Winter Wildcards":
      return solid("#71BEB7", "#E5D265");
    case "TOTY":
      return solid("#163293", "#E7DB87");
    case "TOTS":
      return solid("#7B9FEB", "#DCC392");
    case "Ratings Reload":
      return solid("#B35F37", "#A28252");
    case "Ultimate Scream":
      return solid("#9B3C08", "#F5DBF0");
    case "FoF Captains":
      return solid("#CF3570", "#68BAB2");
    case "FC Pro Live":
      return solid("#9B9DAB", "#485776");
    case "Thunderstruck":
      return solid("#151626", "#FCEDC2");
    case "Unbreakables":
      return solid("#9B3C08", "#F5DBF0");
    case "Time Warp":
      return solid("#422E5E", "#ED84BB");
    case "Future Stars":
      return solid("#33257C", "#EBCF84");
    case "Knockout Royalty":
      return solid("#46020C", "#E8D297");
    case "FUT Birthday":
      return solid("#D85AFB", "#EA13F4");
    case "Fantasy FC":
      return solid("#EFCBDA", "#634FC7");
    case "FoF Answer the Call":
      return solid("#72A2DC", "#25E3D6");
    case "Trophy Titans":
      return solid("#26292B", "#C2CBCF");

    // ===== Special gradients =====
    case "Joga Bonito":
      return {
        className: "border-2",
        style: {
          background: "linear-gradient(135deg, #01E606 0%, #006465 100%)",
          borderColor: "#FFCE04",
          color: "#FFFFFF",
        },
      };
    case "UEFA Primetime":
    case "UEFA RTTF":
      return {
        className: "border-2",
        style: {
          background: "linear-gradient(135deg, #000FA3 0%, #C23503 50%, #1BC145 100%)",
          borderColor: "#000C02",
          color: "#FFFFFF",
        },
      };
    case "Evo":
      return {
        className: "border-2",
        style: {
          background: "#FDFCF3",
          borderColor: "#9C183D",
          boxShadow: "inset 0 0 0 1px #248D84",
          color: "#1a1a1a",
        },
      };
    case "FUT Champions TOTS":
      return {
        className: "border-2 shadow-[0_0_18px_-6px_#FFF475]",
        style: {
          background: "#CB332B",
          borderColor: "#FFF475",
          color: "#FFFFFF",
        },
      };
    case "Prime Heroes":
      return solid("#f34da8", "#42111c");
    case "World Tour":
      return solid("#b8d210", "#f27620");
    case "EOAE":
      return solid("#2d037e", "#ed25f5");
    case "FUT Birthday Icon":
      return solid("#f7f7f3", "#de15d8");
    case "Heroes Ultimate Scream":
      return solid("#3945de", "#e2f7fb");
    case "Journey of Nations":
      return solid("#7bf8ad", "#5a2fe9");
    case "National Pride":
      return solid("#9456dd", "#47da40");
    case "Icon TOTY":
      return solid("#f7f7f3", "#b98150");
    case "MH TOTS":
      return solid("#6d92ea", "#c9d6de");
    case "TOTS Highlights":
      return solid("#5e315d", "#f9d7c5");
    case "UEFA Europa League":
      return solid("#010100", "#fe5400");
    case "UEFA Champions League":
      return solid("#001ba0", "#0365e9");
    case "UEFA Conference League":
      return solid("#041d0a", "#1ac145");
    case "Showdown":
      return solid("#030700", "#c6d76f");
    case "FOF: Greats of The Game Icon":
      return solid("#e7f5f4", "#5bd1f8");
    case "FOF: Greats of The Game Hero":
      return solid("#6926e9", "#43c3fa");
    case "FOF: Glory Hunters":
      return solid("#4cd4a5", "#eebdf5");
    case "FOF: Star Perform":
      return solid("#13c49c", "#200b81");
    case "FOF: Phenoms":
      return solid("#3b3489", "#3b3489");

    // ===== Legends (kept) =====
    case "Icon Base":
      return { className: "bg-gradient-to-br from-white to-zinc-200 text-zinc-900 border border-amber-300/70" };
    case "Hero Base":
      return { className: "bg-gradient-to-br from-purple-600 to-purple-900 text-amber-200 border border-amber-300/70" };

    default:
      return { className: "bg-muted text-foreground" };
  }
};

/** Backwards-compat helper: returns just the className portion. */
export const rarityClass = (r: Rarity): string => rarityVisual(r).className;

/** Build a solid-background visual with auto text contrast. */
function solid(bg: string, border: string): RarityVisual {
  return {
    className: "border-2",
    style: {
      background: bg,
      borderColor: border,
      color: pickTextColor(bg),
    },
  };
}

/** Pick black or white text based on hex luminance. */
function pickTextColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1a1a1a" : "#FFFFFF";
}

// Small swatch used in pickers & lists.
export const raritySwatch = (r: Rarity): string => {
  const hexMap: Partial<Record<Rarity, string>> = {
    Cornerstone: "#723325",
    "Winter Wildcards": "#71BEB7",
    TOTY: "#163293",
    TOTS: "#7B9FEB",
    "Ratings Reload": "#B35F37",
    "Ultimate Scream": "#9B3C08",
    "FoF Captains": "#CF3570",
    "FC Pro Live": "#9B9DAB",
    Thunderstruck: "#151626",
    Unbreakables: "#9B3C08",
    "Time Warp": "#422E5E",
    "Future Stars": "#33257C",
    "Knockout Royalty": "#46020C",
    "FUT Birthday": "#D85AFB",
    "Fantasy FC": "#EFCBDA",
    "FoF Answer the Call": "#72A2DC",
    "Trophy Titans": "#26292B",
    "Joga Bonito": "#01E606",
    "UEFA Primetime": "#000FA3",
    "UEFA RTTF": "#1BC145",
    Evo: "#FDFCF3",
    "FUT Champions TOTS": "#CB332B",
    "Prime Heroes": "#f34da8",
    "World Tour": "#b8d210",
    EOAE: "#2d037e",
    "FUT Birthday Icon": "#f7f7f3",
    "Heroes Ultimate Scream": "#3945de",
    "Journey of Nations": "#7bf8ad",
    "National Pride": "#9456dd",
    "Icon TOTY": "#f7f7f3",
    "MH TOTS": "#6d92ea",
    "TOTS Highlights": "#5e315d",
    "Path to Glory": "#57cb37",
    "UEFA Europa League": "#010100",
    "UEFA Champions League": "#001ba0",
    "UEFA Conference League": "#041d0a",
    Showdown: "#030700",
    "FOF: Greats of The Game Icon": "#e7f5f4",
    "FOF: Greats of The Game Hero": "#6926e9",
    "FOF: Glory Hunters": "#4cd4a5",
    "FOF: Star Perform": "#13c49c",
    "FOF: Phenoms": "#3b3489",
  };
  if (hexMap[r]) {
    // Rendered via inline style elsewhere; return a neutral utility for layout fallback.
    return "bg-secondary";
  }
  switch (r) {
    case "Gold": return "bg-amber-400";
    case "Silver": return "bg-zinc-300";
    case "Bronze": return "bg-amber-800";
    case "TOTW": return "bg-black ring-1 ring-yellow-300";
    case "Path to Glory": return "bg-cyan-500";
    case "Icon Base": return "bg-white ring-1 ring-amber-400";
    case "Hero Base": return "bg-purple-700 ring-1 ring-amber-300";
    default: return "bg-muted";
  }
};

/** Inline style swatch helper for the bespoke palettes (used by pickers). */
export const raritySwatchStyle = (r: Rarity): CSSProperties | undefined => {
  const v = rarityVisual(r);
  if (!v.style) return undefined;
  return {
    background: v.style.background,
    borderColor: v.style.borderColor,
  };
};

export const fmt = (n: number, digits = 0) => n.toFixed(digits);
