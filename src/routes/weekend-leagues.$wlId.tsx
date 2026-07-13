import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, bestStreak, currentWinStreak, matchIsWin, rankFromWins, wlRecord, type PlayerAgg } from "@/lib/stats";

import { SquadDialog } from "@/components/SquadDialog";
import { TacticsDialog } from "@/components/TacticsDialog";
import { AICoach } from "@/components/AICoach";
import { PositionBadge } from "@/components/PositionBadge";
import { MatchDialog } from "@/components/MatchDialog";
import { MatchDetailModal } from "@/components/MatchDetailModal";
import { ReportModal } from "@/components/ReportModal";
import { RankBadge } from "@/components/RankBadge";
import { LossStreakAlert } from "@/components/LossStreakAlert";
import { PlayerCard } from "@/components/PlayerCard";

import { ClubCrest } from "@/components/ClubCrest";
import { OpponentCrest } from "@/components/OpponentCrest";
import { PlatformBadge } from "@/components/PlatformBadge";
import { LeagueWatermark } from "@/components/LeagueWatermark";
import { CREST_SIZE } from "@/lib/ui";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FORMATIONS, type FormationSlot } from "@/lib/formations";
import { ArrowLeft, Plus, Users, Pencil, Trash2, Pencil as PencilIcon, Check, Trophy, X as XIcon, Shield, ChevronDown, Sparkles, Flame, Snowflake, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { SoccerBall } from "@/components/icons/SoccerBall";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import type { Match, Player, Position, Rarity } from "@/lib/types";
import { wlLabel } from "@/lib/types";
import { rarityVisual } from "@/lib/format";
import { getCrest } from "@/lib/crests";

function getOpponentLabel(id?: string) {
  const c = getCrest(id);
  return c?.label ?? "Opponent";
}

export const Route = createFileRoute("/weekend-leagues/$wlId")({
  head: () => ({
    meta: [
      { title: "WL Detail — PitchSide" },
      { name: "description", content: "Detailed Weekend League view: squad, matches, and per-player performance." },
      { property: "og:title", content: "Weekend League Detail" },
      { property: "og:description", content: "Track every match in this WL session." },
    ],
  }),
  component: WLDetail,
  notFoundComponent: () => (
    <AppShell>
      <div className="text-center py-20">
        <h1 className="font-display text-3xl">WL not found</h1>
        <Link to="/weekend-leagues" className="text-primary mt-4 inline-block">← Back to all WLs</Link>
      </div>
    </AppShell>
  ),
});

function WLDetail() {
  const { wlId } = Route.useParams();
  const navigate = useNavigate();
  const wls = useWLs();
  const allMatches = useMatches();
  const players = usePlayers();
  const wl = wls.find((w) => w.id === wlId);

  const [squadOpen, setSquadOpen] = useState(false);
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSeen, setReportSeen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [squadExpanded, setSquadExpanded] = useState(false);
  const [lossAlertOpen, setLossAlertOpen] = useState(false);
  const [lossAlertDismissed, setLossAlertDismissed] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const openPlayer = (p: Player) => navigate({ to: "/players/$id", params: { id: p.id } });
  const lossAlertShownAtRef = useRef<string | null>(null);

  const matches = useMemo(
    () => allMatches.filter((m) => m.wlId === wlId).sort((a, b) => a.index - b.index),
    [allMatches, wlId],
  );

  const record = wl ? wlRecord(wl, allMatches) : null;
  const squad = useMemo(
    () => (wl ? players.filter((p) => wl.squadPlayerIds.includes(p.id)) : []),
    [wl, players],
  );
  const squadAggs = useMemo(
    () => squad.map((p) => aggregatePlayer(p, matches)),
    [squad, matches],
  );

  useEffect(() => {
    if (matches.length >= 15 && !reportSeen && !wl?.closed) {
      setReportOpen(true);
      setReportSeen(true);
    }
  }, [matches.length, reportSeen, wl?.closed]);

  // Loss-streak alert: trigger once per fresh L-L streak (resets after a win).
  // Once the user dismisses it via "Got it", it stays dismissed for the rest of the session.
  useEffect(() => {
    if (lossAlertDismissed) return;
    if (matches.length < 2) return;
    const last = matches[matches.length - 1];
    const prev = matches[matches.length - 2];
    const lastIsLoss = !matchIsWin(last);
    const prevIsLoss = !matchIsWin(prev);
    if (lastIsLoss && prevIsLoss) {
      if (lossAlertShownAtRef.current !== last.id) {
        lossAlertShownAtRef.current = last.id;
        setLossAlertOpen(true);
      }
    } else if (!lastIsLoss) {
      lossAlertShownAtRef.current = null;
    }
  }, [matches, lossAlertDismissed]);

  if (!wl) {
    return (
      <AppShell>
        <div className="text-center py-20">
          <h1 className="font-display text-3xl">WL not found</h1>
          <Link to="/weekend-leagues" className="text-primary mt-4 inline-block">← Back to all WLs</Link>
        </div>
      </AppShell>
    );
  }

  const nextMatchIndex = matches.length + 1;
  const label = wlLabel(wl);

  const saveName = () => {
    const trimmed = nameDraft.trim();
    store.updateWL(wl.id, { customName: trimmed || undefined });
    setEditingName(false);
    toast.success("Name updated");
  };

  return (
    <AppShell>
      <Link to="/weekend-leagues" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Weekend Leagues
      </Link>

      {(() => {
        const wins = record?.wins ?? 0;

        const gd = (record?.goalsFor ?? 0) - (record?.goalsAgainst ?? 0);
        const gdPositive = gd >= 0;
        const streak = currentWinStreak(matches);
        // Loss streak: number of consecutive losses at the tail.
        let lossStreak = 0;
        for (let i = matches.length - 1; i >= 0; i--) {
          if (matchIsWin(matches[i])) break;
          lossStreak += 1;
        }

        return (
          <div className="surface-glow overflow-hidden mb-4 relative">
            <LeagueWatermark title={label} markId={wl.watermarkId} color={wl.watermarkColor} size={140} />
            {/* Top: identity + record */}
            <div className="relative z-10 px-4 sm:px-5 pt-4 pb-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.3em] text-primary font-bold mb-2 flex items-center gap-2">
                  <ClubCrest size={20} overrideUrl={wl.clubCrestUrl} />
                  <span className="truncate">{wl.clubName || "My Club"} · WL #{wl.number} · Active Campaign</span>
                </div>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                      placeholder="Custom name..."
                      className="bg-input border border-border rounded-md px-2 py-1 font-display text-xl focus:outline-none focus:ring-2 focus:ring-primary min-w-0 flex-1 max-w-md"
                    />
                    <button onClick={saveName} className="p-1.5 rounded-md bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <h1 className="font-display text-3xl sm:text-4xl leading-tight truncate tracking-tight">{label}</h1>
                    <button
                      onClick={() => { setNameDraft(wl.customName ?? ""); setEditingName(true); }}
                      className="p-1 text-muted-foreground hover:text-primary shrink-0 transition-all duration-300 ease-in-out"
                      aria-label="Edit WL name"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                  <RankBadge rank={rankFromWins(wins)} size="sm" />
                  {wl.formation && (
                    <span className="px-2 py-0.5 rounded bg-secondary text-foreground text-[11px] font-bold uppercase tracking-wider">
                      {wl.formation}
                    </span>
                  )}
                </div>
              </div>

              {/* Record */}
              <div className="shrink-0 text-right">
                <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold mb-1 flex items-center justify-end gap-1">
                  <Trophy className="h-3 w-3 text-primary" /> Record
                </div>
                <div className="flex items-baseline gap-1.5 justify-end leading-none">
                  <span className="font-display text-4xl sm:text-5xl stat-num text-primary inline-flex items-baseline gap-1">
                    {wins}
                    {streak >= 2 && (
                      <WinStreakFire streak={streak} />
                    )}
                  </span>
                  <span className="font-display text-2xl text-muted-foreground/40">–</span>
                  <span className="font-display text-4xl sm:text-5xl stat-num text-destructive/90 inline-flex items-baseline gap-1">
                    {record?.losses ?? 0}
                    {lossStreak >= 2 && <LossStreakIce streak={lossStreak} />}
                  </span>
                </div>
                {streak >= 2 && (
                  <div className="mt-1 text-[11px] uppercase tracking-wider font-bold" style={{ color: streak >= 4 ? "#ff6b1a" : "#f59e0b" }}>
                    {streak}-win streak{streak >= 4 ? " · on fire" : ""}
                  </div>
                )}
                {lossStreak >= 2 && (
                  <div className="mt-1 text-[11px] uppercase tracking-wider font-bold text-sky-300">
                    {lossStreak}-loss streak{lossStreak >= 4 ? " · cold spell" : ""}
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar: matches played split by W/L, with remaining */}
            {(() => {
              const played = record?.played ?? 0;
              const losses = record?.losses ?? 0;
              const remaining = Math.max(0, 15 - played);
              const pct = (n: number) => (n / 15) * 100;
              return (
                <div className="relative z-10 px-5 sm:px-7 pb-4">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] font-bold text-muted-foreground mb-1.5">
                    <span>Campaign Progress</span>
                    <span className="font-mono text-foreground/80">{played}<span className="text-muted-foreground/60">/15</span> · {remaining} left</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-background/60 border border-border/60 overflow-hidden flex">
                    <div className="h-full bg-primary transition-all duration-300 ease-in-out" style={{ width: `${pct(wins)}%` }} />
                    <div className="h-full bg-destructive/80 transition-all duration-300 ease-in-out" style={{ width: `${pct(losses)}%` }} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[10px] uppercase tracking-wider font-semibold">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-primary" />Wins {wins}</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-destructive/80" />Losses {losses}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><span className="h-2 w-2 rounded-sm bg-background border border-border/60" />Remaining {remaining}</span>
                  </div>
                </div>
              );
            })()}

            {/* Middle: stats belt */}
            <div className="relative z-10 grid grid-cols-3 border-y border-border/60 bg-background/40">
              <BeltStat
                icon={<SoccerBall size={16} />}
                value={record?.goalsFor ?? 0}
                label="Scored"
                tone="primary"
              />
              <BeltStat
                icon={<Shield className="h-4 w-4" />}
                value={record?.goalsAgainst ?? 0}
                label="Conceded"
                tone="muted"
                divided
              />
              <BeltStat
                icon={null}
                value={gd}
                label="Goal Diff"
                tone={gdPositive ? "primary" : "danger"}
                divided
                signed
              />
            </div>

            {/* Bottom: action row */}
            <div className="relative z-10 px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setSquadOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border bg-secondary/60 text-foreground font-semibold uppercase tracking-wider text-[11px] hover:bg-secondary transition-all duration-300 ease-in-out"
              >
                <Users className="h-3.5 w-3.5" /> {squad.length ? "Edit Squad" : "Add Squad"}
              </button>
              <button
                onClick={() => setTacticsOpen(true)}
                disabled={!wl.formation}
                title={wl.formation ? "Configure tactics" : "Pick a formation first"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-border bg-secondary/60 text-foreground font-semibold uppercase tracking-wider text-[11px] hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
              >
                <Sparkles className="h-3.5 w-3.5" /> Tactics
              </button>
              <button
                onClick={() => { setEditingMatch(null); setMatchOpen(true); }}
                disabled={squad.length === 0 || matches.length >= 15}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-[11px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[var(--shadow-neon)] transition-all duration-300 ease-in-out"
              >
                <Plus className="h-3.5 w-3.5" /> Add Match{nextMatchIndex <= 15 && ` · ${nextMatchIndex}/15`}
              </button>
              {matches.length >= 15 && (
                <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-primary/50 text-primary font-semibold uppercase tracking-wider text-[11px] hover:bg-primary/10 transition-all duration-300 ease-in-out">
                  View Report
                </button>
              )}
            </div>

          </div>
        );
      })()}

      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="squad">Squad</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
      <section className="mb-8">
        {squad.length === 0 ? (
          <>
            <h2 className="font-display text-2xl tracking-wider mb-3">Squad (0)</h2>
            <div className="surface-card p-6 text-center text-muted-foreground text-sm">
              No squad yet. Click <span className="text-foreground font-semibold">Add Squad</span> to pull players from your database.
            </div>
          </>
        ) : (
          <div className="surface-card overflow-hidden">
            <button
              onClick={() => setSquadExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition"
              aria-expanded={squadExpanded}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Users className="h-4 w-4 text-primary shrink-0" />
                <span className="font-display text-xl tracking-wider">Squad</span>
                <span className="text-xs text-muted-foreground font-mono">({squad.length})</span>
                {wl.formation && (
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[11px] font-bold uppercase tracking-wider ml-1">
                    {wl.formation}
                  </span>
                )}
                {wl.startingAssignments && (
                  <span className="text-[11px] text-muted-foreground font-mono ml-auto sm:ml-2 shrink-0">
                    {Object.keys(wl.startingAssignments).length}/11 · {(wl.benchPlayerIds?.length ?? 0)} bench
                  </span>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform shrink-0 ${squadExpanded ? "rotate-180" : ""}`} />
            </button>
            {squadExpanded && (
              <div className="px-4 pb-4 pt-3 border-t border-border/60 space-y-4">
                {(() => {
                  const mvpLeader = [...squadAggs].filter((a) => a.mvpCount > 0).sort((a, b) => b.mvpCount - a.mvpCount || b.avgRating - a.avgRating)[0];
                  const csLeader = [...squadAggs].filter((a) => a.cleanSheets > 0).sort((a, b) => b.cleanSheets - a.cleanSheets)[0];
                  if (!mvpLeader && !csLeader) return null;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mvpLeader && (
                        <div className="rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-2 flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-amber-300 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-amber-300 font-bold">Weekly MVP</div>
                            <div className="text-xs font-semibold truncate">{mvpLeader.player.name}</div>
                          </div>
                          <div className="font-display stat-num text-amber-300 text-lg">{mvpLeader.mvpCount}</div>
                        </div>
                      )}
                      {csLeader && (
                        <div className="rounded-md border border-sky-400/40 bg-sky-500/10 px-3 py-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-sky-300 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] uppercase tracking-[0.25em] text-sky-300 font-bold">Clean Sheets Leader</div>
                            <div className="text-xs font-semibold truncate">{csLeader.player.name}</div>
                          </div>
                          <div className="font-display stat-num text-sky-300 text-lg">{csLeader.cleanSheets}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {wl.formation && wl.startingAssignments ? (
                  <>
                    <LineupPitch
                      formation={wl.formation}
                      assignments={wl.startingAssignments}
                      players={players}
                      onPick={openPlayer}
                    />
                    <BenchList
                      benchIds={wl.benchPlayerIds ?? []}
                      players={players}
                      onPick={openPlayer}
                    />
                  </>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    No formation set. Open <span className="text-foreground font-semibold">Edit Squad</span> to pick one.
                  </div>
                )}

                <details className="group">
                  <summary className="cursor-pointer text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold py-1 hover:text-foreground select-none flex items-center gap-1">
                    <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                    Per-player stats
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mt-2">
                    {squadAggs.map((a) => (
                      <div key={a.player.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/50 border border-border/60">
                        <span className="font-display text-base text-foreground stat-num w-7 text-center shrink-0 leading-none">{a.player.overall}</span>
                        <PositionBadge position={a.player.position} size="xs" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold truncate leading-tight">{a.player.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono leading-tight">
                            {a.matches}MP · {a.goals}G · {a.assists}A · {a.avgRating > 0 ? a.avgRating.toFixed(2) : "—"}
                            {a.mvpCount > 0 && <span className="text-amber-300 ml-1">· {a.mvpCount}★</span>}
                            {a.cleanSheets > 0 && <span className="text-sky-300 ml-1">· {a.cleanSheets}CS</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </section>

      {matches.length > 0 && !wl.closed && (
        <LiveReportSection
          wl={wl}
          matches={matches}
          squadAggs={squadAggs}
        />
      )}

      {matches.length > 0 && !wl.closed && (
        <AICoach wls={[wl]} matches={allMatches} players={players} />
      )}





      <LiveCampaignInsights matches={matches} squadAggs={squadAggs} />
        </TabsContent>

        <TabsContent value="matches" className="mt-4 space-y-4">
      {matches.length > 0 && (
        <TimelineSection
          matches={matches}
          players={players}
          onJump={(m) => setViewingMatch(m)}
        />
      )}


      <section>
        <div className="min-w-0">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-display text-xl tracking-wider">Matches ({matches.length})</h2>
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Tap to edit</span>
          </div>
          {matches.length === 0 ? (
            <div className="surface-card p-8 text-center text-muted-foreground text-sm">
              No matches yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[65vh] overflow-y-auto pr-1 scroll-accent">
              {matches.map((m) => {
                const win = matchIsWin(m);
                const totalG = m.performances.reduce((s, p) => s + (p.goals || 0), 0);
                const totalA = m.performances.reduce((s, p) => s + (p.assists || 0), 0);
                const oppLabel = getOpponentLabel(m.opponentCrestId);
                return (
                  <div
                    key={m.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setViewingMatch(m)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewingMatch(m); } }}
                    className="group relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm hover:shadow-[var(--shadow-glow)] hover:border-primary/40 hover:-translate-y-0.5 cursor-pointer transition-all duration-300 ease-in-out"
                    aria-label={`View match ${m.index} details`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      {/* Sequence number */}
                      <div className="shrink-0 h-10 w-10 rounded-full bg-secondary/50 border border-border/60 grid place-items-center">
                        <span className="font-display text-sm font-bold text-foreground/80 stat-num leading-none">{m.index}</span>
                      </div>

                      {/* Scoreline + opponent */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <ClubCrest size={CREST_SIZE.list} overrideUrl={wl.clubCrestUrl} />
                        <div className="font-display stat-num text-2xl sm:text-[28px] leading-none tracking-tight">
                          <span className="text-foreground">{m.scoreFor}</span>
                          <span className="text-muted-foreground/40 mx-1.5">–</span>
                          <span className={!win ? "text-destructive" : "text-foreground"}>{m.scoreAgainst}</span>
                        </div>
                        <OpponentCrest id={m.opponentCrestId} size={CREST_SIZE.list} />
                        <div className="min-w-0 hidden sm:flex flex-col leading-tight">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">vs</span>
                          <span className="text-sm font-semibold truncate text-foreground/90">{oppLabel}</span>
                        </div>
                        <div className="ml-1 hidden md:flex items-center gap-1 flex-wrap min-w-0">
                          <PlatformBadge platform={m.platform} size="xs" />
                         {m.disconnect && <Tag tone="dc">DC</Tag>}
                         {typeof m.connection === "number" && <Tag tone="conn">CONN {m.connection}/5</Tag>}
                         {m.extraTime && <Tag tone="warn">ET</Tag>}
                         {m.penalties && <Tag tone="info">PEN{m.penaltyWinner === "us" ? "✓" : "✗"}</Tag>}
                         {m.rageQuit && <Tag tone="rq">RQ</Tag>}
                        </div>
                      </div>

                      {/* G / A inline */}
                      <div className="hidden md:flex items-baseline gap-3 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground shrink-0">
                        <span><span className="font-display stat-num text-base text-foreground mr-1">{totalG}</span>G</span>
                        <span><span className="font-display stat-num text-base text-foreground mr-1">{totalA}</span>A</span>
                      </div>

                      {/* Minimal status text-tag (no solid block) */}
                      <div
                        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ease-in-out ${
                          win ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        <span className="text-base leading-none">{win ? "+" : "−"}</span>
                        {win ? "Win" : "Loss"}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingMatch(m); setMatchOpen(true); }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300 ease-in-out"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm("Delete this match?")) { store.deleteMatch(m.id); toast.success("Deleted"); } }}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 ease-in-out"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile tags row */}
                    <div className="sm:hidden mt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                      <PlatformBadge platform={m.platform} size="xs" />
                      <span className="font-semibold text-foreground/80">vs {oppLabel}</span>
                      <span className="font-mono">· {totalG}G · {totalA}A</span>
                      {m.disconnect && <Tag tone="dc">DC</Tag>}
                      {typeof m.connection === "number" && <Tag tone="conn">CONN {m.connection}/5</Tag>}
                      {m.extraTime && <Tag tone="warn">ET</Tag>}
                      {m.penalties && <Tag tone="info">PEN{m.penaltyWinner === "us" ? "✓" : "✗"}</Tag>}
                      {m.rageQuit && <Tag tone="rq">RQ</Tag>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
        </TabsContent>

        <TabsContent value="squad" className="mt-4">
          <div className="max-h-[70vh] overflow-y-auto pr-1 scroll-accent">
            <SquadAnalyticsTable squadAggs={squadAggs} />
          </div>
        </TabsContent>
      </Tabs>

      {squadOpen && (
        <SquadDialog
          wl={wl}
          allPlayers={players}
          onClose={() => setSquadOpen(false)}
        />
      )}
      <TacticsDialog
        wl={wl}
        players={players}
        open={tacticsOpen}
        onClose={() => setTacticsOpen(false)}
      />
      {matchOpen && (
        <MatchDialog
          wl={wl}
          squad={squad}
          existingMatch={editingMatch}
          nextIndex={nextMatchIndex}
          onClose={() => { setMatchOpen(false); setEditingMatch(null); }}
        />
      )}
      {viewingMatch && (
        <MatchDetailModal
          match={viewingMatch}
          players={players}
          wl={wl}
          onClose={() => setViewingMatch(null)}
          onEdit={() => { setEditingMatch(viewingMatch); setViewingMatch(null); setMatchOpen(true); }}
        />
      )}
      {reportOpen && record && (
        <ReportModal
          wl={wl}
          matches={matches}
          players={players}
          record={record}
          streak={bestStreak(matches)}
          onClose={() => { setReportOpen(false); store.updateWL(wl.id, { closed: true }); }}
          onBackToList={() => { store.updateWL(wl.id, { closed: true }); navigate({ to: "/weekend-leagues" }); }}
        />
      )}
      {lossAlertOpen && <LossStreakAlert onClose={() => { setLossAlertOpen(false); setLossAlertDismissed(true); }} />}
      {pickOpen && (
        <PlayerPickDialog
          onClose={() => setPickOpen(false)}
          onSubmit={(name, position, overall) => {
            const newPlayer: Player = {
              id: uuid(),
              name: name.trim(),
              position,
              overall,
              rarity: "FUT Champions TOTS",
              createdAt: Date.now(),
            };
            store.addPlayer(newPlayer);
            store.updateWL(wl.id, {
              squadPlayerIds: [...wl.squadPlayerIds, newPlayer.id],
              playerPickIds: [...(wl.playerPickIds ?? []), newPlayer.id],
            });
            setPickOpen(false);
            toast.success(`Red Pick added: ${newPlayer.name}`);
          }}
        />
      )}
    </AppShell>
  );
}

function IconStat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "primary" | "muted" }) {
  const iconColor = tone === "primary" ? "text-primary" : "text-muted-foreground";
  return (
    <div className="surface-card px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-3">
      <div className={`${iconColor} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <div className="stat-num font-display text-2xl sm:text-3xl leading-none text-foreground">{value}</div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-1 font-semibold">{label}</div>
      </div>
    </div>
  );
}

function GDStat({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <div className={`surface-card px-3 py-3 sm:px-4 sm:py-4 flex items-center gap-3 ${positive ? "border-primary/40 shadow-[0_0_20px_-8px_var(--primary)]" : "border-destructive/40"}`}>
      <div className="min-w-0">
        <div className="stat-num text-2xl sm:text-3xl font-display leading-none text-foreground">
          {positive ? "+" : ""}{value}
        </div>
        <div className="text-[11px] uppercase tracking-[0.25em] mt-1 font-bold text-foreground/80">GD</div>
      </div>
    </div>
  );
}

function InlineStat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "primary" | "muted" }) {
  const iconColor = tone === "primary" ? "text-primary" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0 px-1">
      <div className={`${iconColor} shrink-0`}>{icon}</div>
      <div className="min-w-0 flex items-baseline gap-1.5">
        <span className="stat-num font-display text-lg leading-none text-foreground">{value}</span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">{label}</span>
      </div>
    </div>
  );
}

function InlineGD({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <div className={`flex items-center gap-1.5 px-2 rounded ${positive ? "text-foreground" : "text-destructive"}`}>
      <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground">GD</span>
      <span className="stat-num font-display text-lg leading-none">
        {positive ? "+" : ""}{value}
      </span>
    </div>
  );
}


function Tag({ children, tone }: { children: React.ReactNode; tone: "warn" | "info" | "rq" | "dc" | "conn" }) {
  const cls =
    tone === "warn" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
    tone === "info" ? "bg-sky-500/20 text-sky-300 border-sky-500/40" :
    tone === "dc"   ? "bg-fuchsia-500/25 text-fuchsia-200 border-fuchsia-500/60" :
    tone === "conn" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" :
    "bg-destructive/20 text-destructive border-destructive/40";
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
      {children}
    </span>
  );
}

function LineupPitch({
  formation,
  assignments,
  players,
  onPick,
}: {
  formation: keyof typeof FORMATIONS;
  assignments: Record<string, string>;
  players: Player[];
  onPick?: (p: Player) => void;
}) {
  const slots: FormationSlot[] = FORMATIONS[formation].slots;
  const playersById = new Map(players.map((p) => [p.id, p]));
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2">
        Starting XI · {formation}
      </div>
      <div
        className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-emerald-700/40"
        style={{
          aspectRatio: "3 / 4",
          background:
            "repeating-linear-gradient(0deg, oklch(0.32 0.06 145) 0 8%, oklch(0.36 0.06 145) 8% 16%)",
        }}
      >
        <div className="absolute inset-1.5 border border-white/30 rounded" />
        <div className="absolute left-1/2 top-1.5 bottom-1.5 w-px bg-white/30 -translate-x-1/2" />
        <div className="absolute left-1/2 top-1/2 h-10 w-10 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-1/2 h-7 border border-t-0 border-white/30" />
        <div className="absolute left-1/2 bottom-1.5 -translate-x-1/2 w-1/2 h-7 border border-b-0 border-white/30" />
        {slots.map((slot) => {
          const pid = assignments[slot.id];
          const p = pid ? playersById.get(pid) : null;
          return (
            <div
              key={slot.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              {p ? (
                <button
                  type="button"
                  onClick={() => onPick?.(p)}
                  className="block transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
                  aria-label={`View ${p.name}`}
                >
                  <PlayerCard name={p.name} overall={p.overall} position={p.position} rarity={p.rarity} imageUrl={p.imageUrl} size="sm" />
                </button>
              ) : (
                <div className="h-9 w-9 rounded-full border-2 border-dashed border-white/60 bg-black/30 grid place-items-center">
                  <span className="text-[11px] font-bold text-white tracking-wider">{slot.position}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BenchList({ benchIds, players, onPick }: { benchIds: string[]; players: Player[]; onPick?: (p: Player) => void }) {
  const playersById = new Map(players.map((p) => [p.id, p]));
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2">
        Bench ({benchIds.length})
      </div>
      {benchIds.length === 0 ? (
        <div className="surface-card p-3 text-center text-muted-foreground text-xs">Empty bench</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {benchIds.map((id) => {
            const p = playersById.get(id);
            if (!p) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPick?.(p)}
                className="surface-card px-2 py-1.5 flex items-center gap-2 text-left hover:border-primary/60 transition"
              >
                <PlayerCard name={p.name} overall={p.overall} position={p.position} rarity={p.rarity} imageUrl={p.imageUrl} size="xs" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold truncate leading-tight">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono leading-tight flex items-center gap-1"><PositionBadge position={p.position} size="xs" /> {p.overall}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MatchTimeline({
  matches,
  players,
  onJump,
}: {
  matches: Match[];
  players: Player[];
  onJump: (m: Match) => void;
}) {
  const playersById = new Map(players.map((p) => [p.id, p]));

  // Compute cumulative wins after each match to derive the rank progression.
  let cumWins = 0;
  let prevRank = rankFromWins(0);
  const enriched = matches.map((m) => {
    const win = matchIsWin(m);
    if (win) cumWins += 1;
    const rank = rankFromWins(cumWins);
    const rankedUp = rank !== prevRank && win;
    // Wins still needed to reach the next tier from this point.
    // Each additional win bumps to the next rank until Elite I (15 wins).
    const winsToNext = cumWins >= 15 ? 0 : 1;
    const nextRank = cumWins >= 15 ? null : rankFromWins(cumWins + 1);
    prevRank = rank;
    return { match: m, win, rank, rankedUp, winsToNext, nextRank };
  });

  return (
    <div className="surface-card p-3">
      <div className="scroll-accent overflow-x-auto pb-2">
        <ol className="flex items-stretch gap-2 min-w-max">
          {enriched.map(({ match: m, win, rank, rankedUp, winsToNext, nextRank }, i) => {
            const totalG = m.performances.reduce((s, p) => s + (p.goals || 0), 0);
            const totalA = m.performances.reduce((s, p) => s + (p.assists || 0), 0);
            const topScorer = [...m.performances]
              .filter((p) => p.goals > 0)
              .sort((a, b) => b.goals - a.goals)[0];
            const topName = topScorer ? playersById.get(topScorer.playerId)?.name : null;
            const tooltip = nextRank
              ? `Need ${winsToNext} more win${winsToNext === 1 ? "" : "s"} for ${nextRank}`
              : "Max rank reached";
            return (
              <li key={m.id} className="flex items-center gap-2">
                <div className="flex flex-col items-stretch gap-1.5">
                  <button
                    onClick={() => onJump(m)}
                    title={tooltip}
                    className={`relative w-32 shrink-0 rounded-md border bg-background/50 p-2 text-left transition hover:bg-secondary/40 ${
                      win
                        ? "border-primary/50 shadow-[0_0_14px_-8px_var(--primary)]"
                        : "border-destructive/50"
                    }`}
                    aria-label={`Jump to match ${m.index}. ${tooltip}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        M{m.index}
                      </span>
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${win ? "text-primary" : "text-destructive"}`}>
                        {win ? "W" : "L"}
                      </span>
                    </div>
                    <div className="font-display stat-num text-lg leading-none text-foreground text-center">
                      {m.scoreFor}<span className="text-muted-foreground/50 mx-0.5">–</span>{m.scoreAgainst}
                    </div>
                    <div className="mt-1.5 flex justify-center">
                      <PlatformBadge platform={m.platform} size="xs" />
                    </div>
                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                     {m.disconnect && <Tag tone="dc">DC</Tag>}
                     {typeof m.connection === "number" && <Tag tone="conn">C{m.connection}</Tag>}
                     {m.extraTime && <Tag tone="warn">ET</Tag>}
                     {m.penalties && <Tag tone="info">PEN{m.penaltyWinner === "us" ? "✓" : "✗"}</Tag>}
                     {m.rageQuit && <Tag tone="rq">RQ</Tag>}
                    </div>
                    <div className="mt-1.5 text-[11px] font-mono text-muted-foreground text-center tabular-nums">
                      {totalG}G · {totalA}A
                    </div>
                    {topName && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground text-center truncate" title={topName}>
                        ★ {topName}
                      </div>
                    )}
                  </button>
                  {/* Cumulative rank label after this match */}
                  <div
                    className={`mx-auto px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider text-center truncate max-w-[8rem] ${
                      rankedUp
                        ? "border-primary text-primary bg-primary/10 shadow-[0_0_10px_-4px_var(--primary)]"
                        : "border-border/60 text-muted-foreground bg-background/40"
                    }`}
                    title={rankedUp ? `Rank up! → ${rank}` : `Rank: ${rank}`}
                  >
                    {rank}
                  </div>
                </div>
                {i < enriched.length - 1 && (
                  <div className="h-px w-3 bg-border shrink-0" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function BeltStat({
  icon,
  value,
  label,
  tone,
  divided,
  signed,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  tone: "primary" | "muted" | "danger";
  divided?: boolean;
  signed?: boolean;
}) {
  const valueColor =
    tone === "primary" ? "text-primary" : tone === "danger" ? "text-destructive" : "text-foreground";
  const iconColor = tone === "primary" ? "text-primary" : tone === "danger" ? "text-destructive" : "text-muted-foreground";
  const display = signed && value >= 0 ? `+${value}` : `${value}`;
  return (
    <div className={`px-4 sm:px-5 py-3 flex items-center justify-center gap-3 ${divided ? "border-l border-border/60" : ""}`}>
      {icon && <span className={`shrink-0 ${iconColor}`}>{icon}</span>}
      <div className="flex flex-col items-start leading-none">
        <span className={`font-display stat-num text-2xl sm:text-3xl ${valueColor}`}>{display}</span>
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold mt-1">{label}</span>
      </div>
    </div>
  );
}

const PICK_POSITIONS: Position[] = [
  "GK",
  "LB", "CB", "RB",
  "CDM", "CM", "LM", "RM", "CAM",
  "LW", "RW", "ST",
];

function PlayerPickDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (name: string, position: Position, overall: number) => void;
}) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState<Position>("ST");
  const [overall, setOverall] = useState(95);
  const v = rarityVisual("FUT Champions TOTS" as Rarity);

  const submit = () => {
    if (!name.trim()) { toast.error("Name required"); return; }
    if (overall < 1 || overall > 99) { toast.error("OVR must be 1–99"); return; }
    onSubmit(name, position, overall);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md surface-card p-5 space-y-4 border-2"
        style={{ borderColor: "#FFF475", boxShadow: "0 0 28px -6px #FFF475" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: "#FFF475" }} />
            <h2 className="font-display text-xl tracking-wider">Add Player Pick</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-2">
          Awarded as <span className="font-semibold" style={{ color: "#FFF475" }}>FUT Champions TOTS</span>. Saved to your squad and Player Database.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Player name"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Position</span>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value as Position)}
                className="mt-1 w-full bg-input border border-border rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PICK_POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-bold">Overall</span>
              <input
                type="number"
                min={1}
                max={99}
                value={overall}
                onChange={(e) => setOverall(parseInt(e.target.value || "0", 10))}
                className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary stat-num"
              />
            </label>
          </div>

          {/* Live preview */}
          <div className="flex items-center justify-center pt-1">
            <div
              className={`w-20 h-28 rounded-md p-2 flex flex-col items-center justify-between font-display ${v.className}`}
              style={v.style}
            >
              <span className="text-xl leading-none">{overall || "—"}</span>
              <span className="text-[11px] leading-none">{position}</span>
              <span className="text-[11px] uppercase tracking-tight truncate max-w-full">
                {name.trim() ? name.trim().split(" ").slice(-1)[0] : "Name"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-border bg-secondary/60 text-[11px] font-semibold uppercase tracking-wider hover:bg-secondary">
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-4 py-2 rounded-md text-[11px] font-semibold uppercase tracking-wider border-2"
            style={{ background: "#CB332B", borderColor: "#FFF475", color: "#FFFFFF" }}
          >
            Add Pick
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Fire badge shown next to the win count during a live WL whenever the
 * player has 2+ consecutive wins. Glows brighter at 4+ to signal momentum.
 */
function WinStreakFire({ streak }: { streak: number }) {
  const hot = streak >= 4;
  const size = hot ? 28 : 20;
  const color = hot ? "#ff6b1a" : "#f59e0b";
  return (
    <span
      aria-label={`${streak}-win streak`}
      title={`${streak}-win streak`}
      className={`inline-block align-baseline ${hot ? "animate-pulse" : ""}`}
      style={{ filter: hot ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 3px ${color}80)` }}
    >
      <Flame
        style={{ width: size, height: size, color, fill: color, fillOpacity: hot ? 0.35 : 0.15 }}
        strokeWidth={hot ? 2 : 1.75}
      />
    </span>
  );
}

/**
 * Live, in-progress WL report shown while a campaign is still running.
 * Aggregates per-player contributions (G/A/rating), plots a rating-per-match
 * trend, and surfaces a current MVP / weak-link / momentum highlight card.
 */
function LiveWLReport({
  wl,
  matches,
  squadAggs,
  hideHeader,
}: {
  wl: { id: string };
  matches: Match[];
  squadAggs: PlayerAgg[];
  hideHeader?: boolean;
}) {
  void wl;
  // Top contributors: must have played at least 1 match in this WL.
  const ranked = useMemo(() => {
    return [...squadAggs]
      .filter((a) => a.matches > 0)
      .sort((a, b) => {
        const score = (x: typeof a) => x.ga * 2 + x.avgRating * x.matches * 0.4;
        return score(b) - score(a);
      })
      .slice(0, 6);
  }, [squadAggs]);

  // Rating-per-match trend removed; chart deprecated.


  // Current MVP (highest ga * sqrt(matches) blend).
  const mvp = ranked[0] ?? null;
  const weakest = useMemo(() => {
    const candidates = squadAggs
      .filter((a) => a.player.position !== "GK" && a.matches >= 3 && a.avgRating > 0);
    if (!candidates.length) return null;
    return [...candidates].sort((a, b) => a.avgRating - b.avgRating)[0];
  }, [squadAggs]);

  const streak = currentWinStreak(matches);
  // Recent team avg rating across last 3 played matches.
  const teamAvg = useMemo(() => {
    const last3 = [...matches].sort((a, b) => a.index - b.index).slice(-3);
    const avgs = last3.map((m) => {
      const rated = m.performances.filter((p) => (p.rating ?? 0) > 0);
      return rated.length ? rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length : 0;
    }).filter((v) => v > 0);
    return avgs.length ? avgs.reduce((s, v) => s + v, 0) / avgs.length : 0;
  }, [matches]);

  // Possession & xG averages across the WL so far (only matches that logged the stat).
  const liveAdvanced = useMemo(() => {
    let possSum = 0, possCount = 0;
    let xgForSum = 0, xgForCount = 0;
    let xgAgSum = 0, xgAgCount = 0;
    for (const m of matches) {
      if (typeof m.possessionFor === "number") { possSum += m.possessionFor; possCount += 1; }
      if (typeof m.xgFor === "number" && m.xgFor > 0) { xgForSum += m.xgFor; xgForCount += 1; }
      if (typeof m.xgAgainst === "number" && m.xgAgainst > 0) { xgAgSum += m.xgAgainst; xgAgCount += 1; }
    }
    return {
      avgPossession: possCount ? possSum / possCount : null,
      possCount,
      avgXgFor: xgForCount ? xgForSum / xgForCount : null,
      xgForCount,
      avgXgAgainst: xgAgCount ? xgAgSum / xgAgCount : null,
      xgAgCount,
    };
  }, [matches]);

  return (
    <section className={hideHeader ? "" : "mb-8"}>
      {!hideHeader && (
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-2xl tracking-wider flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Live Report
          </h2>
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
            {matches.length}/15 played
          </span>
        </div>
      )}



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="surface-card p-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
            <Trophy className="h-3 w-3 text-amber-300" /> Current MVP
          </div>
          {mvp ? (
            <>
              <div className="font-display text-lg mt-1 truncate">{mvp.player.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground">
                {mvp.matches}MP · {mvp.goals}G · {mvp.assists}A · {mvp.avgRating > 0 ? mvp.avgRating.toFixed(2) : "—"}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground mt-2">No data yet.</div>
          )}
        </div>
        <div className="surface-card p-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-warn-caution" /> Weak Link
          </div>
          {weakest ? (
            <>
              <div className="font-display text-lg mt-1 truncate">{weakest.player.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1"><PositionBadge position={weakest.player.position} size="xs" /> {weakest.matches}MP · avg {weakest.avgRating.toFixed(2)}</div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground mt-2">Need 3+ rated apps.</div>
          )}
        </div>
        <div className="surface-card p-4">
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-primary" /> Momentum
          </div>
          <div className="font-display text-lg mt-1 flex items-baseline gap-2">
            {streak > 0 ? `${streak}W` : "—"}
            {streak >= 2 && <WinStreakFire streak={streak} />}
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            Team avg (last 3): {teamAvg > 0 ? teamAvg.toFixed(2) : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <LiveStatTile
          label="Avg Possession"
          icon={<Activity className="h-3 w-3 text-primary" />}
          value={liveAdvanced.avgPossession === null ? "—" : `${Math.round(liveAdvanced.avgPossession)}%`}
          accent={liveAdvanced.avgPossession !== null && liveAdvanced.avgPossession >= 50}
          danger={liveAdvanced.avgPossession !== null && liveAdvanced.avgPossession < 45}
          sub={liveAdvanced.possCount ? `${liveAdvanced.possCount} logged` : "log possession"}
          bar={liveAdvanced.avgPossession === null ? null : Math.round(liveAdvanced.avgPossession)}
        />
        <LiveStatTile
          label="Avg xG · You"
          icon={<TrendingUp className="h-3 w-3 text-primary" />}
          value={liveAdvanced.avgXgFor === null ? "—" : liveAdvanced.avgXgFor.toFixed(2)}
          accent
          sub={liveAdvanced.xgForCount ? `${liveAdvanced.xgForCount} sample${liveAdvanced.xgForCount === 1 ? "" : "s"}` : "no xG logged"}
        />
        <LiveStatTile
          label="Avg xG · Against"
          icon={<TrendingDown className="h-3 w-3 text-destructive" />}
          value={liveAdvanced.avgXgAgainst === null ? "—" : liveAdvanced.avgXgAgainst.toFixed(2)}
          danger
          sub={liveAdvanced.xgAgCount ? `${liveAdvanced.xgAgCount} sample${liveAdvanced.xgAgCount === 1 ? "" : "s"}` : "no xG logged"}
        />
      </div>


      <LiveCollapsible
        title="Top contributors"
        defaultOpen={false}
        meta="G·A · avg rating"
      >
        {ranked.length === 0 ? (
          <div className="text-xs text-muted-foreground py-3 text-center">No contributions yet.</div>
        ) : (
          <div className="divide-y divide-border/40">
            {ranked.map((a, i) => (
              <div key={a.player.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="font-display stat-num text-base w-6 text-center text-muted-foreground">{i + 1}</span>
                <PositionBadge position={a.player.position} size="xs" />
                <span className="font-semibold truncate flex-1">{a.player.name}</span>
                <span className="font-mono text-xs text-foreground tabular-nums">
                  {a.goals}<span className="text-muted-foreground/60">G</span>·{a.assists}<span className="text-muted-foreground/60">A</span>
                </span>
                <span className="font-display stat-num text-base w-12 text-right text-primary">
                  {a.avgRating > 0 ? a.avgRating.toFixed(2) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </LiveCollapsible>
    </section>
  );
}

/** Collapsible card used inside the Live Report. */
function LiveCollapsible({
  title,
  meta,
  defaultOpen = false,
  className = "",
  children,
}: {
  title: string;
  meta?: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`surface-card overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/40 transition"
        aria-expanded={open}
      >
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold">{title}</span>
        <span className="flex items-center gap-2">
          {meta && <span className="text-[11px] text-muted-foreground font-mono">{meta}</span>}
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}


/** Ice badge shown next to the loss count during a live WL when in a 2+ loss skid. */
function LossStreakIce({ streak }: { streak: number }) {
  const cold = streak >= 4;
  const size = cold ? 28 : 20;
  const color = cold ? "#7dd3fc" : "#38bdf8";
  return (
    <span
      aria-label={`${streak}-loss streak`}
      title={`${streak}-loss streak`}
      className={`inline-block align-baseline ${cold ? "animate-pulse" : ""}`}
      style={{ filter: cold ? `drop-shadow(0 0 8px ${color})` : `drop-shadow(0 0 3px ${color}80)` }}
    >
      <Snowflake
        style={{ width: size, height: size, color }}
        strokeWidth={cold ? 2.25 : 1.75}
      />
    </span>
  );
}


function LiveStatTile({
  label,
  icon,
  value,
  sub,
  accent,
  danger,
  bar,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
  accent?: boolean;
  danger?: boolean;
  bar?: number | null;
}) {
  return (
    <div className="surface-card p-3">
      <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
        {icon} {label}
      </div>
      <div className={`font-display stat-num text-2xl mt-1 leading-none ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>
        {value}
      </div>
      {typeof bar === "number" && (
        <div className="mt-2 h-1 bg-destructive/30 rounded overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${bar}%` }} />
        </div>
      )}
      <div className="text-[11px] text-muted-foreground mt-1 font-mono">{sub}</div>
    </div>
  );
}

/** Minimal collapsible section wrapper used to declutter the WL detail page. */
function CollapsibleWrap({
  title,
  defaultOpen = true,
  meta,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  meta?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-baseline justify-between mb-3 group"
        aria-expanded={open}
      >
        <h2 className="font-display text-2xl tracking-wider flex items-center gap-2">
          {title}
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </h2>
        {meta && <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">{meta}</span>}
      </button>
      {open && children}
    </section>
  );
}

function TimelineSection({
  matches,
  players,
  onJump,
}: {
  matches: Match[];
  players: Player[];
  onJump: (m: Match) => void;
}) {
  return (
    <CollapsibleWrap title="Timeline" defaultOpen meta="Tap to jump">
      <MatchTimeline matches={matches} players={players} onJump={onJump} />
    </CollapsibleWrap>
  );
}

function LiveReportSection(props: { wl: { id: string }; matches: Match[]; squadAggs: PlayerAgg[] }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="mb-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-baseline justify-between mb-3"
        aria-expanded={open}
      >
        <h2 className="font-display text-2xl tracking-wider flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Live Report
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </h2>
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
          {props.matches.length}/15 played
        </span>
      </button>
      {open && <LiveWLReport {...props} hideHeader />}
    </section>
  );
}

function LiveCampaignInsights({ matches, squadAggs }: { matches: Match[]; squadAggs: PlayerAgg[] }) {
  const topScorer = [...squadAggs].filter((a) => a.goals > 0).sort((a, b) => b.goals - a.goals || b.assists - a.assists)[0];
  const topAssister = [...squadAggs].filter((a) => a.assists > 0).sort((a, b) => b.assists - a.assists || b.goals - a.goals)[0];
  const recent = matches.slice(-5);

  return (
    <div className="lg:sticky lg:top-20 flex flex-col gap-3">
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-display text-sm uppercase tracking-[0.25em]">Live Campaign Insights</h3>
        </div>

        {/* Top Scorer */}
        <div className="px-4 py-3.5 border-b border-border/60">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1.5 flex items-center gap-1.5">
            <SoccerBall size={11} /> Top Scorer
          </div>
          {topScorer ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{topScorer.player.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{topScorer.matches} MP · {topScorer.assists}A</div>
              </div>
              <div className="font-display stat-num text-3xl text-primary leading-none">{topScorer.goals}</div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No goals yet</div>
          )}
        </div>

        {/* Top Playmaker */}
        <div className="px-4 py-3.5 border-b border-border/60">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Top Playmaker
          </div>
          {topAssister ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{topAssister.player.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{topAssister.matches} MP · {topAssister.goals}G</div>
              </div>
              <div className="font-display stat-num text-3xl text-primary leading-none">{topAssister.assists}</div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No assists yet</div>
          )}
        </div>

        {/* Mini timeline */}
        <div className="px-4 py-3.5">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2">Last 5 Matches</div>
          {recent.length === 0 ? (
            <div className="text-xs text-muted-foreground">No matches yet</div>
          ) : (
            <div className="flex items-center gap-1.5">
              {recent.map((m) => {
                const win = matchIsWin(m);
                return (
                  <div
                    key={m.id}
                    title={`M${m.index} · ${m.scoreFor}-${m.scoreAgainst}`}
                    className={`h-7 flex-1 rounded-md grid place-items-center font-display stat-num text-[11px] font-bold transition-all duration-300 ${
                      win
                        ? "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30"
                        : "bg-rose-400/15 text-rose-300 border border-rose-400/30"
                    }`}
                  >
                    {win ? "W" : "L"}
                  </div>
                );
              })}
              {Array.from({ length: Math.max(0, 5 - recent.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 flex-1 rounded-md border border-border/40 bg-background/30" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


type SortKey = "name" | "matches" | "goals" | "assists" | "ga" | "avgRating" | "mvpCount";

function SquadAnalyticsTable({ squadAggs }: { squadAggs: PlayerAgg[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("avgRating");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const arr = [...squadAggs];
    arr.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "name") {
        av = a.player.name.toLowerCase();
        bv = b.player.name.toLowerCase();
      } else {
        av = a[sortKey] as number;
        bv = b[sortKey] as number;
      }
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [squadAggs, sortKey, dir]);

  const toggle = (k: SortKey) => {
    if (sortKey === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setDir(k === "name" ? "asc" : "desc"); }
  };

  const Th = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th
      onClick={() => toggle(k)}
      className={`px-2 py-2 text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground cursor-pointer select-none hover:text-foreground transition ${align === "right" ? "text-right" : "text-left"}`}
    >
      {label}{sortKey === k && <span className="ml-1 text-primary">{dir === "asc" ? "▲" : "▼"}</span>}
    </th>
  );

  if (squadAggs.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-muted-foreground text-sm">
        No squad players yet.
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
        <h3 className="font-display text-xl tracking-wider">Squad Analytics</h3>
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Click headers to sort</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 border-b border-border/60">
            <tr>
              <Th k="name" label="Player" />
              <th className="px-2 py-2 text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground">Pos</th>
              <Th k="matches" label="MP" align="right" />
              <Th k="goals" label="G" align="right" />
              <Th k="assists" label="A" align="right" />
              <Th k="ga" label="G+A" align="right" />
              <Th k="avgRating" label="Avg" align="right" />
              <Th k="mvpCount" label="MVP" align="right" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.player.id} className="border-b border-border/40 hover:bg-secondary/30 transition">
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-display text-base stat-num text-foreground w-7 text-center shrink-0 leading-none">{a.player.overall}</span>
                    <span className="text-sm font-semibold truncate">{a.player.name}</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <PositionBadge position={a.player.position} size="xs" />
                </td>
                <td className="px-2 py-2 text-right font-mono">{a.matches}</td>
                <td className="px-2 py-2 text-right font-mono">{a.goals}</td>
                <td className="px-2 py-2 text-right font-mono">{a.assists}</td>
                <td className="px-2 py-2 text-right font-mono font-semibold">{a.ga}</td>
                <td className="px-2 py-2 text-right font-mono font-semibold">
                  {a.avgRating > 0 ? a.avgRating.toFixed(2) : "—"}
                </td>
                <td className="px-2 py-2 text-right font-mono text-amber-300">{a.mvpCount || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
