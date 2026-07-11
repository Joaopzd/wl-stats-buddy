import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers } from "@/lib/store";
import {
  aggregateAllPlayers,
  clutchAggregate,
  CLUTCH_MIN_MATCHES,
  CLUTCH_KING_TOOLTIP,
  CLUTCH_DROP_TOOLTIP,
  type ClutchAgg,
  type PlayerAgg,
} from "@/lib/stats";
import {
  Sparkles,
  Trophy,
  Shield,
  Info,
  Zap,
  Flame,
  TrendingDown,
  ChevronDown,
} from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { SoccerBoot } from "@/components/icons/SoccerBoot";
import { PositionBadge } from "@/components/PositionBadge";

const MIN_MATCHES = 9;

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Club Legends — PitchSide" },
      { name: "description", content: "Top leaderboards: scorers, playmakers and best-rated players in your club." },
      { property: "og:title", content: "Club Legends · Rankings" },
      { property: "og:description", content: "All-time leaderboards across your career." },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  const players = usePlayers();
  const matches = useMatches();
  const aggs = useMemo(() => aggregateAllPlayers(players, matches), [players, matches]);
  const eligible = useMemo(() => aggs.filter((a) => a.matches >= MIN_MATCHES), [aggs]);

  const topScorers = useMemo(
    () => [...eligible].filter((a) => a.goals > 0).sort((a, b) => b.goals - a.goals || b.gaPerGame - a.gaPerGame).slice(0, 10),
    [eligible],
  );
  const topPlaymakers = useMemo(
    () => [...eligible].filter((a) => a.assists > 0).sort((a, b) => b.assists - a.assists || b.gaPerGame - a.gaPerGame).slice(0, 10),
    [eligible],
  );
  const topRated = useMemo(
    () => [...eligible].filter((a) => a.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10),
    [eligible],
  );
  const topMvps = useMemo(
    () => [...eligible].filter((a) => a.mvpCount > 0).sort((a, b) => b.mvpCount - a.mvpCount || b.avgRating - a.avgRating).slice(0, 10),
    [eligible],
  );
  const topCleanSheets = useMemo(
    () => [...eligible].filter((a) => a.cleanSheets > 0).sort((a, b) => b.cleanSheets - a.cleanSheets || a.goalsConceded - b.goalsConceded).slice(0, 10),
    [eligible],
  );
  const topSubs = useMemo(
    () => [...aggs].filter((a) => a.subMatches >= 2 && a.subImpact > 0).sort((a, b) => b.subImpact - a.subImpact).slice(0, 10),
    [aggs],
  );
  const topClutch = useMemo<ClutchAgg[]>(
    () =>
      players
        .map((p) => clutchAggregate(p, matches))
        .filter((c) => c.clutch.matches >= CLUTCH_MIN_MATCHES && c.clutch.ratedMatches > 0)
        .sort((a, b) => b.clutchScore - a.clutchScore || b.ratingDelta - a.ratingDelta || b.clutch.avgRating - a.clutch.avgRating)
        .slice(0, 10),
    [players, matches],
  );

  const toRow = (a: PlayerAgg, value: number, sub: string, formatted?: string): LegendRow => ({
    id: a.player.id,
    name: a.player.name,
    value,
    formatted,
    sub,
    position: a.player.position,
  });

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="font-display text-4xl tracking-wider flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" /> Club Legends
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Career-wide leaderboards across all your Weekend Leagues.
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary/40 border border-border/50 rounded-md px-2 py-1">
          <Info className="h-3 w-3 text-primary" />
          Only players with {MIN_MATCHES}+ matches are eligible for the All-Time Rankings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <RankBoard
          title="Top Scorers"
          unit="goals"
          icon={<SoccerBall size={16} />}
          rows={topScorers.map((a) => toRow(a, a.goals, `${a.matches} apps · ${a.gaPerGame.toFixed(2)} G+A/G`))}
          empty="No goals logged yet."
          explain={{
            criteria: [
              `Career total goals across all Weekend Leagues.`,
              `Requires ${MIN_MATCHES}+ appearances to qualify.`,
            ],
            tiebreakers: ["Higher G+A per game", "More appearances"],
          }}
        />
        <RankBoard
          title="Top Playmakers"
          unit="assists"
          icon={<SoccerBoot size={16} />}
          rows={topPlaymakers.map((a) => toRow(a, a.assists, `${a.matches} apps · ${a.gaPerGame.toFixed(2)} G+A/G`))}
          empty="No assists logged yet."
          explain={{
            criteria: [
              `Career total assists across all Weekend Leagues.`,
              `Requires ${MIN_MATCHES}+ appearances to qualify.`,
            ],
            tiebreakers: ["Higher G+A per game", "More appearances"],
          }}
        />
        <RankBoard
          title="Top Performance"
          unit="avg rating"
          icon={<Sparkles className="h-4 w-4" />}
          rows={topRated.map((a) => toRow(a, a.avgRating, `${a.ratedMatches} rated · ${a.matches} apps`, a.avgRating.toFixed(2)))}
          maxOverride={10}
          empty={`Need ${MIN_MATCHES}+ matches with a rating.`}
          explain={{
            criteria: [
              `Career average of all match ratings.`,
              `Min ${MIN_MATCHES} appearances and at least one rated match.`,
              `Bars scaled on a 0–10 rating scale.`,
            ],
            tiebreakers: ["More rated matches", "More appearances"],
          }}
        />
        <RankBoard
          title="Top MVPs"
          unit="MVPs"
          icon={<Trophy className="h-4 w-4" />}
          rows={topMvps.map((a) => toRow(a, a.mvpCount, `${a.matches} apps · ${a.avgRating.toFixed(2)} avg`))}
          empty="No MVP awards yet. Highest-rated player per match earns the badge."
          explain={{
            criteria: [
              `MVP = highest-rated player in a match (one per match).`,
              `Requires ${MIN_MATCHES}+ appearances to qualify.`,
            ],
            tiebreakers: ["Higher career avg rating"],
          }}
        />
        <RankBoard
          title="Top Clean Sheets"
          unit="CS"
          icon={<Shield className="h-4 w-4" />}
          rows={topCleanSheets.map((a) => toRow(a, a.cleanSheets, `${a.matches} apps · ${a.goalsConceded} GA`))}
          empty="No clean sheets yet."
          explain={{
            criteria: [
              `Matches where the team conceded zero goals with the player on the pitch.`,
              `Requires ${MIN_MATCHES}+ appearances to qualify.`,
            ],
            tiebreakers: ["Fewer total goals conceded"],
          }}
        />
        <RankBoard
          title="Top Super Subs"
          unit="impact"
          icon={<Zap className="h-4 w-4" />}
          rows={topSubs.map((a) => toRow(a, a.subImpact, `${a.subMatches} sub apps · ${a.goals}G/${a.assists}A`, a.subImpact.toFixed(2)))}
          empty="No substitute appearances yet. Mark players as Sub when logging matches."
          explain={{
            criteria: [
              `Impact score for players coming off the bench.`,
              `Formula: (G+A per sub app) × √(sub apps) × avg rating.`,
              `Requires at least 2 sub appearances.`,
            ],
            tiebreakers: ["Higher score wins outright"],
          }}
        />
      </div>

      <div className="mt-6">
        <ClutchLeaderboard rows={topClutch} />
      </div>
    </AppShell>
  );
}

