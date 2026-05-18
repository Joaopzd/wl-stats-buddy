import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useMatches, usePlayers, useWLs, useStoreLoading, store } from "@/lib/store";
import { aggregatePlayer, isCleanSheetEligible, isGoalsConcededEligible } from "@/lib/stats";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { Plus, Trash2, Pencil, X, Search } from "lucide-react";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import type { Player, Position, Rarity } from "@/lib/types";
import { rarityVisual, raritySwatch, raritySwatchStyle } from "@/lib/format";
import { compressImageToDataURL } from "@/lib/imageCompress";

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
      "Path to Glory", "Trophy Titans", "Evo", "FUT Champions TOTS",
    ],
  },
  { label: "Legends", items: ["Icon Base", "Hero Base"] },
];

const ALL_RARITIES: Rarity[] = RARITY_GROUPS.flatMap((g) => g.items);

function PlayersPage() {
  const players = usePlayers();
  const matches = useMatches();
  const wls = useWLs();
  const loading = useStoreLoading();
  const [editing, setEditing] = useState<Player | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  type SortKey = "name" | "ovr" | "matches" | "goals" | "assists" | "ga" | "rating" | "mvp" | "cs" | "gc" | "pos" | "subApps" | "subImpact";
  const [sort, setSort] = useState<SortKey>("ga");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [posFilter, setPosFilter] = useState<string>("");
  const [rarityFilter, setRarityFilter] = useState<string>("");
  const [minOvr, setMinOvr] = useState<string>("");
  const [minMatches, setMinMatches] = useState<string>("");
  const [minGoals, setMinGoals] = useState<string>("");
  const [minAssists, setMinAssists] = useState<string>("");
  const [minGA, setMinGA] = useState<string>("");
  const [minMvp, setMinMvp] = useState<string>("");
  const [minCs, setMinCs] = useState<string>("");
  const [minRating, setMinRating] = useState<string>("");
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sort === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSort(key); setSortDir(key === "name" || key === "pos" ? "asc" : "desc"); }
  };
  const sortIndicator = (key: SortKey) => sort === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const numFilter = (v: string) => { const n = parseFloat(v); return isNaN(n) ? null : n; };

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
    if (posFilter) list = list.filter((a) => a.player.position === posFilter);
    if (rarityFilter) list = list.filter((a) => a.player.rarity === rarityFilter);
    const checks: [string, (a: typeof aggs[number]) => number][] = [
      [minOvr, (a) => a.player.overall],
      [minMatches, (a) => a.matches],
      [minGoals, (a) => a.goals],
      [minAssists, (a) => a.assists],
      [minGA, (a) => a.ga],
      [minMvp, (a) => a.mvpCount],
      [minCs, (a) => a.cleanSheets],
      [minRating, (a) => a.avgRating],
    ];
    for (const [v, get] of checks) {
      const n = numFilter(v);
      if (n !== null) list = list.filter((a) => get(a) >= n);
    }
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      let r = 0;
      switch (sort) {
        case "name": r = a.player.name.localeCompare(b.player.name); break;
        case "pos": r = a.player.position.localeCompare(b.player.position); break;
        case "ovr": r = a.player.overall - b.player.overall; break;
        case "matches": r = a.matches - b.matches; break;
        case "goals": r = a.goals - b.goals; break;
        case "assists": r = a.assists - b.assists; break;
        case "ga": r = a.ga - b.ga; break;
        case "rating": r = a.avgRating - b.avgRating; break;
        case "mvp": r = a.mvpCount - b.mvpCount; break;
        case "cs": r = a.cleanSheets - b.cleanSheets; break;
        case "gc": r = a.goalsConceded - b.goalsConceded; break;
        case "subApps": r = a.subMatches - b.subMatches; break;
        case "subImpact": r = a.subImpact - b.subImpact; break;
      }
      return r * dir;
    });
    return list;
  }, [aggs, search, sort, sortDir, posFilter, rarityFilter, minOvr, minMatches, minGoals, minAssists, minGA, minMvp, minCs, minRating]);


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
        <button
          type="button"
          onClick={() => {
            setPosFilter(""); setRarityFilter(""); setMinOvr(""); setMinMatches("");
            setMinGoals(""); setMinAssists(""); setMinGA(""); setMinMvp("");
            setMinCs(""); setMinRating(""); setSearch("");
          }}
          className="px-3 py-2 rounded-md border border-border text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          Limpar filtros
        </button>
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
        Clique nos cabeçalhos para ordenar · Use os campos para filtrar
      </p>


      {loading ? (
        <div className="surface-card p-12 text-center text-muted-foreground animate-pulse">
          Carregando dados da nuvem…
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-12 text-center text-muted-foreground">
          {players.length === 0 ? "No players yet. Add your first player to start tracking." : "No players match your filters."}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <tr>
                  <th className="text-left p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("name")}>Player{sortIndicator("name")}</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("pos")}>Pos{sortIndicator("pos")}</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("ovr")}>OVR{sortIndicator("ovr")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("matches")}>MP{sortIndicator("matches")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("goals")}>G{sortIndicator("goals")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("assists")}>A{sortIndicator("assists")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("ga")}>G/A{sortIndicator("ga")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("mvp")} title="MVP awards">MVP{sortIndicator("mvp")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("cs")} title="Clean sheets">CS{sortIndicator("cs")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("gc")} title="Goals conceded">GC{sortIndicator("gc")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("rating")}>Rating{sortIndicator("rating")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("subApps")} title="Substitute appearances">Sub{sortIndicator("subApps")}</th>
                  <th className="text-right p-3 font-semibold cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("subImpact")} title="Super-Sub Impact Index: (G+A per sub appearance) × √apps × rating weight">Impact{sortIndicator("subImpact")}</th>
                  <th className="p-3"></th>
                </tr>
                <tr className="bg-secondary/30">
                  <th className="p-2"></th>
                  <th className="p-2 hidden sm:table-cell">
                    <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} className="w-full bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal">
                      <option value="">All</option>
                      {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </th>
                  <th className="p-2 hidden sm:table-cell">
                    <input type="number" value={minOvr} onChange={(e) => setMinOvr(e.target.value)} placeholder="≥" className="w-14 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" />
                  </th>
                  <th className="p-2"><input type="number" value={minMatches} onChange={(e) => setMinMatches(e.target.value)} placeholder="≥" className="w-12 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"><input type="number" value={minGoals} onChange={(e) => setMinGoals(e.target.value)} placeholder="≥" className="w-12 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"><input type="number" value={minAssists} onChange={(e) => setMinAssists(e.target.value)} placeholder="≥" className="w-12 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"><input type="number" value={minGA} onChange={(e) => setMinGA(e.target.value)} placeholder="≥" className="w-12 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"><input type="number" value={minMvp} onChange={(e) => setMinMvp(e.target.value)} placeholder="≥" className="w-12 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"><input type="number" value={minCs} onChange={(e) => setMinCs(e.target.value)} placeholder="≥" className="w-12 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"></th>
                  <th className="p-2"><input type="number" step="0.1" value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder="≥" className="w-14 bg-input border border-border rounded px-1 py-1 text-[10px] normal-case tracking-normal font-normal text-right" /></th>
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                </tr>

              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.player.id} onClick={() => setDetailPlayer(a.player)} className="border-t border-border/40 hover:bg-secondary/30 cursor-pointer">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <PlayerCard name={a.player.name} overall={a.player.overall} position={a.player.position} rarity={a.player.rarity} imageUrl={a.player.imageUrl} size="lg" />
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
                      {a.mvpCount > 0 ? <span className="text-amber-300 font-semibold">{a.mvpCount}</span> : <span className="text-muted-foreground/60">0</span>}
                    </td>
                    <td className="p-3 text-right stat-num">
                      {!isCleanSheetEligible(a.player.position) ? (
                        <span className="text-muted-foreground/40">—</span>
                      ) : a.cleanSheets > 0 ? (
                        <span className="text-sky-300 font-semibold">{a.cleanSheets}</span>
                      ) : (
                        <span className="text-muted-foreground/60">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right stat-num text-muted-foreground">
                      {isGoalsConcededEligible(a.player.position) ? a.goalsConceded : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="p-3 text-right stat-num">
                      {a.avgRating > 0 ? (
                        <span className={a.avgRating >= 8 ? "text-primary font-semibold" : a.avgRating < 6 ? "text-destructive" : ""}>
                          {a.avgRating.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right stat-num">
                      {a.subMatches > 0 ? (
                        <span title={`${a.subGoals}G / ${a.subAssists}A · avg ${a.subAvgRating.toFixed(2)}`}>
                          {a.subMatches}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">0</span>
                      )}
                    </td>
                    <td className="p-3 text-right stat-num">
                      {a.subMatches > 0 ? (
                        <span className={a.subImpact >= 1.5 ? "text-accent font-semibold" : a.subImpact >= 0.75 ? "text-foreground" : "text-muted-foreground"}>
                          {a.subImpact.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">

                      <button onClick={(e) => { e.stopPropagation(); setEditing(a.player); }} className="p-1.5 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
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

      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          matches={matches}
          wls={wls}
          onClose={() => setDetailPlayer(null)}
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
  const [imageUrl, setImageUrl] = useState<string>(existing?.imageUrl ?? "");
  const [previewBroken, setPreviewBroken] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name is required");
    if (overall < 1 || overall > 99) return toast.error("Overall must be 1–99");
    const trimmedUrl = imageUrl.trim();
    if (trimmedUrl && !/^(https?:\/\/|data:image\/)/i.test(trimmedUrl)) {
      return toast.error("Image must be an http(s) URL or uploaded file");
    }
    const patch = {
      name: name.trim(),
      position,
      overall,
      rarity,
      imageUrl: trimmedUrl || undefined,
    };
    if (existing) {
      try {
        store.updatePlayer(existing.id, patch);
        toast.success("Player updated");
      } catch (e) {
        return toast.error(e instanceof Error ? e.message : "Falha ao salvar");
      }
    } else {
      try {
        store.addPlayer({ id: uuid(), createdAt: Date.now(), ...patch });
        toast.success("Player added");
      } catch (e) {
        return toast.error(e instanceof Error ? e.message : "Falha ao salvar");
      }
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
              {(() => {
                const v = rarityVisual(rarity);
                return (
                  <div
                    className={`inline-block px-3 py-2 rounded-md font-display text-sm tracking-wider ${v.className}`}
                    style={v.style}
                  >
                    PREVIEW · {rarity}
                  </div>
                );
              })()}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ALL_RARITIES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRarity(r)}
                  title={r}
                  aria-label={r}
                  style={raritySwatchStyle(r)}
                  className={`h-5 w-5 rounded-full border ${raritySwatch(r)} transition ${
                    rarity === r ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </Field>
          <Field label="Card Image (optional)">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-border bg-input hover:bg-secondary/60 text-xs uppercase tracking-wider font-semibold">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageToDataURL(file);
                          setImageUrl(dataUrl);
                          setPreviewBroken(false);
                        } catch {
                          toast.error("Could not process that image");
                        } finally {
                          e.target.value = "";
                        }
                      }}
                    />
                    {imageUrl ? "Replace Image" : "Upload Image"}
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => { setImageUrl(""); setPreviewBroken(false); }}
                      className="px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-destructive text-xs uppercase tracking-wider"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <input
                  value={imageUrl.startsWith("data:") ? "" : imageUrl}
                  onChange={(e) => { setImageUrl(e.target.value); setPreviewBroken(false); }}
                  placeholder="…or paste an image URL"
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="shrink-0 h-14 w-11 rounded-md border border-border bg-secondary/40 overflow-hidden grid place-items-center">
                {imageUrl.trim() && !previewBroken ? (
                  <img
                    src={imageUrl.trim()}
                    alt="preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewBroken(true)}
                  />
                ) : (
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider text-center px-1">
                    {previewBroken ? "Broken" : "Preview"}
                  </span>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Envie do seu dispositivo (a imagem é comprimida automaticamente) ou cole uma URL. Vazio mostra o card da raridade.
            </p>
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
