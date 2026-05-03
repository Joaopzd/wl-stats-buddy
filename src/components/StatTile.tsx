export function StatTile({
  label,
  value,
  sub,
  accent = false,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`surface-card p-5 relative overflow-hidden ${accent ? "surface-glow" : ""}`}>
      {icon && (
        <div className="absolute -right-2 -top-2 text-primary/10 text-6xl pointer-events-none">
          {icon}
        </div>
      )}
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="mt-2 font-display text-4xl leading-none text-foreground">
        {value}
      </div>
      {sub && <div className="mt-2 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
