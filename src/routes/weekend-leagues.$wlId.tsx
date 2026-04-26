import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, bestStreak, matchIsWin, rankFromWins, wlRecord } from "@/lib/stats";
import { PlayerCard } from "@/components/PlayerCard";
import { SquadDialog } from "@/components/SquadDialog";
import { MatchDialog } from "@/components/MatchDialog";
import { ReportModal } from "@/components/ReportModal";
import { ArrowLeft, Plus, Users, Pencil, Trash2, Pencil as PencilIcon, Check, Trophy, X as XIcon, Target, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Match } from "@/lib/types";
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSeen, setReportSeen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

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
            <span>{record?.played}/15 matches · {rankFromWins(record?.wins ?? 0)}</span>
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
            <span className="font-display text-6xl sm:text-7xl stat-num leading-none text-primary">{record?.wins ?? 0}</span>
          </div>
          <span className="font-display text-4xl sm:text-5xl text-muted-foreground/50 leading-none pb-1">–</span>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-6xl sm:text-7xl stat-num leading-none text-destructive">{record?.losses ?? 0}</span>
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

      <section className="mb-10">
        <h2 className="font-display text-2xl tracking-wider mb-4">Squad ({squad.length})</h2>
        {squad.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground text-sm">
            No squad yet. Click <span className="text-foreground font-semibold">Add Squad</span> to pull players from your database.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {squadAggs.map((a) => (
              <div key={a.player.id} className="surface-card p-3 flex gap-3 items-center">
                <PlayerCard name={a.player.name} overall={a.player.overall} position={a.player.position} rarity={a.player.rarity} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{a.player.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.player.position} · {a.player.overall}</div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px]">
                    <Mini label="MP" v={a.matches} />
                    <Mini label="G" v={a.goals} highlight />
                    <Mini label="A" v={a.assists} />
                    <Mini label="Rt" v={a.avgRating} fixed={2} highlight={a.avgRating >= 8} dim={a.avgRating === 0} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wider mb-4">Matches ({matches.length})</h2>
        {matches.length === 0 ? (
          <div className="surface-card p-8 text-center text-muted-foreground text-sm">
            No matches yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches.map((m) => {
              const win = matchIsWin(m);
              return (
                <div key={m.id} className={`surface-card p-4 border-l-4 ${win ? "border-l-primary" : "border-l-destructive"}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Match {m.index} · {m.platform}</div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingMatch(m); setMatchOpen(true); }} className="p-1 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { if (confirm("Delete this match?")) { store.deleteMatch(m.id); toast.success("Deleted"); } }} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="font-display text-4xl mt-2 stat-num">
                    <span className={win ? "text-primary" : ""}>{m.scoreFor}</span>
                    <span className="text-muted-foreground/50 mx-2">–</span>
                    <span className={!win ? "text-destructive" : ""}>{m.scoreAgainst}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className={`text-xs font-semibold uppercase tracking-wider ${win ? "text-primary" : "text-destructive"}`}>{win ? "Win" : "Loss"}</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {m.extraTime && <Tag tone="warn">ET</Tag>}
                      {m.penalties && <Tag tone="info">PEN {m.penaltyWinner === "us" ? "✓" : "✗"}</Tag>}
                      {m.rageQuit && <Tag tone="rq">RQ</Tag>}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground">
                    {m.performances.filter(p => p.goals > 0 || p.assists > 0).slice(0, 3).map((p) => {
                      const player = players.find(pl => pl.id === p.playerId);
                      return player ? <div key={p.playerId}>⚽ {player.name.split(" ").slice(-1)[0]}: {p.goals}G {p.assists}A</div> : null;
                    })}
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

function Stat({ label, value, accent, danger }: { label: string; value: number; accent?: boolean; danger?: boolean }) {
  return (
    <div className="text-center">
      <div className={`stat-num text-4xl font-display ${accent ? "text-primary" : danger ? "text-destructive" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function GDStat({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <div className={`text-center px-4 py-2 rounded-lg border ${positive ? "border-primary/40 bg-primary/10" : "border-destructive/40 bg-destructive/10"}`}>
      <div className={`stat-num text-4xl font-display ${positive ? "text-primary" : "text-destructive"}`}>
        {positive ? "+" : ""}{value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">GD</div>
    </div>
  );
}

function Mini({ label, v, highlight, fixed, dim }: { label: string; v: number; highlight?: boolean; fixed?: number; dim?: boolean }) {
  const display = dim ? "—" : fixed != null ? v.toFixed(fixed) : v;
  return (
    <div className="bg-background/60 rounded px-1.5 py-1 text-center">
      <div className="text-muted-foreground/70 text-[8px] uppercase tracking-wider">{label}</div>
      <div className={`stat-num font-semibold ${dim ? "text-muted-foreground/60" : highlight ? "text-primary" : ""}`}>{display}</div>
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
