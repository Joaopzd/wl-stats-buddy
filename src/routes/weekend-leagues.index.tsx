import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, useWLs, store, usePlayers } from "@/lib/store";
import { wlRecord, rankFromWins } from "@/lib/stats";
import { wlLabel } from "@/lib/types";
import { Plus, ChevronRight, Trophy, Trash2, ClipboardList, GitCompareArrows } from "lucide-react";
import { RankBadge } from "@/components/RankBadge";
import { CoachBriefingDialog } from "@/components/CoachBriefingDialog";
import { LeagueWatermark } from "@/components/LeagueWatermark";
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
                <button
                  onClick={(e) => { e.preventDefault(); if (confirm(`Delete ${label} and all its matches?`)) { store.deleteWL(wl.id); toast.success("Deleted"); } }}
                  className="absolute top-3 right-3 z-20 p-1.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <div className="relative z-10">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Weekend League</div>
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
    </AppShell>
  );
}
