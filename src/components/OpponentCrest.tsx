import opponentCrestImg from "@/assets/opponent-crest.png";

/**
 * Single, custom opponent crest used everywhere.
 * The `id` prop is accepted for backwards compatibility but ignored —
 * every opponent now uses the same uploaded image.
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
    <img
      src={opponentCrestImg}
      alt="Opponent crest"
      style={{ width: px, height: px }}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
