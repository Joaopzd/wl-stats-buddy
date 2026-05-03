import { useState, useRef, useEffect } from "react";
import { Settings, Check } from "lucide-react";
import { ACCENTS, setAccent, useAccent, type AccentKey } from "@/lib/accent";

/** Settings gear that opens a small accent-color picker. */
export function AccentPicker() {
  const accent = useAccent();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Accent color settings"
        aria-expanded={open}
        className="h-9 w-9 grid place-items-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
      >
        <Settings className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-popover shadow-[var(--shadow-card)] p-3 z-50"
        >
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2">
            Accent Color
          </div>
          <ul className="space-y-1">
            {(Object.keys(ACCENTS) as AccentKey[]).map((k) => {
              const a = ACCENTS[k];
              const active = k === accent;
              return (
                <li key={k}>
                  <button
                    type="button"
                    onClick={() => { setAccent(k); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-sm transition ${
                      active ? "bg-secondary/80 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="h-5 w-5 rounded-full border border-border/70 shrink-0"
                      style={{
                        background: a.swatch,
                        boxShadow: `0 0 12px ${a.swatch}80, 0 0 0 1px ${a.swatch}40`,
                      }}
                    />
                    <span className="flex-1 text-left font-semibold">{a.label}</span>
                    {active && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
