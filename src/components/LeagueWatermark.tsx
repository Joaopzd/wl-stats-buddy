import type { SVGProps, ReactElement } from "react";

type MarkComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

function LaLigaMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <text x="50" y="78" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="900" fontSize="78" letterSpacing="-6">LL</text>
    </svg>
  );
}

function BicycleKickMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="32" cy="55" r="6" fill="currentColor" stroke="none" />
      <path d="M38 58 L62 50" />
      <path d="M38 58 L22 70" />
      <path d="M22 70 L14 78" />
      <path d="M62 50 L78 28" />
      <path d="M78 28 L86 18" />
      <path d="M62 50 L68 70" />
      <path d="M68 70 L58 82" />
      <circle cx="88" cy="14" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PLMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <text x="50" y="78" textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic" fontWeight="900" fontSize="78" letterSpacing="-6">PL</text>
    </svg>
  );
}

function ArchesMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" {...props}>
      <path d="M16 88 L16 38 a18 30 0 0 1 36 0 L52 88" />
      <path d="M48 88 L48 38 a18 30 0 0 1 36 0 L84 88" />
    </svg>
  );
}

function CrownMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M10 78 L20 30 L36 56 L50 22 L64 56 L80 30 L90 78 Z" />
      <rect x="10" y="80" width="80" height="8" />
      <circle cx="20" cy="28" r="4" />
      <circle cx="50" cy="20" r="4" />
      <circle cx="80" cy="28" r="4" />
    </svg>
  );
}

function BoltMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M58 6 L20 56 L44 56 L36 94 L80 38 L54 38 Z" />
    </svg>
  );
}

function BallMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" {...props}>
      <circle cx="50" cy="50" r="40" />
      <polygon points="50,30 67,42 60,62 40,62 33,42" fill="currentColor" />
      <path d="M50 10 L50 30 M90 50 L67 42 M77 80 L60 62 M23 80 L40 62 M10 50 L33 42" />
    </svg>
  );
}

function StarMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M50 6 L62 38 L96 38 L68 58 L78 92 L50 72 L22 92 L32 58 L4 38 L38 38 Z" />
    </svg>
  );
}

function ShieldMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M50 6 L88 18 L88 50 C88 72 70 88 50 94 C30 88 12 72 12 50 L12 18 Z" />
    </svg>
  );
}

function FlameMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M50 6 C58 26 78 36 76 60 C74 80 60 94 50 94 C38 94 24 82 24 62 C24 50 32 44 36 48 C34 36 42 24 50 6 Z" />
    </svg>
  );
}

function TrophyMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M30 10 H70 V40 C70 56 60 66 50 66 C40 66 30 56 30 40 Z" />
      <path d="M20 18 H30 V40 H22 C16 40 12 34 12 28 V18 Z M70 18 H88 V28 C88 34 84 40 78 40 H70 Z" />
      <rect x="42" y="66" width="16" height="14" />
      <rect x="30" y="80" width="40" height="8" />
    </svg>
  );
}

function BootMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M14 60 L14 78 C14 84 18 88 24 88 L82 88 C88 88 92 84 92 78 L92 70 C92 64 88 60 82 60 L60 60 L48 40 C44 34 36 32 30 36 L20 42 C14 46 14 52 14 60 Z" />
    </svg>
  );
}

function DiamondMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M50 6 L94 40 L50 94 L6 40 Z" />
    </svg>
  );
}

export interface WatermarkOption {
  id: string;
  label: string;
  Mark: MarkComponent;
}

/** Catalog of user-selectable watermark elements. */
export const WATERMARK_OPTIONS: WatermarkOption[] = [
  { id: "crown", label: "Crown", Mark: CrownMark },
  { id: "trophy", label: "Trophy", Mark: TrophyMark },
  { id: "shield", label: "Shield", Mark: ShieldMark },
  { id: "star", label: "Star", Mark: StarMark },
  { id: "flame", label: "Flame", Mark: FlameMark },
  { id: "bolt", label: "Bolt", Mark: BoltMark },
  { id: "ball", label: "Ball", Mark: BallMark },
  { id: "boot", label: "Boot", Mark: BootMark },
  { id: "diamond", label: "Diamond", Mark: DiamondMark },
  { id: "laliga", label: "LaLiga", Mark: LaLigaMark },
  { id: "premier", label: "Premier", Mark: PLMark },
  { id: "ligue", label: "Ligue 1", Mark: ArchesMark },
  { id: "bundesliga", label: "Bundesliga", Mark: BicycleKickMark },
];

export const WATERMARK_COLOR_PRESETS: string[] = [
  "#F7C534", // gold
  "#E94560", // red
  "#3B82F6", // blue
  "#22C55E", // green
  "#A855F7", // purple
  "#F97316", // orange
  "#06B6D4", // cyan
  "#F472B6", // pink
  "#FFFFFF", // white
];

function pickByTitle(title: string): MarkComponent {
  const t = title.toLowerCase();
  if (t.includes("laliga") || t.includes("la liga")) return LaLigaMark;
  if (t.includes("bundesliga")) return BicycleKickMark;
  if (t.includes("premier")) return PLMark;
  if (t.includes("ligue")) return ArchesMark;
  if (t.includes("ultimate")) return CrownMark;
  if (t.includes("herostorm") || t.includes("hero storm")) return BoltMark;
  return CrownMark;
}

/**
 * Faint silhouette watermark anchored to the bottom-right of a card.
 * Parent MUST be `relative overflow-hidden`. Content should be `relative z-10`.
 * When `markId` is provided, uses the chosen mark; otherwise infers from title.
 * When `color` is provided, applies it (and bumps opacity slightly for visibility).
 */
export function LeagueWatermark({
  title,
  size = 140,
  markId,
  color,
}: {
  title: string;
  size?: number;
  markId?: string;
  color?: string;
}) {
  const chosen = markId
    ? WATERMARK_OPTIONS.find((o) => o.id === markId)?.Mark
    : undefined;
  const Mark = chosen ?? pickByTitle(title);
  const style: React.CSSProperties = color
    ? { width: size, height: size, color, opacity: 0.14 }
    : { width: size, height: size };
  return (
    <Mark
      aria-hidden="true"
      className={`pointer-events-none absolute -right-4 -bottom-4 z-0 ${color ? "" : "text-foreground opacity-[0.06]"}`}
      style={style}
    />
  );
}