interface LegendRow {
  id: string;
  name: string;
  value: number;
  formatted?: string;
  sub: string;
  position?: string;
}

interface ExplainConfig {
  criteria: string[];
  tiebreakers: string[];
}

function RankBoard({
  title,
  unit,
  icon,
  rows,
  empty,
  explain,
  maxOverride,
}: {
  title: string;
  unit: string;
  icon: React.ReactNode;
  rows: LegendRow[];
  empty: string;
  explain: ExplainConfig;
  maxOverride?: number;
}) {
  const max = maxOverride ?? (rows.reduce((m, r) => Math.max(m, r.value), 0) || 1);
  const hero = rows[0];
  const rest = rows.slice(1);

  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/50 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold flex items-center gap-2 min-w-0">
          <span className="text-primary shrink-0">{icon}</span>
          <span className="truncate">{title}</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-mono shrink-0">
          {unit}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">{empty}</div>
      ) : (
        <>
          {/* Hero row — the #1 */}
          {hero && (
            <div className="mt-4 flex items-end justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold">Leader</div>
                <div className="font-display text-base sm:text-lg truncate mt-0.5">{hero.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5 truncate flex items-center gap-1.5">
                  {hero.position && <PositionBadge position={hero.position as never} size="xs" />}
                  {hero.sub}
                </div>
              </div>
              <div className="font-display stat-num text-4xl sm:text-5xl leading-none text-foreground tabular-nums shrink-0">
                {hero.formatted ?? hero.value}
              </div>
            </div>
          )}

          {/* Progress-bar leaderboard */}
          <ol className="mt-4 pt-3 border-t border-border/40 space-y-2.5 flex-1">
            {hero && <RankBar rank={1} row={hero} max={max} highlighted />}
            {rest.map((r, i) => (
              <RankBar key={r.id} rank={i + 2} row={r} max={max} />
            ))}
          </ol>
        </>
      )}

      <ExplainPanel explain={explain} />
    </div>
  );
}

