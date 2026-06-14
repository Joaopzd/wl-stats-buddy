import type { Position } from "@/lib/types";
import { positionBadgeStyle, positionGroup, POSITION_GROUP_STYLE } from "@/lib/positionGroup";

export function PositionBadge({
  position,
  size = "sm",
  className = "",
}: {
  position: Position;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizing =
    size === "xs"
      ? "text-[10px] px-1 py-0.5 w-9"
      : size === "md"
        ? "text-xs px-2 py-0.5 w-12"
        : "text-[11px] px-1.5 py-0.5 w-12";
  const group = POSITION_GROUP_STYLE[positionGroup(position)];
  return (
    <span
      title={`${position} · ${group.label}`}
      className={`inline-block font-mono uppercase tracking-wider font-bold border rounded text-center shrink-0 ${sizing} ${className}`}
      style={positionBadgeStyle(position)}
    >
      {position}
    </span>
  );
}
