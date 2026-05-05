import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, bestStreak, matchIsWin, rankFromWins, wlRecord } from "@/lib/stats";

import { SquadDialog } from "@/components/SquadDialog";
import { MatchDialog } from "@/components/MatchDialog";
import { MatchDetailModal } from "@/components/MatchDetailModal";
import { ReportModal } from "@/components/ReportModal";
import { RankBadge } from "@/components/RankBadge";
import { LossStreakAlert } from "@/components/LossStreakAlert";
import { PlayerCard } from "@/components/PlayerCard";
import { ClubCrest } from "@/components/ClubCrest";
import { OpponentCrest } from "@/components/OpponentCrest";
import { PlatformBadge } from "@/components/PlatformBadge";
import { CREST_SIZE } from "@/lib/ui";
import { FORMATIONS, type FormationSlot } from "@/lib/formations";
import { ArrowLeft, Plus, Users, Pencil, Trash2, Pencil as PencilIcon, Check, Trophy, X as XIcon, Target, Shield, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { Match, Player } from "@/lib/types";
import { wlLabel } from "@/lib/types";

export const Route = createFileRoute("/weekend-leagues/$wlId")({
  head: () => ({
    meta: [
      { title: "WL Detail — WL Tracker" },
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
  const [matchOpen, setMatchOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSeen, setReportSeen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [squadExpanded, setSquadExpanded] = useState(false);

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

      <div className="surface-glow p-5 sm:p-8 mb-6">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">Weekend League · #{wl.number}</div>
          {editingName ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                placeholder="Custom name..."
                className="bg-input border border-border rounded-md px-3 py-2 font-display text-2xl focus:outline-none focus:ring-2 focus:ring-primary min-w-0 flex-1 max-w-md"
              />
              <button onClick={saveName} className="p-2 rounded-md bg-primary text-primary-foreground"><Check className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-5xl leading-none truncate">{label}</h1>
              <button
                onClick={() => { setNameDraft(wl.customName ?? ""); setEditingName(true); }}
                className="p-1.5 text-muted-foreground hover:text-primary"
                aria-label="Edit WL name"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>{record?.played}/15 matches</span>
            <RankBadge rank={rankFromWins(record?.wins ?? 0)} size="sm" />
            {wl.formation && (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground text-[10px] font-bold uppercase tracking-wider">
                {wl.formation}
              </span>
            )}
          </div>
        </div>

        {/* Big W-L record */}
        <div className="mt-6 flex items-end gap-4 sm:gap-6">
          <div className="flex items-baseline gap-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <span className="font-display text-6xl sm:text-7xl stat-num leading-none text-foreground">{record?.wins ?? 0}</span>
          </div>
          <span className="font-display text-4xl sm:text-5xl text-muted-foreground/50 leading-none pb-1">–</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl sm:text-7xl stat-num leading-none text-foreground">{record?.losses ?? 0}</span>
            <XIcon className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Record</div>
            <div className="text-xs text-muted-foreground mt-1">Wins · Losses</div>
          </div>
        </div>

        {/* Goals row + GD badge */}
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-5">
          <IconStat icon={<Target className="h-5 w-5" />} value={record?.goalsFor ?? 0} label="Scored" tone="primary" />
          <IconStat icon={<Shield className="h-5 w-5" />} value={record?.goalsAgainst ?? 0} label="Conceded" tone="muted" />
          <GDStat value={(record?.goalsFor ?? 0) - (record?.goalsAgainst ?? 0)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setSquadOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border bg-secondary/60 text-foreground font-semibold uppercase tracking-wider text-sm hover:bg-secondary"
        >
          <Users className="h-4 w-4" /> {squad.length ? "Edit Squad" : "Add Squad"}
        </button>
        <button
          onClick={() => { setEditingMatch(null); setMatchOpen(true); }}
          disabled={squad.length === 0 || matches.length >= 15}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[var(--shadow-neon)]"
        >
          <Plus className="h-4 w-4" /> Add Match {nextMatchIndex <= 15 && `· ${nextMatchIndex}/15`}
        </button>
        {matches.length >= 15 && (
          <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-primary/50 text-primary font-semibold uppercase tracking-wider text-sm hover:bg-primary/10">
            View Report
          </button>
        )}
      </div>

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
                  <span className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[9px] font-bold uppercase tracking-wider ml-1">
                    {wl.formation}
                  </span>
                )}
                {wl.startingAssignments && (
                  <span className="text-[10px] text-muted-foreground font-mono ml-auto sm:ml-2 shrink-0">
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
                            <div className="text-[9px] uppercase tracking-[0.25em] text-amber-300 font-bold">Weekly MVP</div>
                            <div className="text-xs font-semibold truncate">{mvpLeader.player.name}</div>
                          </div>
                          <div className="font-display stat-num text-amber-300 text-lg">{mvpLeader.mvpCount}</div>
                        </div>
                      )}
                      {csLeader && (
                        <div className="rounded-md border border-sky-400/40 bg-sky-500/10 px-3 py-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-sky-300 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] uppercase tracking-[0.25em] text-sky-300 font-bold">Clean Sheets Leader</div>
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
                    />
                    <BenchList
                      benchIds={wl.benchPlayerIds ?? []}
                      players={players}
                    />
                  </>
                ) : (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    No formation set. Open <span className="text-foreground font-semibold">Edit Squad</span> to pick one.
                  </div>
                )}

                <details className="group">
                  <summary className="cursor-pointer text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold py-1 hover:text-foreground select-none flex items-center gap-1">
                    <ChevronDown className="h-3 w-3 group-open:rotate-180 transition-transform" />
                    Per-player stats
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mt-2">
                    {squadAggs.map((a) => (
                      <div key={a.player.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/50 border border-border/60">
                        <span className="font-display text-base text-foreground stat-num w-7 text-center shrink-0 leading-none">{a.player.overall}</span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0 w-9 text-center">{a.player.position}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold truncate leading-tight">{a.player.name}</div>
                          <div className="text-[9px] text-muted-foreground font-mono leading-tight">
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

      {matches.length > 0 && (
        <section className="mb-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-2xl tracking-wider">Timeline</h2>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Tap to jump</span>
          </div>
          <MatchTimeline
            matches={matches}
            players={players}
            onJump={(m) => setViewingMatch(m)}
          />
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-2xl tracking-wider">Matches ({matches.length})</h2>
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Tap to edit</span>
        </div>
        {matches.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground text-sm">
            No matches yet.
          </div>
        ) : (
          <div className="surface-card overflow-hidden divide-y divide-border/60">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[2rem_7rem_2.5rem_1fr_2.5rem_2.5rem_3.5rem] items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold bg-background/40">
              <span>#</span>
              <span className="text-center">Versus</span>
              <span>Plat</span>
              <span>Tags</span>
              <span className="text-right">G</span>
              <span className="text-right">A</span>
              <span className="text-right pr-1">Act</span>
            </div>
            {matches.map((m) => {
              const win = matchIsWin(m);
              const totalG = m.performances.reduce((s, p) => s + (p.goals || 0), 0);
              const totalA = m.performances.reduce((s, p) => s + (p.assists || 0), 0);
              return (
                <div
                  key={m.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setViewingMatch(m)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewingMatch(m); } }}
                  className={`grid grid-cols-[2rem_7rem_2.5rem_1fr_2.5rem_2.5rem_3.5rem] items-center gap-2 px-3 py-2 border-l-4 hover:bg-secondary/30 cursor-pointer transition ${win ? "border-l-primary" : "border-l-destructive"}`}
                  aria-label={`View match ${m.index} details`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    M{m.index}
                  </span>
                  <div className="flex items-center justify-center gap-1.5 leading-none">
                    <ClubCrest size={CREST_SIZE.list} />
                    <span className="font-display stat-num text-sm">
                      <span className="text-foreground">{m.scoreFor}</span>
                      <span className="text-muted-foreground/50 mx-0.5">–</span>
                      <span className={!win ? "text-destructive" : "text-foreground"}>{m.scoreAgainst}</span>
                    </span>
                    <OpponentCrest id={m.opponentCrestId} size={CREST_SIZE.list} />
                  </div>
                  <div className="flex justify-center">
                    <PlatformBadge platform={m.platform} size="xs" />
                  </div>
                  <div className="flex items-center gap-1 flex-wrap min-w-0">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${win ? "text-primary" : "text-destructive"}`}>
                      {win ? "W" : "L"}
                    </span>
                    {m.extraTime && <Tag tone="warn">ET</Tag>}
                    {m.penalties && <Tag tone="info">PEN{m.penaltyWinner === "us" ? "✓" : "✗"}</Tag>}
                    {m.rageQuit && <Tag tone="rq">RQ</Tag>}
                  </div>
                  <span className="font-mono stat-num text-xs text-right text-foreground">
                    {totalG}<span className="text-muted-foreground text-[8px] ml-0.5">G</span>
                  </span>
                  <span className="font-mono stat-num text-xs text-right text-foreground">
                    {totalA}<span className="text-muted-foreground text-[8px] ml-0.5">A</span>
                  </span>
                  <div className="flex justify-end gap-0.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingMatch(m); setMatchOpen(true); }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm("Delete this match?")) { store.deleteMatch(m.id); toast.success("Deleted"); } }}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {squadOpen && (
        <SquadDialog
          wl={wl}
          allPlayers={players}
          onClose={() => setSquadOpen(false)}
        />
      )}
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
        <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mt-1 font-semibold">{label}</div>
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
        <div className="text-[9px] uppercase tracking-[0.25em] mt-1 font-bold text-foreground/80">GD</div>
      </div>
    </div>
  );
}


function Tag({ children, tone }: { children: React.ReactNode; tone: "warn" | "info" | "rq" }) {
  const cls =
    tone === "warn" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
    tone === "info" ? "bg-sky-500/20 text-sky-300 border-sky-500/40" :
    "bg-destructive/20 text-destructive border-destructive/40";
  return (
    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
      {children}
    </span>
  );
}

function LineupPitch({
  formation,
  assignments,
  players,
}: {
  formation: keyof typeof FORMATIONS;
  assignments: Record<string, string>;
  players: Player[];
}) {
  const slots: FormationSlot[] = FORMATIONS[formation].slots;
  const playersById = new Map(players.map((p) => [p.id, p]));
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2">
        Starting XI · {formation}
      </div>
      <div
        className="relative w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-emerald-700/40"
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
                <PlayerCard name={p.name} overall={p.overall} position={p.position} rarity={p.rarity} size="xs" />
              ) : (
                <div className="h-9 w-9 rounded-full border-2 border-dashed border-white/60 bg-black/30 grid place-items-center">
                  <span className="text-[9px] font-bold text-white tracking-wider">{slot.position}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BenchList({ benchIds, players }: { benchIds: string[]; players: Player[] }) {
  const playersById = new Map(players.map((p) => [p.id, p]));
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-2">
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
              <div key={id} className="surface-card px-2 py-1.5 flex items-center gap-2">
                <span className="font-display text-base text-foreground stat-num w-7 text-center shrink-0 leading-none">{p.overall}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0 w-9 text-center">{p.position}</span>
                <div className="text-[11px] font-semibold truncate flex-1 leading-tight">{p.name}</div>
              </div>
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
  return (
    <div className="surface-card p-3 overflow-x-auto">
      <ol className="flex items-stretch gap-2 min-w-max">
        {matches.map((m, i) => {
          const win = matchIsWin(m);
          const totalG = m.performances.reduce((s, p) => s + (p.goals || 0), 0);
          const totalA = m.performances.reduce((s, p) => s + (p.assists || 0), 0);
          const topScorer = [...m.performances]
            .filter((p) => p.goals > 0)
            .sort((a, b) => b.goals - a.goals)[0];
          const topName = topScorer ? playersById.get(topScorer.playerId)?.name : null;
          return (
            <li key={m.id} className="flex items-center gap-2">
              <button
                onClick={() => onJump(m)}
                className={`relative w-32 shrink-0 rounded-md border bg-background/50 p-2 text-left transition hover:bg-secondary/40 ${
                  win
                    ? "border-primary/50 shadow-[0_0_14px_-8px_var(--primary)]"
                    : "border-destructive/50"
                }`}
                aria-label={`Jump to match ${m.index}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                    M{m.index}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${win ? "text-primary" : "text-destructive"}`}>
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
                  {m.extraTime && <Tag tone="warn">ET</Tag>}
                  {m.penalties && <Tag tone="info">PEN{m.penaltyWinner === "us" ? "✓" : "✗"}</Tag>}
                  {m.rageQuit && <Tag tone="rq">RQ</Tag>}
                </div>
                <div className="mt-1.5 text-[9px] font-mono text-muted-foreground text-center tabular-nums">
                  {totalG}G · {totalA}A
                </div>
                {topName && (
                  <div className="mt-0.5 text-[9px] text-muted-foreground text-center truncate" title={topName}>
                    ★ {topName}
                  </div>
                )}
              </button>
              {i < matches.length - 1 && (
                <div className="h-px w-3 bg-border shrink-0" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
