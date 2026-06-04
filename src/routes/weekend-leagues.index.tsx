import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, useWLs, store, usePlayers, useClubName, useClubCrest } from "@/lib/store";
import { wlRecord, rankFromWins } from "@/lib/stats";
import { wlLabel, type WeekendLeague } from "@/lib/types";
import { Plus, ChevronRight, Trophy, Trash2, ClipboardList, GitCompareArrows, Pencil, X } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { CoachBriefingDialog } from "@/components/CoachBriefingDialog";
import { LeagueWatermark } from "@/components/LeagueWatermark";
import { ClubCrest } from "@/components/ClubCrest";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";

export const Route = createFileRoute("/weekend-leagues/")({
  head: () => ({
    meta: [
      { title: "Weekend Leagues — WL Tracker" },
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
  const [creating, setCreating] = useState(false);
  const [num, setNum] = useState("");
  const [name, setName] = useState("");
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [editingWL, setEditingWL] = useState<WeekendLeague | null>(null);

  const sorted = [...wls].sort((a, b) => b.number - a.number);
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
      createdAt: Date.now(),
    });
    setCreating(false);
    setNum("");
    setName("");
    toast.success(`${name.trim() || `WL #${parsed}`} created`);
  };

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-wider">Weekend Leagues</h1>
          <p className="text-sm text-muted-foreground mt-1">{wls.length} sessions logged</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/weekend-leagues/compare" className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md border border-border bg-secondary/50 text-foreground font-semibold uppercase tracking-wider text-xs hover:bg-secondary transition">
            <GitCompareArrows className="h-4 w-4 text-primary" /> Compare WLs
          </Link>
          <button onClick={() => setBriefingOpen(true)} className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md border border-border bg-secondary/50 text-foreground font-semibold uppercase tracking-wider text-xs hover:bg-secondary transition">
            <ClipboardList className="h-4 w-4 text-primary" /> Coach's Briefing
          </button>
          <button onClick={() => { setNum(nextNum); setName(""); setCreating(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 transition shadow-[var(--shadow-neon)]">
            <Plus className="h-4 w-4" /> New WL
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
        <div className="surface-glow p-5 mb-6 grid sm:grid-cols-[140px_1fr_auto_auto] gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">WL Number</label>
            <input
              type="number"
              value={num}
              onChange={(e) => setNum(e.target.value)}
              autoFocus
              className="w-full bg-input border border-border rounded-md px-3 py-2 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Custom Name (optional)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TOTS Premiere WL"
              className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button onClick={create} className="px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm">Create</button>
          <button onClick={() => setCreating(false)} className="px-4 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="surface-card p-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No Weekend Leagues yet. Create your first to start tracking.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((wl) => {
            const r = wlRecord(wl, matches);
            const label = wlLabel(wl);
            const hasCustom = !!wl.customName?.trim();
            return (
              <Link
                key={wl.id}
                to="/weekend-leagues/$wlId"
                params={{ wlId: wl.id }}
                className="surface-card p-5 group hover:border-primary/50 hover:shadow-[var(--shadow-glow)] transition-all relative overflow-hidden"
              >
                <LeagueWatermark title={label} />
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
                  <button
                    onClick={(e) => { e.preventDefault(); setEditingWL(wl); }}
                    className="p-1.5 rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition"
                    aria-label="Edit WL"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); if (confirm(`Delete ${label} and all its matches?`)) { store.deleteWL(wl.id); toast.success("Deleted"); } }}
                    className="p-1.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
                  <ClubCrest size={14} overrideUrl={wl.clubCrestUrl} />
                  <span className="truncate">{wl.clubName || "Weekend League"}</span>
                </div>
                <div className={`font-display mt-1 leading-tight pr-6 ${hasCustom ? "text-2xl" : "text-5xl"}`}>{label}</div>
                {hasCustom && (
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">WL #{wl.number}</div>
                )}
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="stat-num text-2xl">
                      <span className="text-foreground">{r.wins}</span>
                      <span className="text-muted-foreground/50 mx-1">·</span>
                      <span className="text-destructive">{r.losses}</span>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{r.played}/15 played</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rank</div>
                    <RankBadge rank={rankFromWins(r.wins)} size="sm" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.goalsFor} GF · {r.goalsAgainst} GA</span>
                  <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {editingWL && (
        <WLEditModal wl={editingWL} onClose={() => setEditingWL(null)} />
      )}
    </AppShell>
  );
}

function WLEditModal({ wl, onClose }: { wl: WeekendLeague; onClose: () => void }) {
  const currentName = useClubName();
  const currentCrest = useClubCrest();
  const [name, setName] = useState(wl.customName ?? "");
  const [applyCurrent, setApplyCurrent] = useState(false);

  const save = () => {
    const patch: Partial<WeekendLeague> = {
      customName: name.trim() || undefined,
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
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{wlLabel(wl)}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">Custom Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`WL #${wl.number}`}
              maxLength={48}
              className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">Leave empty to use the default <span className="font-mono">WL #{wl.number}</span>.</p>
          </div>

          <div className="surface-card p-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Club identity snapshot</div>
            <div className="flex items-center gap-2.5 mb-3">
              <ClubCrest size={28} overrideUrl={wl.clubCrestUrl} />
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Currently saved</div>
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

