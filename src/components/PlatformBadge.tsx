import type { Platform } from "@/lib/types";

/** Brand background HEX per platform. */
export const PLATFORM_BG: Record<Platform, string> = {
  PS5: "#00439C",
  Xbox: "#107C10",
  PC: "#0A0A0A",
};

const LABEL: Record<Platform, string> = {
  PS5: "PS5",
  Xbox: "XBOX",
  PC: "PC",
};

interface Props {
  platform: Platform;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PlatformBadge({ platform, size = "sm", className = "" }: Props) {
  const dim =
    size === "xs" ? "h-4 px-1.5 text-[9px]" :
    size === "md" ? "h-7 px-2.5 text-xs" :
    "h-5 px-2 text-[10px]";
  return (
    <span
      title={platform}
      className={`inline-flex items-center justify-center rounded border border-black/20 font-display font-bold uppercase tracking-wider text-white ${dim} ${className}`}
      style={{ backgroundColor: PLATFORM_BG[platform] }}
    >
      {LABEL[platform]}
    </span>
  );
}
