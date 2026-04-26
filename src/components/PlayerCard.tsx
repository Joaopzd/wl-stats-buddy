import type { Rarity } from "@/lib/types";
import { rarityClass } from "@/lib/format";
import { flagEmoji } from "@/lib/countries";

export function PlayerCard({
  name,
  overall,
  position,
  rarity,
  nationality,
  size = "md",
}: {
  name: string;
  overall: number;
  position: string;
  rarity: Rarity;
  nationality?: string;
  size?: "sm" | "md";
}) {
  const sizes = size === "sm"
    ? "w-12 h-16 text-[10px]"
    : "w-16 h-22 text-xs";
  const flag = flagEmoji(nationality ?? "");
  return (
    <div
      className={`${sizes} ${rarityClass(rarity)} rounded-md p-1 flex flex-col items-center justify-between font-display shadow-md shrink-0 relative`}
      title={`${name} · ${rarity}`}
    >
      <div className="flex items-baseline gap-0.5 leading-none">
        <span className="text-base">{overall}</span>
      </div>
      <div className="leading-none opacity-90 flex items-center gap-0.5">
        <span>{position}</span>
        {flag && <span className={size === "sm" ? "text-[9px]" : "text-[10px]"} aria-hidden>{flag}</span>}
      </div>
      <div className="text-[8px] truncate max-w-full uppercase tracking-tight">
        {name.split(" ").slice(-1)[0]}
      </div>
    </div>
  );
}
