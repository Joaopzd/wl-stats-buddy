import { useState, useMemo } from "react";
import { X, Search, ChevronLeft } from "lucide-react";
import { store } from "@/lib/store";
import type { Player, WeekendLeague } from "@/lib/types";
import { FORMATIONS, FORMATION_NAMES, positionFits, type FormationName, type FormationSlot } from "@/lib/formations";
import { PlayerCard } from "./PlayerCard";
import { toast } from "sonner";

type Step = "formation" | "pitch";

export function SquadDialog({
  wl,
  allPlayers,
  onClose,
}: {
  wl: WeekendLeague;
  allPlayers: Player[];
  onClose: () => void;
}) {
  const [formation, setFormation] = useState<FormationName>(wl.formation ?? "4-3-3");
  const [step, setStep] = useState<Step>(wl.formation ? "pitch" : "formation");
  const [assignments, setAssignments] = useState<Record<string, string>>(wl.startingAssignments ?? {});
  const [bench, setBench] = useState<string[]>(wl.benchPlayerIds ?? []);
  const [pickingSlot, setPickingSlot] = useState<FormationSlot | null>(null);
  const [pickingBench, setPickingBench] = useState(false);
  const [search, setSearch] = useState("");

  const slots = FORMATIONS[formation].slots;
  const startingIds = useMemo(() => new Set(Object.values(assignments)), [assignments]);
  const startingCount = startingIds.size;

  const playersById = useMemo(() => new Map(allPlayers.map((p) => [p.id, p])), [allPlayers]);

  const handlePickFormation = (f: FormationName) => {
    if (f !== formation) {
      // Reset assignments if formation changes (slot ids differ)
      setAssignments({});
    }
    setFormation(f);
    setStep("pitch");
  };

  const assignSlot = (playerId: string) => {
    if (!pickingSlot) return;
    setAssignments((s) => {
      const next = { ...s };
      // Remove player from any other slot first
      for (const [k, v] of Object.entries(next)) {
        if (v === playerId) delete next[k];
      }
      next[pickingSlot.id] = playerId;
      return next;
    });
    // Also remove from bench if present
    setBench((b) => b.filter((id) => id !== playerId));
    setPickingSlot(null);
    setSearch("");
  };

  const clearSlot = (slotId: string) => {
    setAssignments((s) => {
      const next = { ...s };
      delete next[slotId];
      return next;
    });
  };

  const addToBench = (playerId: string) => {
    if (startingIds.has(playerId)) {
      toast.error("Already in starting 11");
      return;
    }
    setBench((b) => (b.includes(playerId) ? b : [...b, playerId]));
    setPickingBench(false);
    setSearch("");
  };

  const removeFromBench = (playerId: string) => {
    setBench((b) => b.filter((id) => id !== playerId));
  };

  const save = () => {
    if (startingCount !== 11) {
      toast.error(`Starting 11 incomplete (${startingCount}/11)`);
      return;
    }
    const squadPlayerIds = Array.from(new Set([...Object.values(assignments), ...bench]));
    store.updateWL(wl.id, {
      squadPlayerIds,
      formation,
      startingAssignments: assignments,
      benchPlayerIds: bench,
    });
    toast.success(`Squad saved · ${formation} · ${startingCount + bench.length} players`);
    onClose();
  };

  // ============ FORMATION STEP ============
  if (step === "formation") {
    return (
      <Shell onClose={onClose} title={`Pick Formation — WL #${wl.number}`} subtitle="Choose your tactical setup">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pb-2">
          {FORMATION_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => handlePickFormation(name)}
              className={`group surface-card p-4 text-left transition hover:border-primary/60 ${
                formation === name ? "border-primary shadow-[var(--shadow-glow)]" : ""
              }`}
            >
              <div className="font-display text-3xl tracking-wider text-primary">{name}</div>
              <MiniPitch slots={FORMATIONS[name].slots} />
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-5 pt-5 border-t border-border/60">
          <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
      </Shell>
    );
  }

  // ============ PLAYER PICKER OVERLAY ============
  if (pickingSlot || pickingBench) {
    const filterPos = pickingSlot?.position;
    const candidates = allPlayers.filter((p) => {
      if (pickingSlot && !positionFits(p.position, pickingSlot.position)) return false;
      if (!pickingSlot && startingIds.has(p.id)) return false; // bench: skip starters
      if (pickingSlot) {
        // Allow swapping; show all that fit
      }
      if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    return (
      <Shell
        onClose={() => { setPickingSlot(null); setPickingBench(false); setSearch(""); }}
        title={pickingSlot ? `Assign ${pickingSlot.position}` : "Add to Bench"}
        subtitle={pickingSlot ? `Slot ${pickingSlot.id}` : `${bench.length} on the bench`}
      >
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={filterPos ? `Search ${filterPos}-compatible players...` : "Search your database..."}
            className="w-full bg-input border-2 border-primary/40 rounded-md pl-11 pr-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            {candidates.length} match{candidates.length === 1 ? "" : "es"}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {candidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No players match.</div>
          ) : (
            <div className="space-y-1">
              {candidates.map((p) => {
                const inStarting = startingIds.has(p.id);
                const inBench = bench.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => (pickingSlot ? assignSlot(p.id) : addToBench(p.id))}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-card text-left transition hover:border-primary hover:bg-primary/5"
                  >
                    <span className="font-display text-xl text-primary stat-num w-9 text-center shrink-0">{p.overall}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0 w-12 text-center">{p.position}</span>
                    <span className="font-semibold truncate flex-1">{p.name}</span>
                    {(inStarting || inBench) && (
                      <span className="text-[11px] uppercase tracking-wider text-primary font-bold shrink-0">
                        {inStarting ? "Starting" : "Bench"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-border/60">
          <button onClick={() => { setPickingSlot(null); setPickingBench(false); setSearch(""); }} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">
            Cancel
          </button>
        </div>
      </Shell>
    );
  }

  // ============ PITCH STEP ============
  return (
    <Shell
      onClose={onClose}
      title={`Squad — WL #${wl.number}`}
      subtitle={`${formation} · ${startingCount}/11 starting · ${bench.length} bench`}
      onBack={() => setStep("formation")}
    >
      <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-5">
        {/* Pitch */}
        <Pitch slots={slots} assignments={assignments} playersById={playersById}
          onSlotClick={(s) => setPickingSlot(s)}
          onSlotClear={clearSlot}
        />

        {/* Bench */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Bench ({bench.length})</div>
            <button onClick={() => setPickingBench(true)} className="text-[11px] uppercase tracking-wider text-primary hover:opacity-80 font-bold">
              + Add to bench
            </button>
          </div>
          {bench.length === 0 ? (
            <div className="surface-card p-4 text-center text-muted-foreground text-xs">Empty bench</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {bench.map((id) => {
                const p = playersById.get(id);
                if (!p) return null;
                return (
                  <div key={id} className="surface-card px-2 py-1.5 flex items-center gap-2">
                    <span className="font-display text-base text-primary stat-num w-7 text-center shrink-0 leading-none">{p.overall}</span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary px-1 py-0.5 rounded shrink-0 w-9 text-center">{p.position}</span>
                    <div className="text-[11px] font-semibold truncate flex-1 leading-tight">{p.name}</div>
                    <button onClick={() => removeFromBench(id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-5 border-t border-border/60">
        <button onClick={save} disabled={startingCount !== 11} className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
          Save Squad
        </button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
      </div>
    </Shell>
  );
}

function Shell({
  onClose, onBack, title, subtitle, children,
}: { onClose: () => void; onBack?: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="surface-glow w-full max-w-3xl max-h-[90vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            {onBack && (
              <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-2xl tracking-wider truncate">{title}</h2>
              {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Pitch({
  slots, assignments, playersById, onSlotClick, onSlotClear,
}: {
  slots: FormationSlot[];
  assignments: Record<string, string>;
  playersById: Map<string, Player>;
  onSlotClick: (s: FormationSlot) => void;
  onSlotClear: (slotId: string) => void;
}) {
  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-emerald-700/40"
      style={{
        aspectRatio: "3 / 4",
        background:
          "repeating-linear-gradient(0deg, oklch(0.32 0.06 145) 0 8%, oklch(0.36 0.06 145) 8% 16%)",
      }}
    >
      {/* Pitch markings */}
      <div className="absolute inset-1.5 border border-white/30 rounded" />
      <div className="absolute left-1/2 top-1.5 bottom-1.5 w-px bg-white/30 -translate-x-1/2" />
      <div className="absolute left-1/2 top-1/2 h-10 w-10 border border-white/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute left-1/2 top-1.5 -translate-x-1/2 w-1/2 h-7 border border-t-0 border-white/30" />
      <div className="absolute left-1/2 bottom-1.5 -translate-x-1/2 w-1/2 h-7 border border-b-0 border-white/30" />

      {slots.map((slot) => {
        const playerId = assignments[slot.id];
        const player = playerId ? playersById.get(playerId) : null;
        return (
          <div
            key={slot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <button
              onClick={() => onSlotClick(slot)}
              className={`group relative grid place-items-center transition ${
                player ? "" : "h-9 w-9 rounded-full border-2 border-dashed border-white/60 bg-black/30 hover:bg-black/50 hover:border-white"
              }`}
              title={slot.position}
            >
              {player ? (
                <div className="relative">
                  <PlayerCard name={player.name} overall={player.overall} position={player.position} rarity={player.rarity} imageUrl={player.imageUrl} size="xs" />
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onSlotClear(slot.id); }}
                    className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="h-2 w-2" />
                  </span>
                </div>
              ) : (
                <span className="text-[11px] font-bold text-white tracking-wider">{slot.position}</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MiniPitch({ slots }: { slots: FormationSlot[] }) {
  return (
    <div
      className="relative w-full mt-2 rounded border border-emerald-700/40"
      style={{ aspectRatio: "2 / 3", background: "oklch(0.34 0.06 145)" }}
    >
      <div className="absolute inset-1 border border-white/25 rounded-sm" />
      <div className="absolute left-1/2 top-1 bottom-1 w-px bg-white/25 -translate-x-1/2" />
      {slots.map((s) => (
        <span
          key={s.id}
          className="absolute h-1.5 w-1.5 rounded-full bg-primary -translate-x-1/2 -translate-y-1/2 shadow-[0_0_4px_var(--primary)]"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
        />
      ))}
    </div>
  );
}
