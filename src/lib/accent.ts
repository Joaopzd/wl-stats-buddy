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

export const ACCENTS: Record<AccentKey, AccentDef> = {
  green: {
    key: "green",
    label: "Neon Green",
    primary: "oklch(0.86 0.24 155)",
    secondary: "oklch(0.72 0.18 200)",
    primaryForeground: "oklch(0.12 0.04 250)",
    swatch: "#39ff8a",
  },
  blue: {
    key: "blue",
    label: "Neon Blue",
    primary: "oklch(0.74 0.20 240)",
    secondary: "oklch(0.66 0.20 265)",
    primaryForeground: "oklch(0.12 0.04 250)",
    swatch: "#3aa6ff",
  },
  red: {
    key: "red",
    label: "Neon Red",
    primary: "oklch(0.68 0.24 22)",
    secondary: "oklch(0.62 0.22 8)",
    primaryForeground: "oklch(0.98 0.01 0)",
    swatch: "#ff4d4d",
  },
  white: {
    key: "white",
    label: "Neon White",
    primary: "oklch(0.97 0.01 230)",
    secondary: "oklch(0.85 0.02 230)",
    primaryForeground: "oklch(0.12 0.04 250)",
    swatch: "#f5f7ff",
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
