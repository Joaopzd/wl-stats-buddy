import { useState, useEffect } from "react";
import type { Position, Rarity } from "@/lib/types";
import { rarityVisual } from "@/lib/format";
import { positionBadgeStyle } from "@/lib/positionGroup";

export function PlayerCard({
  name,
  overall,
  position,
  rarity,
  imageUrl,
  size = "md",
}: {
  name: string;
  overall: number;
  position: Position;
  rarity: Rarity;
  imageUrl?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  // Strict 3:4 aspect ratio across all sizes to match real player cards.
  const sizes =
    size === "xs"
      ? "w-9 h-12 text-[8px]"
      : size === "sm"
        ? "w-12 h-16 text-[10px]"
        : size === "md"
          ? "w-18 h-24 text-xs"
          : size === "lg"
            ? "w-24 h-32 text-sm"
            : "w-48 h-64 text-base";
  const v = rarityVisual(rarity);

  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setBroken(false); setLoaded(false); }, [imageUrl]);

  const showImage = !!imageUrl && !broken;

  return (
    <div
      className={`${sizes} rounded-md shrink-0 relative overflow-hidden shadow-md ${showImage && loaded ? "" : v.className} ${showImage && loaded ? "p-0 flex" : "p-1 flex flex-col items-center justify-between font-display"}`}
      style={showImage && loaded ? undefined : v.style}
      title={`${name} · ${rarity}`}
    >
      {showImage && (
        <img
          src={imageUrl}
          alt={name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
          style={{ imageRendering: "auto" }}
          className={`absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {(!showImage || !loaded) && (
        <>
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className={size === "xs" ? "text-xs" : size === "lg" ? "text-2xl" : size === "xl" ? "text-4xl" : "text-base"}>{overall}</span>
          </div>
          <div className={`leading-none ${size === "lg" ? "text-base" : size === "xl" ? "text-xl" : ""}`}>
            <span
              className="inline-block rounded px-1 border font-bold"
              style={positionBadgeStyle(position)}
            >
              {position}
            </span>
          </div>
          <div className={`${size === "xs" ? "text-[7px]" : size === "lg" ? "text-xs" : size === "xl" ? "text-sm" : "text-[8px]"} truncate max-w-full uppercase tracking-tight`}>
            {name.split(" ").slice(-1)[0]}
          </div>
        </>
      )}
    </div>
  );
}
