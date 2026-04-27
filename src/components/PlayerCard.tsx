import type { Rarity } from "@/lib/types";
import { rarityClass } from "@/lib/format";

export function PlayerCard({
  name,
  overall,
  position,
  rarity,
  size = "md",
}: {
  name: string;
  overall: number;
  position: string;
  rarity: Rarity;
  size?: "xs" | "sm" | "md";
}) {
  const sizes =
    size === "xs"
      ? "w-9 h-12 text-[8px]"
      : size === "sm"
        ? "w-12 h-16 text-[10px]"
        : "w-16 h-22 text-xs";
  return (
    <div
      className={`${sizes} ${rarityClass(rarity)} rounded-md p-1 flex flex-col items-center justify-between font-display shadow-md shrink-0 relative`}
      title={`${name} · ${rarity}`}
    >
      <div className="flex items-baseline gap-0.5 leading-none">
        <span className={size === "xs" ? "text-xs" : "text-base"}>{overall}</span>
      </div>
      <div className="leading-none opacity-90">
        <span>{position}</span>
      </div>
      <div className={`${size === "xs" ? "text-[7px]" : "text-[8px]"} truncate max-w-full uppercase tracking-tight`}>
        {name.split(" ").slice(-1)[0]}
      </div>
    </div>
  );
}
