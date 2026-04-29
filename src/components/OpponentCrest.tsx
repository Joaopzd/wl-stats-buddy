import { OpponentCrestSvg } from "@/lib/crests";

/** Render an opponent crest (or neutral placeholder) by id. */
export function OpponentCrest({ id, size = 28, className }: { id?: string | null; size?: number; className?: string }) {
  return <OpponentCrestSvg id={id} size={size} className={className} />;
}
