import { Crown, Bird, Cat, Hexagon, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Pick a league-themed silhouette icon based on the WL title. */
function pickIcon(title: string): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes("laliga") || t.includes("la liga")) return Crown;
  if (t.includes("bundesliga")) return Bird;
  if (t.includes("premier")) return Cat;
  if (t.includes("ligue")) return Hexagon;
  return Trophy;
}

/**
 * Faint league silhouette watermark anchored to the bottom-right of a card.
 * Parent MUST be `relative overflow-hidden`. Sits behind content (z-0).
 * Card content should be wrapped in a `relative z-10` container to stay above.
 */
export function LeagueWatermark({ title, size = 140 }: { title: string; size?: number }) {
  const Icon = pickIcon(title);
  return (
    <Icon
      aria-hidden="true"
      className="pointer-events-none absolute -right-4 -bottom-4 z-0 text-foreground opacity-[0.06]"
      style={{ width: size, height: size }}
      strokeWidth={1.25}
    />
  );
}
