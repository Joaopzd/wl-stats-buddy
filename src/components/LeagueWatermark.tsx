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

/** Italic "PL" mark — Premier League. */
function PLMark(props: SVGProps<SVGSVGElement>) {
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
        PL
      </text>
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

function pickMark(title: string): (props: SVGProps<SVGSVGElement>) => ReactElement {
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
