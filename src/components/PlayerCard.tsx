import { useState, useEffect } from "react";
import type { Rarity } from "@/lib/types";
import { rarityVisual } from "@/lib/format";

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
  position: string;
  rarity: Rarity;
  imageUrl?: string;
  size?: "xs" | "sm" | "md";
}) {
  const sizes =
    size === "xs"
      ? "w-9 h-12 text-[8px]"
      : size === "sm"
        ? "w-12 h-16 text-[10px]"
        : "w-16 h-22 text-xs";
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
          onLoad={() => setLoaded(true)}
          onError={() => setBroken(true)}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
      {(!showImage || !loaded) && (
        <>
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className={size === "xs" ? "text-xs" : "text-base"}>{overall}</span>
          </div>
          <div className="leading-none opacity-90">
            <span>{position}</span>
          </div>
          <div className={`${size === "xs" ? "text-[7px]" : "text-[8px]"} truncate max-w-full uppercase tracking-tight`}>
            {name.split(" ").slice(-1)[0]}
          </div>
        </>
      )}
    </div>
  );
}
