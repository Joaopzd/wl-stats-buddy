import { useState, useRef, useEffect } from "react";
import { Settings, Check, Upload, Trash2 } from "lucide-react";
import { THEMES, setTheme, useTheme, type ThemeKey } from "@/lib/theme";
import { store, useOpponentCrest, useOpponentName } from "@/lib/store";
import { OpponentCrest } from "./OpponentCrest";
import { compressImageToDataURL } from "@/lib/imageCompress";
import { toast } from "sonner";



/** Settings gear that opens accent picker + opponent identity config. */
export function SettingsMenu() {
  const theme = useTheme();
  const opponentName = useOpponentName();
  const opponentCrest = useOpponentCrest();
  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState(opponentName);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setNameDraft(opponentName); }, [opponentName, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onPickFile = async (file: File) => {
    if (file.size > 10_000_000) { toast.error("Image too large (max ~10 MB)"); return; }
    try {
      const dataUrl = await compressImageToDataURL(file);
      store.setOpponentCrest(dataUrl);
      toast.success("Opponent crest updated");
    } catch (e) {
      console.error("Crest upload failed", e);
      toast.error("Could not read this image. Try a PNG or JPG (HEIC from iPhone is not supported — convert it first).");
    }
  };


  const commitName = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) { setNameDraft(opponentName); return; }
    if (trimmed === opponentName) return;
    store.setOpponentName(trimmed);
    toast.success("Opponent name saved");
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        aria-expanded={open}
        className="h-9 w-9 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
      >
        <Settings className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-popover shadow-[var(--shadow-card)] p-3 z-50 max-h-[80vh] overflow-y-auto"
        >
          {/* Theme */}
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2">
            Theme Palette
          </div>
          <ul className="space-y-1">
            {(Object.keys(THEMES) as ThemeKey[]).map((k) => {
              const t = THEMES[k];
              const active = k === theme;
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => setTheme(k)}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition ${
                      active ? "bg-secondary/80 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-6 w-10 rounded border border-border/70 shrink-0 overflow-hidden flex"
                    >
                      {t.swatches.map((c, i) => (
                        <span key={i} className="flex-1" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="flex-1 text-left min-w-0">
                      <span className="block font-semibold truncate leading-tight">{t.label}</span>
                      <span className="block text-[10px] text-muted-foreground truncate leading-tight">
                        {t.description}
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="my-3 h-px bg-border/60" />

          {/* Opponent config */}
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2">
            Opponent Configuration
          </div>

          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            Opponent Name
          </label>
          <input
            type="text"
            value={nameDraft}
            placeholder="Challenger FC"
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="w-full h-9 px-2.5 rounded-md bg-input border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <div className="mt-3 flex items-center gap-3">
            <OpponentCrest size={48} />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Opponent Crest
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {opponentCrest ? "Custom crest in use" : "Using default crest"}
              </div>
              <div className="mt-1.5 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider hover:opacity-90"
                >
                  <Upload className="h-3 w-3" /> {opponentCrest ? "Replace" : "Upload"}
                </button>
                {opponentCrest && (
                  <button
                    type="button"
                    onClick={() => { store.setOpponentCrest(null); toast.success("Crest reset"); }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Reset
                  </button>
                )}
              </div>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
