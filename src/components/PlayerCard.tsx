import { useState, useEffect } from "react";
import { TrendingUp, User } from "lucide-react";
import type { Position, Rarity, PlayerAttributes } from "@/lib/types";
import { rarityVisual, rarityIcon } from "@/lib/format";
import { positionBadgeStyle } from "@/lib/positionGroup";
import { Flag } from "@/components/Flag";
import { ClubBadge } from "@/components/ClubBadge";
import { LeagueBadge } from "@/components/LeagueBadge";

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
  secondaryPositions,
  nationality,
  club,
  league,
  size = "md",
}: {
  name: string;
  overall: number;
  position: Position;
  rarity: Rarity;
  imageUrl?: string;
  /** Atributos (PAC/SHO/PAS/DRI/DEF/PHY). Em tamanhos grandes (lg/xl), aparecem impressos sobre o retrato (imagem custom ou silhueta). */
  attributes?: PlayerAttributes;
  /** Mostra um selo indicando que essa é uma carta evoluída. */
  isEvolved?: boolean;
  /** Posições alternativas — aparecem como abas na lateral direita (só no tamanho xl). */
  secondaryPositions?: Position[];
  /** Nacionalidade — vira a bandeirinha no rodapé (só no tamanho xl). */
  nationality?: string;
  /** Clube — vira a badge real do time (via TheSportsDB) no rodapé (só no tamanho xl). */
  club?: string;
  /** Liga — mesma ideia do clube. */
  league?: string;
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

  // Imagem custom sempre pode aparecer — nos tamanhos compactos ela cobre o card
  // inteiro; nos grandes (com atributos), ela vira o retrato dentro da moldura.
  const showImage = !!imageUrl && !broken;
  const showFullBleedImage = showImage && !showAttributes;

  return (
    <div
      className={`${sizes} rounded-md shrink-0 relative overflow-hidden shadow-md ${showFullBleedImage && loaded ? "" : v.className} ${showFullBleedImage && loaded ? "p-0 flex" : showAttributes ? "p-1.5 flex flex-col font-display" : "p-1 flex flex-col items-center justify-between font-display"}`}
      style={showFullBleedImage && loaded ? undefined : v.style}
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

      {size === "xl" && secondaryPositions && secondaryPositions.length > 0 && (
        <div className="absolute right-0 top-9 z-10 flex flex-col gap-0.5 items-end">
          {secondaryPositions.slice(0, 3).map((p) => (
            <span
              key={p}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-l bg-black/45 backdrop-blur-sm text-white"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {showAttributes ? (
        <>
          <div className="flex items-baseline gap-1 leading-none z-10 pl-3">
            <span className={size === "xl" ? "text-4xl" : "text-2xl"}>{overall}</span>
            <span
              className="inline-block rounded px-1 border font-bold text-xs"
              style={positionBadgeStyle(position)}
            >
              {position}
            </span>
          </div>

          {/* Retrato: imagem custom quando existir, senão uma silhueta gerada — nunca some por causa dos atributos. */}
          <div className="relative flex-1 my-1.5 rounded overflow-hidden bg-black/15">
            {showImage && (
              <img
                src={imageUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => setBroken(true)}
                className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            )}
            {(!showImage || !loaded) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <User size={size === "xl" ? 64 : 36} className="opacity-25" strokeWidth={1.5} />
              </div>
            )}
          </div>

          <div className={`${size === "xl" ? "text-sm" : "text-xs"} w-full text-center truncate uppercase tracking-tight font-bold bg-black/20 rounded px-1 py-0.5 z-10`}>
            {name.split(" ").slice(-1)[0]}
          </div>

          <div className={`grid ${size === "xl" ? "grid-cols-6 gap-x-1" : "grid-cols-2 gap-x-2 gap-y-0.5"} w-full px-1 pt-1.5 z-10`}>
            {ATTRIBUTE_LABELS.map(({ key, label }) =>
              size === "xl" ? (
                <div key={key} className="flex flex-col items-center leading-tight">
                  <span className="font-bold tabular-nums text-sm">{attributes![key]}</span>
                  <span className="opacity-70 text-[9px]">{label}</span>
                </div>
              ) : (
                <div key={key} className="flex items-center justify-between gap-1">
                  <span className="font-bold tabular-nums">{attributes![key]}</span>
                  <span className="opacity-80 text-[0.85em]">{label}</span>
                </div>
              ),
            )}
          </div>

          {size === "xl" && (nationality || club || league) && (
            <div className="flex items-center justify-center gap-1.5 z-10 pt-1.5">
              {nationality && <Flag country={nationality} />}
              {club && <ClubBadge club={club} size={20} />}
              {league && <LeagueBadge league={league} size={20} />}
            </div>
          )}
        </>
      ) : (
        <>
          {showFullBleedImage && (
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

          {(!showFullBleedImage || !loaded) && (
            <>
              <div className="flex items-baseline gap-0.5 leading-none">
                <span className={size === "xs" ? "text-xs" : "text-base"}>{overall}</span>
              </div>
              <div className="leading-none">
                <span
                  className="inline-block rounded px-1 border font-bold"
                  style={positionBadgeStyle(position)}
                >
                  {position}
                </span>
              </div>
              <div className={`${size === "xs" ? "text-[7px]" : "text-[8px]"} truncate max-w-full uppercase tracking-tight`}>
                {name.split(" ").slice(-1)[0]}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
