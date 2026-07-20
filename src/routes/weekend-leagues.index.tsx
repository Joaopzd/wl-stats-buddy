import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, store, usePlayers, useClubName, useClubCrest, useWLs } from "@/lib/store";
import { wlRecord, rankFromWins, matchIsWin, aggregatePlayer } from "@/lib/stats";
import { wlLabel, type WeekendLeague } from "@/lib/types";
import { Plus, Trophy, Trash2, ClipboardList, GitCompareArrows, Pencil, X, ChevronRight } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { CoachBriefingDialog } from "@/components/CoachBriefingDialog";
import { LeagueWatermark } from "@/components/LeagueWatermark";
import { WatermarkPicker } from "@/components/WatermarkPicker";
import { ClubCrest } from "@/components/ClubCrest";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";

export const Route = createFileRoute("/weekend-leagues/")({
  head: () => ({
    meta: [
      { title: "Weekend Leagues — PitchSide" },
      { name: "description", content: "All your EA FC 26 Weekend League sessions and records." },
      { property: "og:title", content: "Weekend Leagues" },
      { property: "og:description", content: "Browse, create and analyze every WL session." },
    ],
  }),
  component: WLList,
});

function WLList() {
  const wls = useWLs();
  const matches = useMatches();
  const players = usePlayers();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [wmId, setWmId] = useState<string | undefined>(undefined);
  const [wmColor, setWmColor] = useState<string | undefined>(undefined);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [editingWL, setEditingWL] = useState<WeekendLeague | null>(null);

  const sorted = useMemo(() => [...wls].sort((a, b) => b.number - a.number), [wls]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = sorted.find((w) => w.id === selectedId) ?? sorted[0] ?? null;

  const nextNum = (Math.max(0, ...wls.map((w) => w.number)) + 1).toString();

  const create = () => {
    const parsed = parseInt(num || nextNum, 10);
    if (!parsed || parsed < 1) return toast.error("Enter a valid WL number");
    if (wls.some((w) => w.number === parsed)) return toast.error(`WL #${parsed} already exists`);
    store.addWL({
      id: uuid(),
      number: parsed,
      customName: name.trim() || undefined,
      squadPlayerIds: [],
      watermarkId: wmId,
      watermarkColor: wmColor,
      createdAt: Date.now(),
    });
    setCreating(false);
    setNum("");
    setName("");
    setWmId(undefined);
    setWmColor(undefined);
    toast.success(`${name.trim() || `WL #${parsed}`} created`);
  };

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wider">Weekend Leagues</h1>
          <p className="text-xs text-muted-foreground mt-1">{wls.length} sessions logged</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/weekend-leagues/compare" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/50 text-foreground font-semibold uppercase tracking-wider text-xs hover:bg-secondary transition">
            <GitCompareArrows className="h-3.5 w-3.5 text-primary" /> Compare
          </Link>
          <button onClick={() => setBriefingOpen(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/50 text-foreground font-semibold uppercase tracking-wider text-xs hover:bg-secondary transition">
            <ClipboardList className="h-3.5 w-3.5 text-primary" /> Briefing
          </button>
          <button onClick={() => { setNum(nextNum); setName(""); setCreating(true); }} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs hover:opacity-90 transition shadow-[var(--shadow-neon)]">
            <Plus className="h-3.5 w-3.5" /> New WL
          </button>
        </div>
      </div>

      <CoachBriefingDialog
        open={briefingOpen}
        onOpenChange={setBriefingOpen}
        wls={wls}
        matches={matches}
        players={players}
      />

      {creating && (
        <div className="surface-glow p-5 mb-6 space-y-4">
          <div className="grid sm:grid-cols-[140px_1fr] gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">WL Number</label>
              <input
                type="number"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                autoFocus
                className="w-full bg-input border border-border rounded-md px-3 py-2 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Custom Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. TOTS Premiere WL"
                className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <WatermarkPicker markId={wmId} color={wmColor} onMarkChange={setWmId} onColorChange={setWmColor} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
            <button onClick={create} className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90">Create</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No Weekend Leagues yet. Create your first to start tracking.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Compact list */}
          <div className="surface-card overflow-hidden">
            <div className="divide-y divide-border/50">
              {sorted.map((wl) => {
                const r = wlRecord(wl, matches);
                const label = wlLabel(wl);
                const isSel = selected?.id === wl.id;
                const wlMatches = matches.filter((m) => m.wlId === wl.id).sort((a, b) => a.index - b.index);
                const form = wlMatches.slice(-5);
                return (
                  <button
                    key={wl.id}
                    type="button"
                    onClick={() => setSelectedId(wl.id)}
                    onDoubleClick={() => navigate({ to: "/weekend-leagues/$wlId", params: { wlId: wl.id } })}
                    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all duration-200 ${
                      isSel ? "bg-secondary/70" : "hover:bg-secondary/40"
                    }`}
                  >
                    <div className={`h-10 w-12 rounded-md grid place-items-center shrink-0 border ${isSel ? "border-primary/60 bg-primary/10" : "border-border/60 bg-background/40"}`}>
                      <span className="font-display stat-num text-sm leading-none">#{wl.number}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <ClubCrest size={12} overrideUrl={wl.clubCrestUrl} />
                        <span className="truncate">{wl.clubName || "Weekend League"}</span>
                      </div>
                      <div className="font-semibold text-sm truncate leading-tight flex items-center gap-1.5">
                        <span className="truncate">{label}</span>
                        {!wl.closed && r.played < 15 ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> In Progress
                          </span>
                        ) : r.played >= 15 || wl.closed ? (
                          <span className="shrink-0 inline-flex items-center text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                            Closed
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex items-center gap-1">
                        {form.map((m, i) => {
                          const win = matchIsWin(m);
                          return (
                            <span
                              key={i}
                              className={`h-1.5 w-4 rounded-sm ${win ? "bg-primary" : "bg-destructive/70"}`}
                              aria-hidden
                            />
                          );
                        })}
                        {form.length === 0 && <span className="text-[10px] text-muted-foreground">no matches</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 leading-tight">
                      <div className="font-display stat-num text-lg">
                        <span className="text-foreground">{r.wins}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="text-destructive">{r.losses}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">{r.played}/15</div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingWL(wl); }}
                        className="p-1.5 rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition"
                        aria-label="Edit WL"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${label} and all its matches?`)) { store.deleteWL(wl.id); toast.success("Deleted"); } }}
                        className="p-1.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview panel */}
          {selected && (
            <div className="hidden lg:block">
              <WLPreview wl={selected} matches={matches} players={players} />
            </div>
          )}
        </div>
      )}

      {editingWL && (
        <WLEditModal wl={editingWL} onClose={() => setEditingWL(null)} />
      )}
    </AppShell>
  );
}

function WLPreview({ wl, matches, players }: { wl: WeekendLeague; matches: ReturnType<typeof useMatches>; players: ReturnType<typeof usePlayers> }) {
  const wlMatches = useMemo(
    () => matches.filter((m) => m.wlId === wl.id).sort((a, b) => a.index - b.index),
    [matches, wl.id],
  );
  const r = wlRecord(wl, matches);
  const label = wlLabel(wl);
  const gd = r.goalsFor - r.goalsAgainst;

  const topScorer = useMemo(() => {
    const squad = players.filter((p) => wl.squadPlayerIds.includes(p.id));
    const aggs = squad
      .map((p) => aggregatePlayer(p, wlMatches))
      .filter((a) => a.goals > 0)
      .sort((a, b) => b.goals - a.goals || b.ga - a.ga);
    return aggs[0] ?? null;
  }, [players, wl.squadPlayerIds, wlMatches]);

  return (
    <div className="surface-glow p-5 relative overflow-hidden sticky top-4">
      <LeagueWatermark title={label} markId={wl.watermarkId} color={wl.watermarkColor} size={160} />
      <div className="relative z-10">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold flex items-center gap-1.5">
          <ClubCrest size={14} overrideUrl={wl.clubCrestUrl} />
          <span className="truncate">{wl.clubName || "Weekend League"}</span>
        </div>
        <div className="font-display text-2xl leading-tight mt-1 truncate">{label}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">WL #{wl.number}</div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="font-display stat-num text-4xl leading-none">
              <span className="text-foreground">{r.wins}</span>
              <span className="text-muted-foreground/40 mx-1.5">·</span>
              <span className="text-destructive">{r.losses}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{r.played}/15 played</div>
          </div>
          <RankBadge rank={rankFromWins(r.wins)} size="sm" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-border/60 bg-background/50 py-2">
            <div className="font-display stat-num text-lg text-foreground leading-none">{r.goalsFor}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">GF</div>
          </div>
          <div className="rounded-md border border-border/60 bg-background/50 py-2">
            <div className="font-display stat-num text-lg text-foreground leading-none">{r.goalsAgainst}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">GA</div>
          </div>
          <div className={`rounded-md border py-2 ${gd >= 0 ? "border-primary/40 bg-primary/5" : "border-destructive/40 bg-destructive/5"}`}>
            <div className={`font-display stat-num text-lg leading-none ${gd >= 0 ? "text-primary" : "text-destructive"}`}>
              {gd >= 0 ? "+" : ""}{gd}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">GD</div>
          </div>
        </div>

        {wlMatches.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-1.5">Form</div>
            <div className="flex flex-wrap gap-1">
              {wlMatches.map((m, i) => {
                const win = matchIsWin(m);
                return (
                  <span
                    key={i}
                    title={`M${m.index}: ${m.scoreFor}-${m.scoreAgainst}`}
                    className={`h-5 w-5 grid place-items-center rounded text-[10px] font-bold ${
                      win ? "bg-primary/20 text-primary border border-primary/40" : "bg-destructive/20 text-destructive border border-destructive/40"
                    }`}
                  >
                    {win ? "W" : "L"}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {topScorer && (
          <div className="mt-4 rounded-md border border-border/60 bg-background/50 p-3">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Top Scorer</div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{topScorer.player.name}</div>
                <div className="text-[11px] text-muted-foreground font-mono">{topScorer.matches}MP · {topScorer.assists}A</div>
              </div>
              <div className="font-display stat-num text-2xl text-primary leading-none">{topScorer.goals}<span className="text-xs text-muted-foreground ml-0.5">G</span></div>
            </div>
          </div>
        )}

        <Link
          to="/weekend-leagues/$wlId"
          params={{ wlId: wl.id }}
          className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-xs hover:opacity-90 transition shadow-[var(--shadow-neon)]"
        >
          Open WL <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function WLEditModal({ wl, onClose }: { wl: WeekendLeague; onClose: () => void }) {
  const currentName = useClubName();
  const currentCrest = useClubCrest();
  const [name, setName] = useState(wl.customName ?? "");
  const [applyCurrent, setApplyCurrent] = useState(false);
  const [wmId, setWmId] = useState<string | undefined>(wl.watermarkId);
  const [wmColor, setWmColor] = useState<string | undefined>(wl.watermarkColor);

  const save = () => {
    const patch: Partial<WeekendLeague> = {
      customName: name.trim() || undefined,
      watermarkId: wmId,
      watermarkColor: wmColor,
    };
    if (applyCurrent) {
      patch.clubName = currentName || undefined;
      patch.clubCrestUrl = currentCrest ?? null;
    }
    store.updateWL(wl.id, patch);
    toast.success("WL updated");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-glow w-full max-w-md rounded-lg overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl tracking-wider">Edit WL #{wl.number}</h2>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{wlLabel(wl)}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Custom Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`WL #${wl.number}`}
              maxLength={48}
              className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground mt-1">Leave empty to use the default <span className="font-mono">WL #{wl.number}</span>.</p>
          </div>

          <div className="surface-card p-3">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Club identity snapshot</div>
            <div className="flex items-center gap-2.5 mb-3">
              <ClubCrest size={28} overrideUrl={wl.clubCrestUrl} />
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Currently saved</div>
                <div className="font-display text-sm truncate">{wl.clubName || "Unnamed"}</div>
              </div>
            </div>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={applyCurrent}
                onChange={(e) => setApplyCurrent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              />
              <span className="text-xs leading-snug">
                Apply current club identity:{" "}
                <span className="text-foreground font-semibold">{currentName || "Unnamed"}</span>{" "}
                <span className="text-muted-foreground">(escudo atual)</span>
              </span>
            </label>
          </div>

          <div className="surface-card p-3">
            <WatermarkPicker markId={wmId} color={wmColor} onMarkChange={setWmId} onColorChange={setWmColor} />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border/60 flex gap-2">
          <button onClick={save} className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90">
            Save
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
