import { flagEmoji, countryName } from "@/lib/countries";

/**
 * Inline flag component. Renders the country emoji glyph + optional name.
 * Falls back to a neutral 🌍 globe when no nationality is set.
 */
export function Flag({
  code,
  showName = false,
  size = "sm",
  className = "",
}: {
  code?: string | null;
  showName?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "xs" ? "text-xs" :
    size === "sm" ? "text-base" :
    size === "md" ? "text-xl" :
    "text-2xl";
  const glyph = flagEmoji(code ?? "") || "🌍";
  if (showName) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className={`${sizeClass} leading-none`} aria-hidden>{glyph}</span>
        <span className="text-xs">{code ? countryName(code) : "—"}</span>
      </span>
    );
  }
  return (
    <span
      className={`${sizeClass} leading-none inline-block ${className}`}
      title={code ? countryName(code) : "Unknown"}
      aria-label={code ? countryName(code) : "Unknown"}
    >
      {glyph}
    </span>
  );
}
