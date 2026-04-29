import { OPPONENT_CRESTS, OpponentCrestSvg } from "@/lib/crests";

/** Inline grid picker for selecting a generic opponent crest. */
export function CrestPicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-1.5">
        Opponent Crest
      </div>
      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 bg-input border border-border rounded-md p-2">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          aria-label="No crest"
          title="No crest"
          className={`h-9 rounded grid place-items-center text-[9px] font-bold uppercase tracking-wider transition border ${
            !value
              ? "bg-primary/20 text-primary border-primary/60"
              : "bg-background/40 text-muted-foreground border-border/60 hover:text-foreground"
          }`}
        >
          None
        </button>
        {OPPONENT_CRESTS.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              title={c.label}
              aria-label={c.label}
              className={`h-9 w-9 rounded grid place-items-center transition border ${
                active
                  ? "border-primary ring-2 ring-primary/60 bg-primary/10"
                  : "border-border/60 bg-background/40 hover:border-foreground/40"
              }`}
            >
              <OpponentCrestSvg id={c.id} size={28} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
