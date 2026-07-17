import { countryByName } from "@/lib/countries";

/**
 * Renders a country flag using flagcdn.com images so Windows browsers
 * (which don't have flag emoji glyphs) can display them.
 */
export function Flag({
  country,
  className = "w-5 h-3.5",
  width = 40,
}: {
  country?: string | null;
  className?: string;
  width?: 20 | 40 | 80;
}) {
  const c = countryByName(country);
  if (!c) return null;
  return (
    <img
      src={`https://flagcdn.com/w${width}/${c.code}.png`}
      srcSet={`https://flagcdn.com/w${width * 2}/${c.code}.png 2x`}
      alt={c.name}
      loading="lazy"
      decoding="async"
      className={`${className} inline-block rounded-sm object-cover shadow-[0_0_0_1px_hsl(var(--border))] align-middle`}
    />
  );
}
