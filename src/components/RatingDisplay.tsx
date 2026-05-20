import { AlertTriangle } from "lucide-react";
import { performanceStatus, type PerformanceStatus } from "@/lib/stats";

export function ratingTone(status: PerformanceStatus, rating: number): string {
  if (status === "critical") return "text-warn-critical";
  if (status === "caution") return "text-warn-caution";
  if (rating >= 8) return "text-primary";
  if (rating >= 6.5) return "text-foreground";
  return "text-muted-foreground";
}

/**
 * Renders an average match rating with the Underperforming Player Warning
 * applied — critical (red + ⚠) when avg < 6.0, caution (amber) when 6.0–6.4.
 * Both gates require at least 9 matches played, per the diagnostic spec.
 */
export function RatingDisplay({
  matches,
  ratedMatches,
  avgRating,
  size = "sm",
  showIcon = true,
  decimals = 2,
  emptyLabel = "—",
}: {
  matches: number;
  ratedMatches: number;
  avgRating: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  decimals?: number;
  emptyLabel?: string;
}) {
  const status = performanceStatus({ matches, ratedMatches, avgRating });
  const tone = ratingTone(status, avgRating);
  const iconSize = size === "lg" ? "h-4 w-4" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  if (avgRating <= 0 || ratedMatches === 0) {
    return <span className="text-muted-foreground/60">{emptyLabel}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${tone}`}>
      {showIcon && status === "critical" && (
        <AlertTriangle className={iconSize} aria-label="Underperforming" />
      )}
      {avgRating.toFixed(decimals)}
    </span>
  );
}
