import { Shield } from "lucide-react";
import { useClubCrest } from "@/lib/store";

/** User's uploaded club crest, or a clean placeholder. */
export function ClubCrest({ size = 28, className = "" }: { size?: number; className?: string }) {
  const dataUrl = useClubCrest();
  const px = `${size}px`;
  if (dataUrl) {
    return (
      <img
        src={dataUrl}
        alt="My club crest"
        style={{ width: px, height: px }}
        className={`object-contain rounded-sm ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: px, height: px }}
      className={`grid place-items-center rounded-sm border border-primary/40 bg-primary/10 text-primary ${className}`}
      aria-label="My club (no crest)"
    >
      <Shield style={{ width: size * 0.6, height: size * 0.6 }} strokeWidth={2} />
    </div>
  );
}
