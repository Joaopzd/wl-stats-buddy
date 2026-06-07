import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, GitCompareArrows, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs } from "@/lib/store";
import { aggregatePlayer, matchIsWin, rankFromWins, wlRecord } from "@/lib/stats";
import { wlLabel } from "@/lib/types";
import type { Match, Player, WeekendLeague } from "@/lib/types";
import { RankBadge } from "@/components/RankBadge";

export const Route = createFileRoute("/weekend-leagues/compare")({
  head: () => ({
    meta: [
      { title: "Compare Weekend Leagues — PitchSide" },
      { name: "description", content: "Side-by-side comparison of multiple Weekend Leagues and per-player evolution." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const wls = useWLs();
  const allMatches = useMatches();
  const players = usePlayers();

  const sorted = useMemo(() => [...wls].sort((a, b) => b.number - a.number), [wls]);
  const [selected, setSelected] = useState<string[]>(() => sorted.slice(0, 2).map((w) => w.id));

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const selectedWLs = sorted.filter((w) => selected.includes(w.id));
  // Keep visual order matching WL number ascending for "evolution" reading.
  const ordered = [...selectedWLs].sort((a, b) => a.number - b.number);

  return (
    <AppShell>
      <Link to="/weekend-leagues" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Weekend Leagues
      </Link>

      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wider flex items-center gap-3">
            <GitCompareArrows className="h-7 w-7 text-primary" /> Compare WLs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick two or more Weekend Leagues to see how the club — and each player — evolved.
          </p>
        </div>
      </div>

      {/* WL picker */}
      <section className="surface-card p-4 mb-6">
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
          Select Weekend Leagues ({selected.length} selected)
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Weekend Leagues yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sorted.map((w) => {
              const on = selected.includes(w.id);
              const r = wlRecord(w, allMatches);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => toggle(w.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition border ${
                    on
                      ? "bg-primary/15 text-primary border-primary/60"
                      : "bg-background/40 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {on ? <Check className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" aria-hidden />}
                  <span className="font-display tracking-wider">{wlLabel(w)}</span>
                  <span className="font-mono text-[11px] opacity-80">{r.wins}-{r.losses}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {ordered.length < 2 ? (
        <div className="surface-card p-10 text-center text-sm text-muted-foreground">
          Select at least two Weekend Leagues to compare.
        </div>
      ) : (
        <>
          <WLSummaryGrid wls={ordered} allMatches={allMatches} />
          <PlayerEvolutionTable wls={ordered} allMatches={allMatches} players={players} />
        </>
      )}
    </AppShell>
  );
}

function WLSummaryGrid({ wls, allMatches }: { wls: WeekendLeague[]; allMatches: Match[] }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-2xl tracking-wider mb-3">Overview</h2>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${wls.length}, minmax(200px, 1fr))` }}
      >
        {wls.map((w) => {
          const r = wlRecord(w, allMatches);
          const gd = r.goalsFor - r.goalsAgainst;
          const ms = allMatches.filter((m) => m.wlId === w.id);
          const ratedMs = ms.flatMap((m) => m.performances.filter((p) => (p.rating ?? 0) > 0));
          const avgRating = ratedMs.length
            ? ratedMs.reduce((s, p) => s + (p.rating ?? 0), 0) / ratedMs.length
            : 0;
          return (
            <div key={w.id} className="surface-card p-4">
              <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">
                WL #{w.number}
              </div>
              <div className="font-display text-lg leading-tight truncate" title={wlLabel(w)}>
                {wlLabel(w)}
              </div>
              <div className="mt-2"><RankBadge rank={rankFromWins(r.wins)} size="sm" /></div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Stat label="Wins" value={r.wins} tone="primary" />
                <Stat label="Losses" value={r.losses} tone="destructive" />
                <Stat label="Scored" value={r.goalsFor} />
                <Stat label="Conceded" value={r.goalsAgainst} />
                <Stat label="GD" value={gd} signed tone={gd >= 0 ? "primary" : "destructive"} />
                <Stat label="Avg ★" value={avgRating > 0 ? avgRating.toFixed(2) : "—"} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Stat({
  label, value, tone, signed,
}: {
  label: string;
  value: number | string;
  tone?: "primary" | "destructive";
  signed?: boolean;
}) {
  const cls = tone === "primary" ? "text-primary" : tone === "destructive" ? "text-destructive" : "text-foreground";
  const disp = signed && typeof value === "number" && value >= 0 ? `+${value}` : value;
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
      <span className={`stat-num font-display text-base ${cls}`}>{disp}</span>
    </div>
  );
}

function PlayerEvolutionTable({
  wls, allMatches, players,
}: {
  wls: WeekendLeague[];
  allMatches: Match[];
  players: Player[];
}) {
  // Players that appeared in the squad of ANY selected WL.
  const playerIds = useMemo(() => {
    const set = new Set<string>();
    for (const w of wls) for (const id of w.squadPlayerIds) set.add(id);
    return Array.from(set);
  }, [wls]);

  const rows = useMemo(() => {
    return playerIds
      .map((id) => {
        const player = players.find((p) => p.id === id);
        if (!player) return null;
        const perWL = wls.map((w) => {
          const wlMatches = allMatches.filter((m) => m.wlId === w.id);
          const agg = aggregatePlayer(player, wlMatches);
          return { wlId: w.id, agg };
        });
        const totalMatches = perWL.reduce((s, x) => s + x.agg.matches, 0);
        return { player, perWL, totalMatches };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.totalMatches > 0)
      .sort((a, b) => b.totalMatches - a.totalMatches);
  }, [playerIds, players, wls, allMatches]);

  if (rows.length === 0) {
    return (
      <section>
        <h2 className="font-display text-2xl tracking-wider mb-3">Per-Player Evolution</h2>
        <div className="surface-card p-8 text-center text-sm text-muted-foreground">
          No player appearances in the selected Weekend Leagues yet.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-2xl tracking-wider mb-3">Per-Player Evolution</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Each cell shows that player's performance in that WL: matches · G · A · avg rating.
      </p>
      <div className="surface-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-background/50 text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
              <th className="text-left px-3 py-2 sticky left-0 bg-background/80 backdrop-blur">Player</th>
              {wls.map((w) => (
                <th key={w.id} className="text-center px-3 py-2 whitespace-nowrap">
                  <div>WL #{w.number}</div>
                  <div className="font-mono text-[11px] text-muted-foreground/70 normal-case tracking-normal truncate max-w-[8rem]">
                    {w.customName?.trim() || ""}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, perWL }) => (
              <tr key={player.id} className="border-t border-border/40">
                <td className="px-3 py-2 sticky left-0 bg-background/80 backdrop-blur">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-display stat-num text-base text-foreground w-7 text-center shrink-0">{player.overall}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0 w-9 text-center">{player.position}</span>
                    <span className="text-[12px] font-semibold truncate">{player.name}</span>
                  </div>
                </td>
                {perWL.map(({ wlId, agg }) => (
                  <td key={wlId} className="text-center px-3 py-2">
                    {agg.matches === 0 ? (
                      <span className="text-muted-foreground/50 text-[11px]">—</span>
                    ) : (
                      <PerfCell agg={agg} />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClubTrend wls={wls} allMatches={allMatches} />
    </section>
  );
}

function PerfCell({ agg }: { agg: { matches: number; goals: number; assists: number; avgRating: number; wins: number } }) {
  const r = agg.avgRating;
  const tone =
    r >= 7.5 ? "text-primary" :
    r >= 6.5 ? "text-foreground" :
    r > 0 ? "text-destructive" :
    "text-muted-foreground";
  return (
    <div className="leading-tight">
      <div className={`font-display stat-num text-sm ${tone}`}>{r > 0 ? r.toFixed(2) : "—"}</div>
      <div className="font-mono text-[11px] text-muted-foreground tabular-nums">
        {agg.matches}MP · {agg.goals}G · {agg.assists}A
      </div>
    </div>
  );
}

function ClubTrend({ wls, allMatches }: { wls: WeekendLeague[]; allMatches: Match[] }) {
  // Mini trend showing wins/losses progression across selected WLs.
  return (
    <div className="mt-6 surface-card p-4">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
        Club Trend (selected WLs)
      </div>
      <div className="flex items-end gap-3 overflow-x-auto pb-2">
        {wls.map((w) => {
          const ms = allMatches.filter((m) => m.wlId === w.id);
          let wins = 0;
          for (const m of ms) if (matchIsWin(m)) wins += 1;
          const losses = ms.length - wins;
          const max = 15;
          const winH = (wins / max) * 100;
          const lossH = (losses / max) * 100;
          return (
            <div key={w.id} className="flex flex-col items-center gap-1 shrink-0 min-w-[60px]">
              <div className="flex items-end gap-1 h-24">
                <div
                  className="w-4 rounded-t bg-primary"
                  style={{ height: `${winH}%` }}
                  title={`${wins} wins`}
                />
                <div
                  className="w-4 rounded-t bg-destructive/80"
                  style={{ height: `${lossH}%` }}
                  title={`${losses} losses`}
                />
              </div>
              <div className="text-[11px] font-mono text-muted-foreground">#{w.number}</div>
              <div className="text-[11px] font-mono text-foreground">{wins}-{losses}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
