import opponentCrestImg from "@/assets/opponent-crest.png";
import { useOpponentCrest } from "@/lib/store";

/**
 * Opponent crest, rendered inside the same circular mask as ClubCrest so
 * both crests share identical dimensions, borders, and shadows.
 * Sources from the user's global setting; falls back to the bundled image.
 */
export function OpponentCrest({
  id: _id,
  size = 28,
  className = "",
}: {
  id?: string | null;
  size?: number;
  className?: string;
}) {
  const custom = useOpponentCrest();
  const px = `${size}px`;
  const src = custom ?? opponentCrestImg;
  return (
    <div
      style={{ width: px, height: px }}
      className={`inline-grid place-items-center rounded-full overflow-hidden bg-background/60 border border-border/60 shrink-0 ${className}`}
    >
      <img
        src={src}
        alt="Opponent crest"
        style={{ width: px, height: px }}
        className="object-contain"
        draggable={false}
      />
    </div>
  );
}
