import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Filter } from "lucide-react";
import type { Match, Platform, WeekendLeague } from "@/lib/types";
import { wlRecord } from "@/lib/stats";
import { wlLabel } from "@/lib/types";

interface Props {
  wls: WeekendLeague[];
  matches: Match[];
}

interface TrendDatum {
  name: string;
  wins: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
}

type PlatformFilter = "ALL" | Platform;
type RangeFilter = "5" | "10" | "20" | "ALL";

const STORAGE_KEY = "wl:dashboardTrendFilters";

function loadFilters(): { platform: PlatformFilter; range: RangeFilter } {
  if (typeof window === "undefined") return { platform: "ALL", range: "ALL" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { platform: "ALL", range: "ALL" };
    const parsed = JSON.parse(raw);
    return {
      platform: (parsed?.platform as PlatformFilter) ?? "ALL",
      range: (parsed?.range as RangeFilter) ?? "ALL",
    };
  } catch {
    return { platform: "ALL", range: "ALL" };
  }
}

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendDatum }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const gdPositive = d.gd >= 0;
  return (
    <div
      className="rounded-md border border-border/70 bg-popover/95 backdrop-blur px-3 py-2 shadow-xl text-xs text-foreground transition-opacity"
      style={{ minWidth: 170 }}
    >
      <div className="font-display tracking-wider text-sm mb-1.5 text-foreground">{d.name}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
        <span className="text-muted-foreground">Wins</span>
        <span className="text-right text-primary font-semibold">{d.wins}</span>
        <span className="text-muted-foreground">Losses</span>
        <span className="text-right text-destructive font-semibold">{d.losses}</span>
        <span className="text-muted-foreground">Scored</span>
        <span className="text-right">{d.gf}</span>
        <span className="text-muted-foreground">Conceded</span>
        <span className="text-right">{d.ga}</span>
        <span className="text-muted-foreground">GD</span>
        <span className={`text-right font-semibold ${gdPositive ? "text-primary" : "text-destructive"}`}>
          {gdPositive ? "+" : ""}{d.gd}
        </span>
      </div>
    </div>
  );
}

const PLATFORMS: PlatformFilter[] = ["ALL", "PC", "PS5", "Xbox"];
const RANGES: { key: RangeFilter; label: string }[] = [
  { key: "5", label: "Last 5" },
  { key: "10", label: "Last 10" },
  { key: "20", label: "Last 20" },
  { key: "ALL", label: "All" },
];

export function WLTrendsChart({ wls, matches }: Props) {
  const initial = useMemo(() => loadFilters(), []);
  const chart = useChartTheme();
  const [platform, setPlatform] = useState<PlatformFilter>(initial.platform);
  const [range, setRange] = useState<RangeFilter>(initial.range);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ platform, range }));
    } catch {
      // ignore quota errors
    }
  }, [platform, range]);

  const filteredMatches = useMemo(
    () => (platform === "ALL" ? matches : matches.filter((m) => m.platform === platform)),
    [matches, platform],
  );

  const data = useMemo(() => {
    const sortedWls = [...wls].sort((a, b) => a.number - b.number);
    const scoped = range === "ALL" ? sortedWls : sortedWls.slice(-parseInt(range, 10));
    return scoped
      .map((wl) => {
        const r = wlRecord(wl, filteredMatches);
        return {
          name: wlLabel(wl).replace(/^WL #/, "#"),
          wins: r.wins,
          losses: r.losses,
          gf: r.goalsFor,
          ga: r.goalsAgainst,
          gd: r.goalsFor - r.goalsAgainst,
          played: r.played,
        };
      })
      .filter((d) => d.played > 0);
  }, [wls, filteredMatches, range]);

  if (wls.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
        <h2 className="font-display text-2xl tracking-wider flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> WL Trends
        </h2>
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {data.length} session{data.length === 1 ? "" : "s"} shown
        </span>
      </div>

      {/* Filters */}
      <div className="surface-card p-3 mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
          <Filter className="h-3 w-3" /> Filters
        </div>
        <div className="flex gap-1 bg-input border border-border rounded-md p-0.5">
          {PLATFORMS.map((p) => {
            const on = platform === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  on ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1 bg-input border border-border rounded-md p-0.5">
          {RANGES.map((r) => {
            const on = range === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  on ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          No WLs match the selected filters.
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="surface-card p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
              Wins vs Losses per WL
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" allowDecimals={false} />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--secondary)", opacity: 0.4 }} animationDuration={150} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="wins" name="Wins" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="losses" name="Losses" fill="var(--destructive)" radius={[3, 3, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="surface-card p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
              Goals & Goal Difference per WL
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
                  <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--accent)", strokeWidth: 1 }} animationDuration={150} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="var(--border)" />
                  <Line type="monotone" dataKey="gf" name="Scored" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="ga" name="Conceded" stroke="var(--destructive)" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="gd" name="GD" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
