import { rankBadgeClasses, type WLRank } from "@/lib/stats";
import { Trophy } from "lucide-react";

export function RankBadge({
  rank,
  size = "md",
  showIcon = true,
}: {
  rank: WLRank;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  const sizeCls =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1"
      : size === "lg"
        ? "text-sm px-4 py-1.5 gap-1.5"
        : "text-xs px-3 py-1 gap-1.5";
  const iconSize = size === "lg" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${sizeCls} ${rankBadgeClasses(rank)}`}
    >
      {showIcon && <Trophy className={iconSize} />}
      {rank}
    </span>
  );
}
