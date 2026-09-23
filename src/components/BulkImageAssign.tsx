import { useMemo, useRef, useState } from "react";
import { X, Check, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { usePlayers, store } from "@/lib/store";
import { PlayerCard } from "@/components/PlayerCard";
import type { Player } from "@/lib/types";

function isValidImageUrl(v: string) {
  return /^(https?:\/\/|data:image\/)/i.test(v.trim());
}

export function BulkImageAssign({ onClose }: { onClose: () => void }) {
  const players = usePlayers();
  const [showAll, setShowAll] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const list = useMemo(() => {
    const base = showAll ? players : players.filter((p) => !p.imageUrl);
    return [...base].sort((a, b) => b.overall - a.overall);
  }, [players, showAll]);

  const valueFor = (p: Player) => values[p.id] ?? p.imageUrl ?? "";

  const save = (p: Player) => {
    const raw = valueFor(p).trim();
    if (raw && !isValidImageUrl(raw)) {
      toast.error(`URL inválida para ${p.name} — precisa ser http(s) ou data:image`);
      return;
    }
    if (raw !== (p.imageUrl ?? "")) {
      store.updatePlayer(p.id, { imageUrl: raw || undefined });
      setSaved((s) => ({ ...s, [p.id]: true }));
    }
  };

  const commitAndAdvance = (p: Player, index: number) => {
    save(p);
    const next = list[index + 1];
    if (next) inputRefs.current[next.id]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="surface-glow w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-2xl tracking-wider">Atribuir Imagens</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Cole a URL e aperte <kbd className="px-1 py-0.5 rounded bg-secondary/60 border border-border">Enter</kbd> — salva e já foca no próximo jogador.
        </p>

        <label className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4 cursor-pointer">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          Mostrar todos (não só os sem imagem)
        </label>

        {list.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {showAll ? "Nenhum jogador cadastrado." : "Todos os jogadores já têm imagem 🎉"}
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <PlayerCard name={p.name} overall={p.overall} position={p.position} rarity={p.rarity} imageUrl={p.imageUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{p.name}</div>
                  <input
                    ref={(el) => { inputRefs.current[p.id] = el; }}
                    value={valueFor(p)}
                    onChange={(e) => {
                      setValues((v) => ({ ...v, [p.id]: e.target.value }));
                      setSaved((s) => ({ ...s, [p.id]: false }));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitAndAdvance(p, i);
                      }
                    }}
                    onBlur={() => save(p)}
                    placeholder="https://... ou data:image/..."
                    className="w-full bg-input border border-border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="w-5 shrink-0 grid place-items-center">
                  {saved[p.id] || p.imageUrl ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <ImageOff className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
