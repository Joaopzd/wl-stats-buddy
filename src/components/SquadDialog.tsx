import { useState } from "react";
import { X, Search } from "lucide-react";
import { store } from "@/lib/store";
import type { Player, WeekendLeague } from "@/lib/types";
import { PlayerCard } from "./PlayerCard";
import { toast } from "sonner";

export function SquadDialog({
  wl,
  allPlayers,
  onClose,
}: {
  wl: WeekendLeague;
  allPlayers: Player[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(wl.squadPlayerIds));
  const [search, setSearch] = useState("");

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const save = () => {
    store.updateWL(wl.id, { squadPlayerIds: Array.from(selected) });
    toast.success(`Squad updated · ${selected.size} players`);
    onClose();
  };

  const filtered = allPlayers.filter((p) =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="surface-glow w-full max-w-3xl max-h-[85vh] flex flex-col p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl tracking-wider">Pick Squad — WL #{wl.number}</h2>
            <p className="text-xs text-muted-foreground mt-1">{selected.size} selected</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your database..."
            className="w-full bg-input border border-border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {allPlayers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No players in your database. Add some from the Players tab first.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No matches.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filtered.map((p) => {
                const sel = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-md border text-left transition ${
                      sel
                        ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]"
                        : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
                    }`}
                  >
                    <PlayerCard name={p.name} overall={p.overall} position={p.position} rarity={p.rarity} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{p.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.position} · {p.overall} · {p.rarity}</div>
                    </div>
                    <div className={`h-5 w-5 rounded border-2 grid place-items-center ${sel ? "bg-primary border-primary" : "border-border"}`}>
                      {sel && <span className="text-primary-foreground text-xs">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-5 pt-5 border-t border-border/60">
          <button onClick={save} className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90">
            Save Squad
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
