import { useSyncExternalStore } from "react";

export type ThemeKey = "midnight-stealth" | "gt-racing" | "off-white-copper" | "cyber-neon" | "sahara-dusk";

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  description: string;
  /** Preview swatches (3 colors) for the picker. */
  swatches: [string, string, string];
  /** CSS variable overrides applied to <html>. */
  vars: Record<string, string>;
  /** Body background-image override. */
  bodyBg: string;
  /** Whether this theme is light (controls scrollbar/contrast helpers). */
  light?: boolean;
}

export const THEMES: Record<ThemeKey, ThemeDef> = {
  "midnight-stealth": {
    key: "midnight-stealth",
    label: "Midnight Stealth",
    description: "Deep navy · muted emerald",
    swatches: ["#0F172A", "#10B981", "#E2E8F0"],
    bodyBg:
      "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.69 0.14 162 / 0.04), transparent), radial-gradient(ellipse 60% 40% at 80% 100%, oklch(0.62 0.14 220 / 0.03), transparent)",
    vars: {
      "--background": "oklch(0.20 0.04 257)",
      "--foreground": "oklch(0.92 0.013 247)",
      "--card": "oklch(0.23 0.035 257)",
      "--card-foreground": "oklch(0.92 0.013 247)",
      "--popover": "oklch(0.22 0.035 257)",
      "--popover-foreground": "oklch(0.92 0.013 247)",
      "--primary": "oklch(0.69 0.14 162)",
      "--primary-foreground": "oklch(0.16 0.03 257)",
      "--secondary": "oklch(0.27 0.035 257)",
      "--secondary-foreground": "oklch(0.92 0.013 247)",
      "--muted": "oklch(0.27 0.03 257)",
      "--muted-foreground": "oklch(0.66 0.025 247)",
      "--accent": "oklch(0.62 0.14 220)",
      "--accent-foreground": "oklch(0.16 0.03 257)",
      "--destructive": "oklch(0.52 0.18 27)",
      "--destructive-foreground": "oklch(0.98 0.005 247)",
      "--success": "oklch(0.69 0.14 162)",
      "--success-foreground": "oklch(0.16 0.03 257)",
      "--border": "oklch(0.32 0.03 257 / 0.55)",
      "--input": "oklch(0.26 0.03 257)",
      "--ring": "oklch(0.69 0.14 162)",
      "--gradient-primary":
        "linear-gradient(135deg, oklch(0.69 0.14 162), oklch(0.58 0.10 195))",
      "--gradient-card":
        "linear-gradient(160deg, oklch(0.24 0.035 257), oklch(0.20 0.03 252))",
      "--gradient-hero":
        "radial-gradient(ellipse at top, oklch(0.69 0.14 162 / 0.10), transparent 60%), linear-gradient(180deg, oklch(0.22 0.04 257), oklch(0.18 0.035 257))",
    },
  },
  "gt-racing": {
    key: "gt-racing",
    label: "GT Racing",
    description: "Carbon black · racing red",
    swatches: ["#0B0B0D", "#E11D2A", "#F5F5F4"],
    bodyBg:
      "radial-gradient(ellipse 60% 40% at 50% -10%, oklch(0.55 0.22 25 / 0.10), transparent), radial-gradient(ellipse 50% 35% at 90% 100%, oklch(0.70 0.18 60 / 0.05), transparent)",
    vars: {
      "--background": "oklch(0.16 0.012 30)",
      "--foreground": "oklch(0.95 0.008 80)",
      "--card": "oklch(0.20 0.013 30)",
      "--card-foreground": "oklch(0.95 0.008 80)",
      "--popover": "oklch(0.18 0.012 30)",
      "--popover-foreground": "oklch(0.95 0.008 80)",
      "--primary": "oklch(0.58 0.22 25)",
      "--primary-foreground": "oklch(0.98 0.005 80)",
      "--secondary": "oklch(0.24 0.013 30)",
      "--secondary-foreground": "oklch(0.95 0.008 80)",
      "--muted": "oklch(0.24 0.012 30)",
      "--muted-foreground": "oklch(0.68 0.012 60)",
      "--accent": "oklch(0.74 0.16 60)",
      "--accent-foreground": "oklch(0.16 0.012 30)",
      "--destructive": "oklch(0.55 0.22 18)",
      "--destructive-foreground": "oklch(0.98 0.005 80)",
      "--success": "oklch(0.65 0.15 145)",
      "--success-foreground": "oklch(0.16 0.012 30)",
      "--border": "oklch(0.32 0.012 30 / 0.6)",
      "--input": "oklch(0.22 0.012 30)",
      "--ring": "oklch(0.58 0.22 25)",
      "--gradient-primary":
        "linear-gradient(135deg, oklch(0.58 0.22 25), oklch(0.70 0.18 45))",
      "--gradient-card":
        "linear-gradient(160deg, oklch(0.21 0.014 30), oklch(0.16 0.012 30))",
      "--gradient-hero":
        "radial-gradient(ellipse at top, oklch(0.58 0.22 25 / 0.14), transparent 60%), linear-gradient(180deg, oklch(0.18 0.012 30), oklch(0.14 0.010 30))",
    },
  },
  "off-white-copper": {
    key: "off-white-copper",
    label: "Off-White & Navy",
    description: "Cream paper · midnight navy",
    swatches: ["#F5F0E8", "#0F172A", "#1E3A8A"],
    light: true,
    bodyBg:
      "radial-gradient(ellipse 70% 45% at 50% -10%, oklch(0.30 0.08 257 / 0.10), transparent), radial-gradient(ellipse 50% 35% at 85% 100%, oklch(0.40 0.10 245 / 0.06), transparent)",
    vars: {
      // Cream paper bg, near-white cards, midnight navy ink for ink-on-paper feel.
      "--background": "oklch(0.92 0.016 80)",
      "--foreground": "oklch(0.20 0.035 257)",
      "--card": "oklch(0.995 0.004 80)",
      "--card-foreground": "oklch(0.20 0.035 257)",
      "--popover": "oklch(0.995 0.004 80)",
      "--popover-foreground": "oklch(0.20 0.035 257)",
      "--primary": "oklch(0.26 0.06 257)",
      "--primary-foreground": "oklch(0.98 0.005 80)",
      "--secondary": "oklch(0.85 0.020 250)",
      "--secondary-foreground": "oklch(0.20 0.035 257)",
      "--muted": "oklch(0.87 0.016 250)",
      "--muted-foreground": "oklch(0.38 0.035 257)",
      "--accent": "oklch(0.42 0.12 245)",
      "--accent-foreground": "oklch(0.98 0.005 80)",
      "--destructive": "oklch(0.50 0.20 27)",
      "--destructive-foreground": "oklch(0.98 0.005 80)",
      "--success": "oklch(0.52 0.16 150)",
      "--success-foreground": "oklch(0.98 0.005 80)",
      "--border": "oklch(0.55 0.035 257 / 0.55)",
      "--input": "oklch(0.93 0.014 80)",
      "--ring": "oklch(0.42 0.12 245)",
      "--gradient-primary":
        "linear-gradient(135deg, oklch(0.22 0.05 257), oklch(0.42 0.12 245))",
      "--gradient-card":
        "linear-gradient(160deg, oklch(1.00 0.002 80), oklch(0.97 0.010 80))",
      "--gradient-hero":
        "radial-gradient(ellipse at top, oklch(0.26 0.06 257 / 0.14), transparent 60%), linear-gradient(180deg, oklch(0.94 0.014 80), oklch(0.89 0.018 78))",
      "--pitch-line": "oklch(0.22 0.035 257 / 0.30)",
      // Navy-tinted shadow lifts cards off the paper bg.
      "--shadow-card": "0 6px 24px -10px oklch(0.20 0.035 257 / 0.25), 0 2px 6px -2px oklch(0.20 0.035 257 / 0.12)",
    },
  },
  "cyber-neon": {
    key: "cyber-neon",
    label: "Cyber Neon",
    description: "Deep violet · neon cyan",
    swatches: ["#0B0420", "#22D3EE", "#F472B6"],
    bodyBg:
      "radial-gradient(ellipse 70% 50% at 50% -10%, oklch(0.78 0.16 200 / 0.10), transparent), radial-gradient(ellipse 60% 40% at 85% 100%, oklch(0.70 0.22 340 / 0.08), transparent)",
    vars: {
      "--background": "oklch(0.16 0.05 295)",
      "--foreground": "oklch(0.94 0.015 260)",
      "--card": "oklch(0.20 0.06 295)",
      "--card-foreground": "oklch(0.94 0.015 260)",
      "--popover": "oklch(0.19 0.06 295)",
      "--popover-foreground": "oklch(0.94 0.015 260)",
      "--primary": "oklch(0.78 0.16 200)",
      "--primary-foreground": "oklch(0.16 0.05 295)",
      "--secondary": "oklch(0.24 0.06 295)",
      "--secondary-foreground": "oklch(0.94 0.015 260)",
      "--muted": "oklch(0.24 0.05 295)",
      "--muted-foreground": "oklch(0.70 0.04 280)",
      "--accent": "oklch(0.70 0.22 340)",
      "--accent-foreground": "oklch(0.16 0.05 295)",
      "--destructive": "oklch(0.62 0.22 18)",
      "--destructive-foreground": "oklch(0.98 0.005 260)",
      "--success": "oklch(0.78 0.16 162)",
      "--success-foreground": "oklch(0.16 0.05 295)",
      "--border": "oklch(0.34 0.06 295 / 0.6)",
      "--input": "oklch(0.22 0.05 295)",
      "--ring": "oklch(0.78 0.16 200)",
      "--gradient-primary":
        "linear-gradient(135deg, oklch(0.78 0.16 200), oklch(0.70 0.22 340))",
      "--gradient-card":
        "linear-gradient(160deg, oklch(0.22 0.06 295), oklch(0.17 0.05 295))",
      "--gradient-hero":
        "radial-gradient(ellipse at top, oklch(0.78 0.16 200 / 0.16), transparent 60%), linear-gradient(180deg, oklch(0.20 0.06 295), oklch(0.14 0.05 295))",
    },
  },
  "sahara-dusk": {
    key: "sahara-dusk",
    label: "Sahara Dusk",
    description: "Warm sand · burnt sienna",
    swatches: ["#2A1F18", "#E08B4A", "#F5E4CC"],
    bodyBg:
      "radial-gradient(ellipse 70% 45% at 50% -10%, oklch(0.70 0.14 55 / 0.10), transparent), radial-gradient(ellipse 55% 35% at 85% 100%, oklch(0.55 0.16 35 / 0.07), transparent)",
    vars: {
      "--background": "oklch(0.20 0.025 55)",
      "--foreground": "oklch(0.94 0.018 80)",
      "--card": "oklch(0.24 0.028 55)",
      "--card-foreground": "oklch(0.94 0.018 80)",
      "--popover": "oklch(0.22 0.028 55)",
      "--popover-foreground": "oklch(0.94 0.018 80)",
      "--primary": "oklch(0.70 0.14 55)",
      "--primary-foreground": "oklch(0.18 0.025 55)",
      "--secondary": "oklch(0.28 0.028 55)",
      "--secondary-foreground": "oklch(0.94 0.018 80)",
      "--muted": "oklch(0.28 0.025 55)",
      "--muted-foreground": "oklch(0.70 0.025 70)",
      "--accent": "oklch(0.60 0.16 35)",
      "--accent-foreground": "oklch(0.98 0.005 80)",
      "--destructive": "oklch(0.55 0.20 25)",
      "--destructive-foreground": "oklch(0.98 0.005 80)",
      "--success": "oklch(0.65 0.14 145)",
      "--success-foreground": "oklch(0.18 0.025 55)",
      "--border": "oklch(0.36 0.028 55 / 0.6)",
      "--input": "oklch(0.26 0.028 55)",
      "--ring": "oklch(0.70 0.14 55)",
      "--gradient-primary":
        "linear-gradient(135deg, oklch(0.70 0.14 55), oklch(0.60 0.16 35))",
      "--gradient-card":
        "linear-gradient(160deg, oklch(0.25 0.028 55), oklch(0.20 0.025 55))",
      "--gradient-hero":
        "radial-gradient(ellipse at top, oklch(0.70 0.14 55 / 0.14), transparent 60%), linear-gradient(180deg, oklch(0.22 0.028 55), oklch(0.17 0.025 55))",
    },
  },
};

const KEY = "fc26_theme_v1";
const isBrowser = typeof window !== "undefined";

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let current: ThemeKey = "midnight-stealth";
if (isBrowser) {
  try {
    const v = localStorage.getItem(KEY) as ThemeKey | null;
    if (v && v in THEMES) current = v;
  } catch {
    /* ignore */
  }
}

function apply(key: ThemeKey) {
  if (!isBrowser) return;
  const t = THEMES[key];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) {
    root.style.setProperty(k, v);
  }
  root.dataset.theme = key;
  if (t.light) root.classList.add("theme-light");
  else root.classList.remove("theme-light");
  document.body.style.backgroundImage = t.bodyBg;
}

if (isBrowser) apply(current);

export function getTheme(): ThemeKey {
  return current;
}

export function setTheme(key: ThemeKey) {
  current = key;
  if (isBrowser) {
    try {
      localStorage.setItem(KEY, key);
    } catch {
      /* ignore */
    }
    apply(key);
    listeners.forEach((l) => l());
  }
}

export function useTheme(): ThemeKey {
  return useSyncExternalStore(subscribe, getTheme, () => "midnight-stealth");
}
