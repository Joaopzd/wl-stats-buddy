import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "wl:chartHighContrast";
const EVENT = "wl:chartHighContrastChange";

export interface ChartTheme {
  high: boolean;
  /** Series colors, ordered by importance. */
  series: [string, string, string];
  axis: string;
  grid: string;
  reference: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  /** Base stroke width for the primary line. */
  stroke: number;
  strokeThin: number;
  dot: number;
}

const NORMAL: Omit<ChartTheme, "high"> = {
  series: ["var(--primary)", "#38BDF8", "var(--destructive)"],
  axis: "var(--muted-foreground)",
  grid: "color-mix(in srgb, var(--border) 50%, transparent)",
  reference: "color-mix(in srgb, var(--muted-foreground) 60%, transparent)",
  tooltipBg: "var(--card)",
  tooltipBorder: "color-mix(in srgb, var(--primary) 50%, transparent)",
  tooltipText: "var(--foreground)",
  stroke: 3,
  strokeThin: 2,
  dot: 3,
};

/** Theme-agnostic vivid palette with heavier strokes for maximum legibility. */
const HIGH: Omit<ChartTheme, "high"> = {
  series: ["#FF7A00", "#00A3FF", "#FF2D55"],
  axis: "var(--foreground)",
  grid: "color-mix(in srgb, var(--foreground) 28%, transparent)",
  reference: "color-mix(in srgb, var(--foreground) 65%, transparent)",
  tooltipBg: "var(--card)",
  tooltipBorder: "var(--foreground)",
  tooltipText: "var(--foreground)",
  stroke: 4,
  strokeThin: 3,
  dot: 4,
};

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useChartTheme(): ChartTheme & { toggle: () => void; setHigh: (v: boolean) => void } {
  const [high, setHighState] = useState(false);

  useEffect(() => {
    setHighState(read());
    const onChange = () => setHighState(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setHigh = useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      // ignore quota errors
    }
    setHighState(v);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const toggle = useCallback(() => setHigh(!read()), [setHigh]);

  return { high, ...(high ? HIGH : NORMAL), toggle, setHigh };
}
