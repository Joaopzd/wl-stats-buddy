interface Props {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/** Minimalist soccer boot (cleat) icon, diagonal orientation. */
export function SoccerBoot({ className = "", size = 16, strokeWidth = 1.6 }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <g transform="rotate(-30 12 12)">
        {/* Boot upper + sole */}
        <path d="M3 13 L3 9.5 C3 8.7 3.6 8 4.4 8 L11 8 C13 8 14.4 8.6 15.8 9.6 L19.2 12 C20 12.6 20.5 13.4 20.5 14.3 L20.5 15 C20.5 15.8 19.8 16.5 19 16.5 L4.4 16.5 C3.6 16.5 3 15.8 3 15 Z" />
        {/* Studs */}
        <circle cx="6" cy="18" r="0.6" fill="currentColor" />
        <circle cx="10" cy="18" r="0.6" fill="currentColor" />
        <circle cx="14" cy="18" r="0.6" fill="currentColor" />
        <circle cx="18" cy="18" r="0.6" fill="currentColor" />
      </g>
    </svg>
  );
}
