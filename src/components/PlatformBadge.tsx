import type { Platform } from "@/lib/types";

/** Brand background HEX per platform. Applied everywhere a platform is shown. */
export const PLATFORM_BG: Record<Platform, string> = {
  PS5: "#00439C",
  Xbox: "#107C10",
  PC: "#FCFAF6",
};

/** Foreground color tuned for legibility against each background. */
export const PLATFORM_FG: Record<Platform, string> = {
  PS5: "#FFFFFF",
  Xbox: "#FFFFFF",
  PC: "#0A0A0A",
};

interface Props {
  platform: Platform;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PlatformBadge({ platform, size = "sm", className = "" }: Props) {
  const sizeCls =
    size === "xs"
      ? "text-[9px] px-1.5 py-0.5"
      : size === "md"
      ? "text-[11px] px-2.5 py-1"
      : "text-[10px] px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold uppercase tracking-wider rounded border border-black/20 ${sizeCls} ${className}`}
      style={{ backgroundColor: PLATFORM_BG[platform], color: PLATFORM_FG[platform] }}
    >
      {platform}
    </span>
  );
}
