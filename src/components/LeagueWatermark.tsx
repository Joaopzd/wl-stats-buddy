import type { SVGProps, ReactElement } from "react";

/** Italic "LL" mark — La Liga. */
function LaLigaMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <text
        x="50"
        y="78"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="900"
        fontSize="78"
        letterSpacing="-6"
      >
        LL
      </text>
    </svg>
  );
}

/** Stylized bicycle-kick silhouette — Bundesliga. */
function BicycleKickMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* head */}
      <circle cx="32" cy="55" r="6" fill="currentColor" stroke="none" />
      {/* torso (leaning back/horizontal) */}
      <path d="M38 58 L62 50" />
      {/* upper arm reaching back */}
      <path d="M38 58 L22 70" />
      <path d="M22 70 L14 78" />
      {/* lower (kicking) leg */}
      <path d="M62 50 L78 28" />
      <path d="M78 28 L86 18" />
      {/* support leg bent */}
      <path d="M62 50 L68 70" />
      <path d="M68 70 L58 82" />
      {/* ball */}
      <circle cx="88" cy="14" r="6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Heraldic medieval lion silhouette — Premier League. */
function LionMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M50 8 c-4 0 -6 3 -7 6 c-3 -2 -7 -2 -9 1 c-2 3 -1 7 1 9 c-5 1 -9 5 -10 11 c-1 5 1 10 4 13 c-3 2 -5 6 -5 11 c0 4 2 8 5 10 c-2 2 -3 5 -3 9 c0 6 4 11 9 13 l3 1 l1 8 l4 -1 l1 -6 l8 0 l1 6 l4 1 l1 -8 l3 -1 c5 -2 9 -7 9 -13 c0 -4 -1 -7 -3 -9 c3 -2 5 -6 5 -10 c0 -5 -2 -9 -5 -11 c3 -3 5 -8 4 -13 c-1 -6 -5 -10 -10 -11 c2 -2 3 -6 1 -9 c-2 -3 -6 -3 -9 -1 c-1 -3 -3 -6 -7 -6 z M42 42 c1 -2 3 -3 5 -3 c2 0 4 1 5 3 c-2 1 -3 1 -5 1 c-2 0 -3 0 -5 -1 z M37 50 c2 0 3 1 3 3 c0 2 -1 3 -3 3 c-2 0 -3 -1 -3 -3 c0 -2 1 -3 3 -3 z M63 50 c2 0 3 1 3 3 c0 2 -1 3 -3 3 c-2 0 -3 -1 -3 -3 c0 -2 1 -3 3 -3 z M50 60 c3 0 5 2 5 4 c0 1 -2 2 -5 2 c-3 0 -5 -1 -5 -2 c0 -2 2 -4 5 -4 z" />
    </svg>
  );
}

/** Golden-arches "M" — Ligue 1. */
function ArchesMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" {...props}>
      <path d="M16 88 L16 38 a18 30 0 0 1 36 0 L52 88" />
      <path d="M48 88 L48 38 a18 30 0 0 1 36 0 L84 88" />
    </svg>
  );
}

/** Crown — Ultimate. */
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

/** Lightning bolt — HeroStorm. */
function BoltMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" {...props}>
      <path d="M58 6 L20 56 L44 56 L36 94 L80 38 L54 38 Z" />
    </svg>
  );
}

function pickMark(title: string): (props: SVGProps<SVGSVGElement>) => React.ReactElement {
  const t = title.toLowerCase();
  if (t.includes("laliga") || t.includes("la liga")) return LaLigaMark;
  if (t.includes("bundesliga")) return BicycleKickMark;
  if (t.includes("premier")) return LionMark;
  if (t.includes("ligue")) return ArchesMark;
  if (t.includes("ultimate")) return CrownMark;
  if (t.includes("herostorm") || t.includes("hero storm")) return BoltMark;
  return CrownMark;
}

/**
 * Faint league silhouette watermark anchored to the bottom-right of a card.
 * Parent MUST be `relative overflow-hidden`. Sits behind content (z-0).
 * Card content should be wrapped in a `relative z-10` container to stay above.
 */
export function LeagueWatermark({ title, size = 140 }: { title: string; size?: number }) {
  const Mark = pickMark(title);
  return (
    <Mark
      aria-hidden="true"
      className="pointer-events-none absolute -right-4 -bottom-4 z-0 text-foreground opacity-[0.06]"
      style={{ width: size, height: size }}
    />
  );
}
