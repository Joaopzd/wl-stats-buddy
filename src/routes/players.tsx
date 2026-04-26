import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, store } from "@/lib/store";
import { aggregatePlayer } from "@/lib/stats";
import { PlayerCard } from "@/components/PlayerCard";
import { Plus, Trash2, Pencil, X, Search } from "lucide-react";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import type { Player, Position, Rarity } from "@/lib/types";
import { rarityClass, raritySwatch } from "@/lib/format";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "Players — WL Tracker" },
      { name: "description", content: "Your EA FC 26 player database with cumulative WL stats." },
      { property: "og:title", content: "Player Database" },
      { property: "og:description", content: "All your players and their career WL stats." },
    ],
  }),
  component: PlayersPage,
});

const POSITIONS: Position[] = [
  "GK",
  "LB", "CB", "RB",
  "CDM", "CM", "LM", "RM", "CAM",
  "LW", "RW", "ST",
];

const RARITY_GROUPS: { label: string; items: Rarity[] }[] = [
  { label: "Standard", items: ["Gold", "Silver", "Bronze"] },
  {
    label: "Specials / Promos",
    items: [
      "TOTW", "Cornerstone", "Winter Wildcards", "TOTY", "TOTS",
      "Ratings Reload", "Ultimate Scream", "FoF Captains", "FC Pro Live",
      "Thunderstruck", "Joga Bonito", "Unbreakables", "Time Warp",
      "Future Stars", "Knockout Royalty", "UEFA Primetime", "UEFA RTTF",
      "FUT Birthday", "Fantasy FC", "FoF Answer the Call",
      "Path to Glory", "Trophy Titans", "Evo",
    ],
  },
  { label: "Legends", items: ["Icon Base", "Hero Base"] },
];

const ALL_RARITIES: Rarity[] = RARITY_GROUPS.flatMap((g) => g.items);

