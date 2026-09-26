import { useTeamBadge } from "@/hooks/useTeamBadge";

function initials(text: string, max = 3) {
  return text
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, max)
    .toUpperCase();
}

export function ClubBadge({
  club,
  size = 18,
  className = "",
}: {
  club?: string;
  size?: number;
  className?: string;
}) {
  const { badgeUrl } = useTeamBadge(club);

  if (!club) return null;

  if (badgeUrl) {
    return (
      <img
        src={badgeUrl}
        alt={club}
        title={club}
        width={size}
        height={size}
        loading="lazy"
        className={`object-contain shrink-0 ${className}`}
      />
    );
  }

  // Fallback enquanto carrega ou se o time não for encontrado na TheSportsDB
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-secondary/70 border border-border shrink-0"
      title={club}
    >
      {initials(club)}
    </span>
  );
}
