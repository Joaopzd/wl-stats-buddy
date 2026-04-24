import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs, store } from "@/lib/store";
import { aggregatePlayer, bestStreak, rankFromWins, wlRecord } from "@/lib/stats";
import { PlayerCard } from "@/components/PlayerCard";
import { SquadDialog } from "@/components/SquadDialog";
import { MatchDialog } from "@/components/MatchDialog";
import { ReportModal } from "@/components/ReportModal";
import { ArrowLeft, Plus, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Match } from "@/lib/types";

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

  // Auto-open report when 15 matches reached
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

  return (
    <AppShell>
      <Link to="/weekend-leagues" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> All Weekend Leagues
      </Link>

      <div className="surface-glow p-6 sm:p-8 mb-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold">Weekend League</div>
          <div className="font-display text-6xl mt-1 leading-none">#{wl.number}</div>
          <div className="mt-2 text-sm text-muted-foreground">{record?.played}/15 matches · {rankFromWins(record?.wins ?? 0)}</div>
        </div>
        <div className="flex items-center gap-5 flex-wrap">
          <Stat label="Wins" value={record?.wins ?? 0} accent />
          <Stat label="Losses" value={record?.losses ?? 0} danger />
          <Stat label="GF" value={record?.goalsFor ?? 0} />
          <Stat label="GA" value={record?.goalsAgainst ?? 0} />
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
              const win = m.scoreFor > m.scoreAgainst;
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
                  <div className={`mt-1 text-xs font-semibold uppercase tracking-wider ${win ? "text-primary" : "text-destructive"}`}>{win ? "Win" : "Loss"}</div>
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
