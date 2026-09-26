import type { CSSProperties, ComponentType } from "react";
import {
  Circle, Crown, Trophy, Shield, Heart, Medal, Gem, Eye, Star,
  type LucideProps,
} from "lucide-react";
import type { Rarity } from "./types";

/** Distinct Lucide icon per rarity for badges in cards, pickers and lists. */
export const rarityIcon = (r: Rarity): ComponentType<LucideProps> => {
  switch (r) {
    case "Bronze": return Medal;
    case "Silver": return Medal;
    case "Gold": return Medal;
    case "TOTW": return Star;
    case "Base Icon": return Gem;
    case "Base Hero": return Heart;
    case "Base Hall of Fut": return Trophy;
    case "Squad Foundations": return Shield;
    case "OTW": return Eye;
    case "Destined for Glory": return Crown;
    default: return Circle;
  }
};

/** Visual style for a player card. Combines tailwind classes with optional inline style for bespoke palettes. */
export interface RarityVisual {
  className: string;
  style?: CSSProperties;
}

/**
 * Paleta autoral inspirada nas 9 raridades do Ultimate Team.
 * Cada uma usa gradiente + borda + brilho (box-shadow) próprios via `style`,
 * já que Tailwind puro não cobre gradientes multi-camada / glow custom.
 */
export const rarityVisual = (r: Rarity): RarityVisual => {
  switch (r) {
    case "Bronze":
      return {
        className: "border-2",
        style: {
          background:
            "repeating-linear-gradient(120deg, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 2px, transparent 2px, transparent 14px), linear-gradient(135deg, #c9884f 0%, #a3652c 45%, #6b3d17 100%)",
          border: "2px solid #4a2a10",
          color: "#2b1608",
        },
      };
    case "Silver":
      return {
        className: "border-2",
        style: {
          background:
            "repeating-linear-gradient(120deg, rgba(255,255,255,0.18) 0px, rgba(255,255,255,0.18) 2px, transparent 2px, transparent 14px), linear-gradient(135deg, #e4e7ec 0%, #b3b9c4 45%, #7c8492 100%)",
          border: "2px solid #5b6270",
          color: "#1a1a1a",
        },
      };
    case "Gold":
      return {
        className: "border-2",
        style: {
          background:
            "repeating-linear-gradient(120deg, rgba(255,255,255,0.20) 0px, rgba(255,255,255,0.20) 2px, transparent 2px, transparent 14px), linear-gradient(135deg, #ffe28a 0%, #e8b13d 45%, #a9711b 100%)",
          border: "2px solid #7a4e0f",
          color: "#2b1a05",
        },
      };

    // Preto com dourado — igual à referência TOTW.
    case "TOTW":
      return {
        className: "border-2",
        style: {
          background:
            "repeating-linear-gradient(120deg, rgba(212,175,90,0.10) 0px, rgba(212,175,90,0.10) 2px, transparent 2px, transparent 14px), linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 60%, #000000 100%)",
          border: "2px solid #d4af5a",
          boxShadow: "0 0 16px -3px rgba(212,175,90,0.55)",
          color: "#e8caa0",
        },
      };

    // Marfim/dourado com brilho roxo — igual à referência do Icon.
    case "Base Icon":
      return {
        className: "border-2",
        style: {
          background: "linear-gradient(160deg, #fbf8ef 0%, #f1e6c8 45%, #d8c48f 100%)",
          border: "2px solid #c9a24b",
          boxShadow: "0 0 22px -4px rgba(168,120,255,0.55)",
          color: "#2c2410",
        },
      };

    // Roxo/azul holográfico com brilho — igual à referência do Hero.
    case "Base Hero":
      return {
        className: "border-2",
        style: {
          background: "linear-gradient(160deg, #241a4d 0%, #4527a0 45%, #1c1440 100%)",
          border: "2px solid #a78bfa",
          boxShadow: "0 0 22px -4px rgba(167,139,250,0.75)",
          color: "#f5f0ff",
        },
      };

    // Preto/vermelho estilo "vidro estilhaçado" — igual à referência Hall of Fut.
    case "Base Hall of Fut":
      return {
        className: "border-2",
        style: {
          background:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px), linear-gradient(160deg, #0b0b0d 0%, #1c1c20 55%, #3a0d0d 100%)",
          border: "2px solid #e11d2e",
          boxShadow: "0 0 16px -2px rgba(225,29,46,0.6)",
          color: "#ffffff",
        },
      };

    // Verde-petróleo neon — igual à referência Squad Foundations.
    case "Squad Foundations":
      return {
        className: "border-2",
        style: {
          background: "linear-gradient(160deg, #063a37 0%, #0c5c53 50%, #04211f 100%)",
          border: "2px solid #2dd4bf",
          boxShadow: "0 0 18px -3px rgba(45,212,191,0.6)",
          color: "#ecfdf9",
        },
      };

    // Holográfico arco-íris — igual à referência OTW.
    case "OTW":
      return {
        className: "border-2",
        style: {
          background:
            "linear-gradient(120deg, #6a5cff 0%, #38bdf8 25%, #34d399 50%, #fbbf24 75%, #f472b6 100%)",
          border: "2px solid #ffffff",
          boxShadow: "0 0 18px -2px rgba(255,255,255,0.5)",
          color: "#111827",
        },
      };

    // Verde-petróleo + dourado — igual à referência Destined for Glory.
    case "Destined for Glory":
      return {
        className: "border-2",
        style: {
          background:
            "linear-gradient(150deg, #063a2e 0%, #0b5c46 35%, #b6862c 70%, #f5cf6b 100%)",
          border: "2px solid #f0c46a",
          boxShadow: "0 0 20px -3px rgba(245,207,107,0.65)",
          color: "#fff8e6",
        },
      };

    default:
      return { className: "bg-muted text-foreground" };
  }
};

/** Backwards-compat helper: returns just the className portion. */
export const rarityClass = (r: Rarity): string => rarityVisual(r).className;

// Small swatch used in pickers & lists — a real color layout comes from
// raritySwatchStyle below (className is just a neutral layout fallback).
export const raritySwatch = (_r: Rarity): string => "bg-secondary";

/** Inline style swatch helper — reuses the same gradient/border/glow as the card. */
export const raritySwatchStyle = (r: Rarity): CSSProperties | undefined => {
  return rarityVisual(r).style;
};

export const fmt = (n: number, digits = 0) => n.toFixed(digits);