function PlayersPage() {
  const players = usePlayers();
  const matches = useMatches();
  const [editing, setEditing] = useState<Player | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"name" | "ovr" | "matches" | "goals" | "ga" | "rating">("ga");

  const aggs = useMemo(
    () => players.map((p) => aggregatePlayer(p, matches)),
    [players, matches],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = aggs;
    if (q) {
      list = list.filter(
        (a) =>
          a.player.name.toLowerCase().includes(q) ||
          a.player.position.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name": return a.player.name.localeCompare(b.player.name);
        case "ovr": return b.player.overall - a.player.overall;
        case "matches": return b.matches - a.matches;
        case "goals": return b.goals - a.goals;
        case "ga": return b.ga - a.ga;
        case "rating": return b.avgRating - a.avgRating;
      }
    });
    return list;
  }, [aggs, search, sort]);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-4xl tracking-wider">Player Database</h1>
          <p className="text-sm text-muted-foreground mt-1">{players.length} registered</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90 shadow-[var(--shadow-neon)]">
          <Plus className="h-4 w-4" /> Add Player
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full bg-input border border-border rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="bg-input border border-border rounded-md px-3 py-2 text-sm">
          <option value="ga">Sort: G+A</option>
          <option value="goals">Sort: Goals</option>
          <option value="matches">Sort: Matches</option>
          <option value="rating">Sort: Avg Rating</option>
          <option value="ovr">Sort: Overall</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          {players.length === 0 ? "No players yet. Add your first player to start tracking." : "No players match your filters."}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-semibold">Player</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell">Pos</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell">OVR</th>
                  <th className="text-right p-3 font-semibold">MP</th>
                  <th className="text-right p-3 font-semibold">G</th>
                  <th className="text-right p-3 font-semibold">A</th>
                  <th className="text-right p-3 font-semibold">G/A</th>
                  <th className="text-right p-3 font-semibold">Rating</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.player.id} className="border-t border-border/40 hover:bg-secondary/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <PlayerCard name={a.player.name} overall={a.player.overall} position={a.player.position} rarity={a.player.rarity} size="sm" />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{a.player.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`h-2 w-2 rounded-full ${raritySwatch(a.player.rarity)}`} />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{a.player.rarity}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell"><span className="font-mono text-xs">{a.player.position}</span></td>
                    <td className="p-3 hidden sm:table-cell stat-num">{a.player.overall}</td>
                    <td className="p-3 text-right stat-num">{a.matches}</td>
                    <td className="p-3 text-right stat-num text-primary font-semibold">{a.goals}</td>
                    <td className="p-3 text-right stat-num">{a.assists}</td>
                    <td className="p-3 text-right stat-num font-semibold">{a.ga}</td>
                    <td className="p-3 text-right stat-num">
                      {a.avgRating > 0 ? (
                        <span className={a.avgRating >= 8 ? "text-primary font-semibold" : a.avgRating < 6 ? "text-destructive" : ""}>
                          {a.avgRating.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(a.player)} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${a.player.name}? Their match stats will remain in matches.`)) {
                            store.deletePlayer(a.player.id);
                            toast.success("Deleted");
                          }
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <PlayerForm
          existing={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
        />
      )}
    </AppShell>
  );
}

function PlayerForm({ existing, onClose }: { existing: Player | null; onClose: () => void }) {
  const [name, setName] = useState(existing?.name ?? "");
  const [position, setPosition] = useState<Position>(existing?.position ?? "ST");
  const [overall, setOverall] = useState<number>(existing?.overall ?? 85);
  const [rarity, setRarity] = useState<Rarity>(existing?.rarity ?? "Gold");
  const [nationality, setNationality] = useState<string>(existing?.nationality ?? "");
  const [nationSearch, setNationSearch] = useState("");

  const filteredCountries = useMemo(() => {
    const q = nationSearch.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 12);
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q,
    ).slice(0, 60);
  }, [nationSearch]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    if (overall < 1 || overall > 99) return toast.error("Overall must be 1–99");
    const patch = { name: name.trim(), position, overall, rarity, nationality: nationality || undefined };
    if (existing) {
      store.updatePlayer(existing.id, patch);
      toast.success("Player updated");
    } else {
      store.addPlayer({ id: uuid(), createdAt: Date.now(), ...patch });
      toast.success("Player added");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="surface-glow w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl tracking-wider">{existing ? "Edit" : "Add"} Player</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Position">
              <select value={position} onChange={(e) => setPosition(e.target.value as Position)} className="w-full bg-input border border-border rounded-md px-3 py-2">
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Overall">
              <input type="number" min={1} max={99} value={overall} onChange={(e) => setOverall(parseInt(e.target.value) || 0)} className="w-full bg-input border border-border rounded-md px-3 py-2 stat-num" />
            </Field>
          </div>
          <Field label="Nationality">
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-input border border-border rounded-md px-3 py-2">
                <span className="text-xl leading-none">{flagEmoji(nationality) || "🌍"}</span>
                <input
                  value={nationSearch}
                  onChange={(e) => setNationSearch(e.target.value)}
                  placeholder={nationality ? COUNTRIES.find((c) => c.code === nationality)?.name ?? "Search countries..." : "Search countries..."}
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                />
                {nationality && (
                  <button type="button" onClick={() => { setNationality(""); setNationSearch(""); }} className="text-xs text-muted-foreground hover:text-destructive">
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-44 overflow-y-auto rounded border border-border/60 bg-background/40">
                {filteredCountries.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-3">No matches</div>
                ) : (
                  filteredCountries.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => { setNationality(c.code); setNationSearch(""); }}
                      className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-secondary/60 ${
                        nationality === c.code ? "bg-primary/15 text-primary" : ""
                      }`}
                    >
                      <span className="text-base leading-none">{flagEmoji(c.code)}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{c.code}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </Field>
          <Field label="Card Rarity">
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as Rarity)}
              className="w-full bg-input border border-border rounded-md px-3 py-2"
            >
              {RARITY_GROUPS.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <div className="mt-3">
              <div className={`inline-block px-3 py-2 rounded-md font-display text-sm tracking-wider ${rarityClass(rarity)}`}>
                PREVIEW · {rarity}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ALL_RARITIES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRarity(r)}
                  title={r}
                  aria-label={r}
                  className={`h-5 w-5 rounded-full ${raritySwatch(r)} transition ${
                    rarity === r ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </Field>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="submit" className="flex-1 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold uppercase tracking-wider text-sm hover:opacity-90">
            {existing ? "Save" : "Add Player"}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-md border border-border text-muted-foreground hover:text-foreground text-sm">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}
