import type { Platform } from "@/lib/types";
import ps5Asset from "@/assets/ps5.jpg.asset.json";
import xboxAsset from "@/assets/xbox.jpg.asset.json";
import pcAsset from "@/assets/pc.jpg.asset.json";

/** Brand background HEX per platform. Applied everywhere a platform is shown. */
export const PLATFORM_BG: Record<Platform, string> = {
  PS5: "#00439C",
  Xbox: "#107C10",
  PC: "#0A0A0A",
};

const LOGO: Record<Platform, string> = {
  PS5: ps5Asset.url,
  Xbox: xboxAsset.url,
  PC: pcAsset.url,
};

interface Props {
  platform: Platform;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function PlatformBadge({ platform, size = "sm", className = "" }: Props) {
  const dim =
    size === "xs" ? { box: "h-4 px-1.5", img: 12 } :
    size === "md" ? { box: "h-7 px-2.5", img: 22 } :
    { box: "h-5 px-2", img: 16 };
  return (
    <span
      title={platform}
      className={`inline-flex items-center justify-center rounded border border-black/20 overflow-hidden ${dim.box} ${className}`}
      style={{ backgroundColor: PLATFORM_BG[platform] }}
    >
      <img
        src={LOGO[platform]}
        alt={platform}
        height={dim.img}
        style={{ height: dim.img, width: "auto", objectFit: "contain" }}
        draggable={false}
      />
    </span>
  );
}
