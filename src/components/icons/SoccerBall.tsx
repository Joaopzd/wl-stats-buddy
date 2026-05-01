interface Props {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/** Minimalist soccer ball icon. */
export function SoccerBall({ className = "", size = 16, strokeWidth = 1.6 }: Props) {
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
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="12,8 15.5,10.6 14.2,14.7 9.8,14.7 8.5,10.6" />
      <line x1="12" y1="8" x2="12" y2="4" />
      <line x1="15.5" y1="10.6" x2="19.3" y2="9.4" />
      <line x1="14.2" y1="14.7" x2="16.7" y2="18" />
      <line x1="9.8" y1="14.7" x2="7.3" y2="18" />
      <line x1="8.5" y1="10.6" x2="4.7" y2="9.4" />
    </svg>
  );
}
