import type { CSSProperties } from "react";

/**
 * Generic minimalist opponent crests. Pure SVG, no images.
 * Each crest is identified by `id` and rendered via <OpponentCrestSvg id=... />.
 */

export interface CrestDef {
  id: string;
  /** Short label / nickname e.g. "Red Shield". */
  label: string;
  /** Primary + secondary palette (hex). */
  colors: [string, string];
  /** Render function returning SVG children. */
  shape: "shield-split" | "shield-stripes" | "shield-chevron"
    | "circle-ring" | "circle-stripes" | "circle-star"
    | "square-cross" | "square-diag" | "diamond"
    | "hex-bars" | "shield-bars" | "circle-half" | "shield-star" | "circle-bolt";
}

export const OPPONENT_CRESTS: CrestDef[] = [
  { id: "red-shield-split",   label: "Red Shield",     colors: ["#dc2626", "#fafafa"], shape: "shield-split" },
  { id: "blue-shield-stripes",label: "Royal Stripes",  colors: ["#1d4ed8", "#fbbf24"], shape: "shield-stripes" },
  { id: "green-chevron",      label: "Green Chevron",  colors: ["#15803d", "#fafafa"], shape: "shield-chevron" },
  { id: "black-yellow-bars",  label: "Wasps",          colors: ["#facc15", "#0a0a0a"], shape: "shield-bars" },
  { id: "purple-star",        label: "Violet Star",    colors: ["#7c3aed", "#fde047"], shape: "shield-star" },
  { id: "orange-circle-ring", label: "Citrus Ring",    colors: ["#f97316", "#0a0a0a"], shape: "circle-ring" },
  { id: "navy-circle-stripes",label: "Navy Hoops",     colors: ["#0f172a", "#e2e8f0"], shape: "circle-stripes" },
  { id: "sky-circle-star",    label: "Sky Star",       colors: ["#0ea5e9", "#fafafa"], shape: "circle-star" },
  { id: "maroon-half",        label: "Maroon Half",    colors: ["#7f1d1d", "#f5f5f4"], shape: "circle-half" },
  { id: "yellow-bolt",        label: "Lightning",      colors: ["#fde047", "#1e3a8a"], shape: "circle-bolt" },
  { id: "white-square-cross", label: "White Cross",    colors: ["#fafafa", "#dc2626"], shape: "square-cross" },
  { id: "teal-square-diag",   label: "Teal Diagonal",  colors: ["#0d9488", "#fafafa"], shape: "square-diag" },
  { id: "pink-diamond",       label: "Pink Diamond",   colors: ["#ec4899", "#1e293b"], shape: "diamond" },
  { id: "emerald-hex-bars",   label: "Emerald Hex",    colors: ["#059669", "#fafafa"], shape: "hex-bars" },
  { id: "crimson-bars",       label: "Crimson Bars",   colors: ["#b91c1c", "#fafafa"], shape: "shield-bars" },
];

export function getCrest(id: string | null | undefined): CrestDef | undefined {
  if (!id) return undefined;
  return OPPONENT_CRESTS.find((c) => c.id === id);
}

/** Render a crest by id, or a neutral placeholder if missing. */
export function OpponentCrestSvg({
  id,
  size = 28,
  className,
  style,
}: {
  id?: string | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const crest = getCrest(id);
  if (!crest) {
    return <PlaceholderCrest size={size} className={className} style={style} />;
  }
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-label={crest.label}
    >
      <CrestShape def={crest} />
    </svg>
  );
}

function PlaceholderCrest({ size, className, style }: { size: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-label="Unknown opponent">
      <path d="M50 6 L88 18 V52 C88 76 70 90 50 96 C30 90 12 76 12 52 V18 Z"
            fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="3" />
      <text x="50" y="62" textAnchor="middle" fontSize="38" fontWeight="900"
            fill="hsl(var(--muted-foreground))" fontFamily="system-ui, sans-serif">?</text>
    </svg>
  );
}

