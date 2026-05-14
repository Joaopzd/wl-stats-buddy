import { useMemo } from "react";
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
import { TrendingUp } from "lucide-react";
import type { Match, WeekendLeague } from "@/lib/types";
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

function TrendTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendDatum }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const gdPositive = d.gd >= 0;
  return (
    <div
      className="rounded-md border border-border/70 bg-popover/95 backdrop-blur px-3 py-2 shadow-xl text-xs"
      style={{ color: "#F8FAFC", minWidth: 160 }}
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

export function WLTrendsChart({ wls, matches }: Props) {
  const data = useMemo(() => {
    return [...wls]
      .sort((a, b) => a.number - b.number)
      .map((wl) => {
        const r = wlRecord(wl, matches);
        return {
          name: wlLabel(wl).replace(/^WL #/, "#"),
          wins: r.wins,
          losses: r.losses,
          gf: r.goalsFor,
          ga: r.goalsAgainst,
          gd: r.goalsFor - r.goalsAgainst,
        };
      });
  }, [wls, matches]);

  if (data.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-2xl tracking-wider flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> WL Trends
        </h2>
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {data.length} session{data.length === 1 ? "" : "s"}
        </span>
      </div>

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
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
                />
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
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                  cursor={{ stroke: "var(--accent)", strokeWidth: 1 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Line type="monotone" dataKey="gf" name="Scored" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ga" name="Conceded" stroke="var(--destructive)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="gd" name="GD" stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
