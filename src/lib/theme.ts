import { useSyncExternalStore } from "react";

export type ThemeKey = "midnight-stealth" | "gt-racing" | "off-white-copper";

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
    label: "Off-White & Copper",
    description: "Cream paper · copper accent",
    swatches: ["#F5F0E8", "#B5651D", "#1A1A1A"],
    light: true,
    bodyBg:
      "radial-gradient(ellipse 70% 45% at 50% -10%, oklch(0.70 0.10 50 / 0.10), transparent), radial-gradient(ellipse 50% 35% at 85% 100%, oklch(0.55 0.10 40 / 0.06), transparent)",
    vars: {
      "--background": "oklch(0.96 0.012 80)",
      "--foreground": "oklch(0.22 0.015 60)",
      "--card": "oklch(0.99 0.006 80)",
      "--card-foreground": "oklch(0.22 0.015 60)",
      "--popover": "oklch(0.99 0.006 80)",
      "--popover-foreground": "oklch(0.22 0.015 60)",
      "--primary": "oklch(0.55 0.13 50)",
      "--primary-foreground": "oklch(0.98 0.005 80)",
      "--secondary": "oklch(0.91 0.012 80)",
      "--secondary-foreground": "oklch(0.22 0.015 60)",
      "--muted": "oklch(0.92 0.010 80)",
      "--muted-foreground": "oklch(0.45 0.020 60)",
      "--accent": "oklch(0.65 0.11 45)",
      "--accent-foreground": "oklch(0.18 0.015 60)",
      "--destructive": "oklch(0.52 0.18 27)",
      "--destructive-foreground": "oklch(0.98 0.005 80)",
      "--success": "oklch(0.55 0.14 145)",
      "--success-foreground": "oklch(0.98 0.005 80)",
      "--border": "oklch(0.82 0.014 80 / 0.85)",
      "--input": "oklch(0.95 0.010 80)",
      "--ring": "oklch(0.55 0.13 50)",
      "--gradient-primary":
        "linear-gradient(135deg, oklch(0.55 0.13 50), oklch(0.65 0.11 45))",
      "--gradient-card":
        "linear-gradient(160deg, oklch(0.99 0.006 80), oklch(0.94 0.012 80))",
      "--gradient-hero":
        "radial-gradient(ellipse at top, oklch(0.55 0.13 50 / 0.10), transparent 60%), linear-gradient(180deg, oklch(0.97 0.010 80), oklch(0.93 0.012 80))",
      "--pitch-line": "oklch(0.22 0.015 60 / 0.30)",
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