function CrestShape({ def }: { def: CrestDef }) {
  const [c1, c2] = def.colors;
  const shieldPath = "M50 6 L90 18 V54 C90 78 72 92 50 98 C28 92 10 78 10 54 V18 Z";

  switch (def.shape) {
    case "shield-split":
      return (
        <>
          <defs>
            <clipPath id={`clip-${def.id}`}><path d={shieldPath} /></clipPath>
          </defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect x="0" y="0" width="50" height="100" fill={c1} />
            <rect x="50" y="0" width="50" height="100" fill={c2} />
          </g>
          <path d={shieldPath} fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "shield-stripes":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><path d={shieldPath} /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <rect x="20" y="0" width="14" height="100" fill={c2} />
            <rect x="66" y="0" width="14" height="100" fill={c2} />
          </g>
          <path d={shieldPath} fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "shield-bars":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><path d={shieldPath} /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <rect y="20" width="100" height="14" fill={c2} />
            <rect y="56" width="100" height="14" fill={c2} />
          </g>
          <path d={shieldPath} fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "shield-chevron":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><path d={shieldPath} /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <polygon points="10,90 50,40 90,90 90,100 10,100" fill={c2} />
          </g>
          <path d={shieldPath} fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "shield-star":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><path d={shieldPath} /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <Star cx={50} cy={54} r={26} fill={c2} />
          </g>
          <path d={shieldPath} fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "circle-ring":
      return (
        <>
          <circle cx="50" cy="50" r="44" fill={c1} stroke="#0a0a0a" strokeWidth="3" />
          <circle cx="50" cy="50" r="28" fill="none" stroke={c2} strokeWidth="8" />
        </>
      );
    case "circle-stripes":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><circle cx="50" cy="50" r="44" /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <rect y="22" width="100" height="12" fill={c2} />
            <rect y="44" width="100" height="12" fill={c2} />
            <rect y="66" width="100" height="12" fill={c2} />
          </g>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "circle-star":
      return (
        <>
          <circle cx="50" cy="50" r="44" fill={c1} stroke="#0a0a0a" strokeWidth="3" />
          <Star cx={50} cy={52} r={26} fill={c2} />
        </>
      );
    case "circle-half":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><circle cx="50" cy="50" r="44" /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="50" height="100" fill={c1} />
            <rect x="50" width="50" height="100" fill={c2} />
          </g>
          <circle cx="50" cy="50" r="44" fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "circle-bolt":
      return (
        <>
          <circle cx="50" cy="50" r="44" fill={c1} stroke="#0a0a0a" strokeWidth="3" />
          <polygon points="56,18 32,54 48,54 42,82 70,42 54,42 60,18" fill={c2} />
        </>
      );
    case "square-cross":
      return (
        <>
          <rect x="6" y="6" width="88" height="88" rx="6" fill={c1} stroke="#0a0a0a" strokeWidth="3" />
          <rect x="42" y="14" width="16" height="72" fill={c2} />
          <rect x="14" y="42" width="72" height="16" fill={c2} />
        </>
      );
    case "square-diag":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><rect x="6" y="6" width="88" height="88" rx="6" /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <polygon points="0,100 100,0 100,30 30,100" fill={c2} />
          </g>
          <rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
    case "diamond":
      return (
        <>
          <polygon points="50,4 96,50 50,96 4,50" fill={c1} stroke="#0a0a0a" strokeWidth="3" />
          <polygon points="50,24 76,50 50,76 24,50" fill={c2} />
        </>
      );
    case "hex-bars":
      return (
        <>
          <defs><clipPath id={`clip-${def.id}`}><polygon points="50,4 92,28 92,72 50,96 8,72 8,28" /></clipPath></defs>
          <g clipPath={`url(#clip-${def.id})`}>
            <rect width="100" height="100" fill={c1} />
            <rect y="32" width="100" height="10" fill={c2} />
            <rect y="58" width="100" height="10" fill={c2} />
          </g>
          <polygon points="50,4 92,28 92,72 50,96 8,72 8,28" fill="none" stroke="#0a0a0a" strokeWidth="3" />
        </>
      );
  }
}

function Star({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}
