import { useSyncExternalStore } from "react";

export type AccentKey = "green" | "blue" | "red" | "white";

export interface AccentDef {
  key: AccentKey;
  label: string;
  /** oklch(L C H) string for --primary / --ring / --success */
  primary: string;
  /** Secondary hue used in gradient-primary */
  secondary: string;
  /** Foreground color on top of primary */
  primaryForeground: string;
  /** Hex preview swatch for the picker */
  swatch: string;
}

// Midnight Stealth palette — muted, low-saturation accents for reduced eye strain.
export const ACCENTS: Record<AccentKey, AccentDef> = {
  green: {
    key: "green",
    label: "Muted Emerald",
    primary: "oklch(0.69 0.14 162)",
    secondary: "oklch(0.58 0.10 195)",
    primaryForeground: "oklch(0.16 0.03 257)",
    swatch: "#10B981",
  },
  blue: {
    key: "blue",
    label: "Slate Indigo",
    primary: "oklch(0.62 0.18 277)",
    secondary: "oklch(0.55 0.14 260)",
    primaryForeground: "oklch(0.98 0.005 247)",
    swatch: "#6366F1",
  },
  red: {
    key: "red",
    label: "Deep Crimson",
    primary: "oklch(0.52 0.18 27)",
    secondary: "oklch(0.45 0.14 18)",
    primaryForeground: "oklch(0.98 0.005 247)",
    swatch: "#B91C1C",
  },
  white: {
    key: "white",
    label: "Soft Ghost",
    primary: "oklch(0.94 0.008 247)",
    secondary: "oklch(0.80 0.015 247)",
    primaryForeground: "oklch(0.16 0.03 257)",
    swatch: "#F8FAFC",
  },
};

const KEY = "fc26_accent_v1";
const isBrowser = typeof window !== "undefined";

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

let current: AccentKey = "green";
if (isBrowser) {
  try {
    const v = localStorage.getItem(KEY) as AccentKey | null;
    if (v && v in ACCENTS) current = v;
  } catch { /* ignore */ }
}

function apply(key: AccentKey) {
  if (!isBrowser) return;
  const a = ACCENTS[key];
  const root = document.documentElement;
  root.style.setProperty("--primary", a.primary);
  root.style.setProperty("--ring", a.primary);
  root.style.setProperty("--success", a.primary);
  root.style.setProperty("--primary-foreground", a.primaryForeground);
  root.style.setProperty(
    "--gradient-primary",
    `linear-gradient(135deg, ${a.primary}, ${a.secondary})`,
  );
  root.dataset.accent = key;
}

if (isBrowser) apply(current);

export function getAccent(): AccentKey {
  return current;
}

export function setAccent(key: AccentKey) {
  current = key;
  if (isBrowser) {
    try { localStorage.setItem(KEY, key); } catch { /* ignore */ }
    apply(key);
  }
  listeners.forEach((l) => l());
}

export function useAccent(): AccentKey {
  return useSyncExternalStore(subscribe, getAccent, () => "green");
}
