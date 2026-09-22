import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import type { Position, Rarity, PlayerAttributes } from "@/lib/types";
import { rarityVisual, rarityIcon } from "@/lib/format";
import { positionBadgeStyle } from "@/lib/positionGroup";

const ATTRIBUTE_LABELS: { key: keyof PlayerAttributes; label: string }[] = [
  { key: "pace", label: "PAC" },
  { key: "shooting", label: "SHO" },
  { key: "passing", label: "PAS" },
  { key: "dribbling", label: "DRI" },
  { key: "defending", label: "DEF" },
  { key: "physical", label: "PHY" },
];

export function PlayerCard({
  name,
  overall,
  position,
  rarity,
  imageUrl,
  attributes,
  isEvolved,
  size = "md",
}: {
  name: string;
  overall: number;
  position: Position;
  rarity: Rarity;
  imageUrl?: string;
  /** Atributos (PAC/SHO/PAS/DRI/DEF/PHY). Quando presentes, o card os desenha em vez de depender de imagem. */
  attributes?: PlayerAttributes;
  /** Mostra um selo indicando que essa é uma carta evoluída. */
  isEvolved?: boolean;
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

  // Atributos só cabem visualmente em cards grandes.
  const showAttributes = (size === "lg" || size === "xl") && !!attributes;

  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setBroken(false); setLoaded(false); }, [imageUrl]);

  // Com atributos disponíveis, o card gerado a partir dos dados tem prioridade sobre uma
  // imagem externa — a imagem vira só um override cosmético opcional (ex: foto/face custom).
  const showImage = !!imageUrl && !broken && !showAttributes;

  return (
    <div
      className={`${sizes} rounded-md shrink-0 relative overflow-hidden shadow-md ${showImage && loaded ? "" : v.className} ${showImage && loaded ? "p-0 flex" : "p-1 flex flex-col items-center justify-between font-display"}`}
      style={showImage && loaded ? undefined : v.style}
      title={`${name} · ${rarity}`}
    >
      {size !== "xs" && (() => {
        const Icon = rarityIcon(rarity);
        const iconSz = size === "lg" || size === "xl" ? 14 : 10;
        return (
          <div
            className="absolute top-0.5 left-0.5 z-10 rounded-full bg-black/55 backdrop-blur-sm p-0.5 flex items-center justify-center"
            aria-hidden
          >
            <Icon size={iconSz} className="text-white" strokeWidth={2.4} />
          </div>
        );
      })()}

      {isEvolved && size !== "xs" && (
        <div
          className="absolute top-0.5 right-0.5 z-10 rounded-full bg-emerald-500/90 backdrop-blur-sm p-0.5 flex items-center justify-center"
          title="Carta evoluída"
          aria-hidden
        >
          <TrendingUp size={size === "lg" || size === "xl" ? 14 : 10} className="text-white" strokeWidth={2.6} />
        </div>
      )}

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

          {showAttributes && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 w-full px-1 mt-1">
              {ATTRIBUTE_LABELS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-1">
                  <span className="font-bold tabular-nums">{attributes![key]}</span>
                  <span className="opacity-80 text-[0.85em]">{label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
