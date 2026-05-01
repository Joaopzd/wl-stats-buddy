import { Shield } from "lucide-react";
import { useClubCrest } from "@/lib/store";

/**
 * User's uploaded club crest, rendered inside a fixed circular mask so it
 * matches the OpponentCrest dimensions exactly (perfect "Versus" symmetry).
 */
export function ClubCrest({ size = 28, className = "" }: { size?: number; className?: string }) {
  const dataUrl = useClubCrest();
  const px = `${size}px`;
  const wrapper = `inline-grid place-items-center rounded-full overflow-hidden bg-background/60 border border-border/60 shrink-0 ${className}`;
  if (dataUrl) {
    return (
      <div style={{ width: px, height: px }} className={wrapper}>
        <img
          src={dataUrl}
          alt="My club crest"
          style={{ width: px, height: px }}
          className="object-contain"
          draggable={false}
        />
      </div>
    );
  }
  return (
    <div
      style={{ width: px, height: px }}
      className={`${wrapper} text-primary`}
      aria-label="My club (no crest)"
    >
      <Shield style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={2} />
    </div>
  );
}
