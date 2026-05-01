import opponentCrestImg from "@/assets/opponent-crest.png";

/**
 * Single, custom opponent crest used everywhere, rendered inside a fixed
 * circular mask so it shares identical dimensions with ClubCrest.
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
  const px = `${size}px`;
  return (
    <div
      style={{ width: px, height: px }}
      className={`inline-grid place-items-center rounded-full overflow-hidden bg-background/60 border border-border/60 shrink-0 ${className}`}
    >
      <img
        src={opponentCrestImg}
        alt="Opponent crest"
        style={{ width: px, height: px }}
        className="object-contain"
        draggable={false}
      />
    </div>
  );
}