function RankBar({
  rank,
  row,
  max,
  highlighted = false,
}: {
  rank: number;
  row: LegendRow;
  max: number;
  highlighted?: boolean;
}) {
  const pct = Math.max(2, (row.value / max) * 100);
  return (
    <li className="flex items-center gap-2.5 min-w-0">
      <span
        className={`w-6 text-center font-mono text-[10px] font-bold shrink-0 ${
          highlighted ? "text-primary" : "text-muted-foreground/70"
        }`}
      >
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className={`text-xs sm:text-[13px] truncate min-w-0 ${
              highlighted ? "font-semibold text-foreground" : "text-foreground/80"
            }`}
          >
            {row.name}
          </span>
          <span className="font-mono stat-num text-xs sm:text-[13px] shrink-0 tabular-nums text-foreground/90">
            {row.formatted ?? row.value}
          </span>
        </div>
        <div className="mt-1 h-[3px] bg-secondary/50 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              highlighted ? "bg-primary" : "bg-foreground/25"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </li>
  );
}

function ExplainPanel({ explain }: { explain: ExplainConfig }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 pt-3 border-t border-border/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground transition"
        aria-expanded={open}
      >
        <span className="flex items-center gap-1.5">
          <Info className="h-3 w-3" /> How this is ranked
        </span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-[11px] leading-relaxed">
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold mb-1">Criteria</div>
            <ul className="space-y-1 text-muted-foreground">
              {explain.criteria.map((c, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-primary/60 shrink-0">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold mb-1">Tie-breakers</div>
            <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
              {explain.tiebreakers.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

function ClutchLeaderboard({ rows }: { rows: ClutchAgg[] }) {
  const [open, setOpen] = useState(false);
  const hero = rows[0];
  const rest = rows.slice(1);
  const max = rows.reduce((m, r) => Math.max(m, Math.abs(r.clutchScore)), 0) || 1;

  return (
    <div className="surface-card p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 text-primary">
          <Flame className="h-4 w-4" />
          <h2 className="font-display text-lg tracking-wider">Clutch King</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Δ Rating · 11–15</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="mt-4">
          <div className="text-[11px] text-muted-foreground mb-3">
            Career performance during the final WL stretch (matches 11–15) vs baseline. Min {CLUTCH_MIN_MATCHES} clutch apps.
          </div>

          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">
              No player has {CLUTCH_MIN_MATCHES}+ rated appearances in matches 11–15 yet.
            </div>
          ) : (
            <>
              {hero && (
                <div className="mt-2 flex items-end justify-between gap-3 min-w-0 pb-4 border-b border-border/40">
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold flex items-center gap-1.5">
                      <Flame className="h-3 w-3" /> Clutch Leader
                    </div>
                    <div className="font-display text-base sm:text-lg truncate mt-0.5">{hero.player.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5 truncate flex items-center gap-1.5">
                      <PositionBadge position={hero.player.position} size="xs" />
                      {hero.clutch.matches} clutch · {hero.clutch.avgRating.toFixed(2)} vs {hero.baseline.avgRating.toFixed(2)}
                    </div>
                  </div>
                  <div className="font-display stat-num text-4xl sm:text-5xl leading-none text-foreground tabular-nums shrink-0">
                    {hero.clutchScore >= 0 ? "+" : ""}
                    {hero.clutchScore.toFixed(2)}
                  </div>
                </div>
              )}

              <ol className="mt-4 space-y-2.5">
                {hero && <ClutchBar rank={1} row={hero} max={max} highlighted />}
                {rest.map((c, i) => (
                  <ClutchBar key={c.player.id} rank={i + 2} row={c} max={max} />
                ))}
              </ol>
            </>
          )}

          <ExplainPanel
            explain={{
              criteria: [
                `"Clutch" window = matches 11–15 of each Weekend League.`,
                `Score = rating Δ (clutch − baseline) + 1.5 × G+A per game Δ.`,
                `Requires ${CLUTCH_MIN_MATCHES}+ appearances in the clutch window with at least one rated match.`,
                `Clutch King badge for elite lift; Pressure Drop badge for a sharp decline.`,
              ],
              tiebreakers: ["Higher rating Δ", "Higher clutch avg rating"],
            }}
          />
        </div>
      )}
    </div>
  );
}

function ClutchBar({
  rank,
  row,
  max,
  highlighted = false,
}: {
  rank: number;
  row: ClutchAgg;
  max: number;
  highlighted?: boolean;
}) {
  const score = row.clutchScore;
  const pct = Math.max(2, (Math.abs(score) / max) * 100);
  const positive = score >= 0;
  const barTone = positive
    ? highlighted
      ? "bg-primary"
      : "bg-foreground/25"
    : "bg-destructive/70";
  const valueTone = positive ? "text-foreground/90" : "text-destructive";
  return (
    <li className="flex items-center gap-2.5 min-w-0">
      <span
        className={`w-6 text-center font-mono text-[10px] font-bold shrink-0 ${
          highlighted ? "text-primary" : "text-muted-foreground/70"
        }`}
      >
        {String(rank).padStart(2, "0")}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span
            className={`text-xs sm:text-[13px] truncate min-w-0 flex items-center gap-1.5 ${
              highlighted ? "font-semibold text-foreground" : "text-foreground/80"
            }`}
          >
            {row.player.name}
            {row.badge === "king" && (
              <span
                title={CLUTCH_KING_TOOLTIP}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] uppercase tracking-wider font-bold shrink-0"
              >
                <Flame className="h-2 w-2" /> King
              </span>
            )}
            {row.badge === "drop" && (
              <span
                title={CLUTCH_DROP_TOOLTIP}
                className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-destructive/20 text-destructive text-[9px] uppercase tracking-wider font-bold shrink-0"
              >
                <TrendingDown className="h-2 w-2" /> Drop
              </span>
            )}
          </span>
          <span className={`font-mono stat-num text-xs sm:text-[13px] shrink-0 tabular-nums ${valueTone}`}>
            {positive ? "+" : ""}
            {score.toFixed(2)}
          </span>
        </div>
        <div className="mt-1 h-[3px] bg-secondary/50 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${barTone}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </li>
  );
}
