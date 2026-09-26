import { useLeagueBadge } from "@/hooks/useLeagueBadge";

function initials(text: string, max = 3) {
  return text
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}

export function LeagueBadge({
  league,
  size = 18,
  className = "",
}: {
  league?: string;
  size?: number;
  className?: string;
}) {
  const { badgeUrl } = useLeagueBadge(league);

  if (!league) return null;

  if (badgeUrl) {
    return (
      <img
        src={badgeUrl}
        alt={league}
        title={league}
        width={size}
        height={size}
        loading="lazy"
        className={`object-contain shrink-0 ${className}`}
      />
    );
  }

  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary/40 border border-border/60 shrink-0"
      title={league}
    >
      {initials(league)}
    </span>
  );
}
