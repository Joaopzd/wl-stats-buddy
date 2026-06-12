import { WATERMARK_OPTIONS, WATERMARK_COLOR_PRESETS } from "./LeagueWatermark";

/**
 * Picker for selecting a watermark element and accent color for a Weekend League card.
 * Compact grid of icons + color swatches. Designed for use inside dialogs/forms.
 */
export function WatermarkPicker({
  markId,
  color,
  onMarkChange,
  onColorChange,
}: {
  markId?: string;
  color?: string;
  onMarkChange: (id: string | undefined) => void;
  onColorChange: (color: string | undefined) => void;
}) {
  const activeColor = color ?? WATERMARK_COLOR_PRESETS[0];
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
          Watermark element
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          <button
            type="button"
            onClick={() => onMarkChange(undefined)}
            className={`aspect-square rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ease-in-out ${
              !markId
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
            title="Auto from name"
          >
            Auto
          </button>
          {WATERMARK_OPTIONS.map(({ id, label, Mark }) => {
            const active = markId === id;
            return (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => onMarkChange(id)}
                className={`aspect-square rounded-md border grid place-items-center transition-all duration-300 ease-in-out ${
                  active
                    ? "border-primary bg-primary/15"
                    : "border-border bg-secondary/40 hover:bg-secondary"
                }`}
              >
                <Mark
                  style={{ width: 20, height: 20, color: activeColor }}
                />
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
          Watermark color
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {WATERMARK_COLOR_PRESETS.map((c) => {
            const active = (color ?? "").toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                className={`h-7 w-7 rounded-full border-2 transition-all duration-300 ease-in-out ${
                  active ? "border-primary scale-110" : "border-border/60 hover:scale-105"
                }`}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            );
          })}
          <button
            type="button"
            onClick={() => onColorChange(undefined)}
            className={`h-7 px-2 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ease-in-out ${
              !color
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Default
          </button>
        </div>
      </div>
    </div>
  );
}
