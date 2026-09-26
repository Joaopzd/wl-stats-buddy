import { useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FC27CatalogRow = Database["public"]["Tables"]["fc27_ratings"]["Row"];

export function PlayerCatalogSearch({
  onSelect,
}: {
  onSelect: (row: FC27CatalogRow) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FC27CatalogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const { data, error } = await supabase
        .from("fc27_ratings")
        .select("*")
        .or(`name.ilike.%${q}%,common_name.ilike.%${q}%`)
        .order("overall", { ascending: false })
        .limit(8);
      if (!error) setResults(data ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar carta no catálogo FC 27 (ex: Mbappé)..."
          className="w-full bg-input border border-border rounded-md pl-10 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto surface-card border border-border rounded-md shadow-lg">
          {results.map((row) => (
            <button
              type="button"
              key={row.id}
              onClick={() => {
                onSelect(row);
                setQuery(row.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-secondary/60 flex items-center justify-between gap-3 border-b border-border/40 last:border-0"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate text-sm">{row.name}</div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {row.club ?? "—"} · {row.position}
                </div>
              </div>
              <span className="stat-num text-sm font-bold text-primary shrink-0">{row.overall}</span>
            </button>
          ))}
        </div>
      )}

      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-30 mt-1 w-full surface-card border border-border rounded-md p-3 text-xs text-muted-foreground">
          Nenhum jogador encontrado no catálogo.
        </div>
      )}
    </div>
  );
}
