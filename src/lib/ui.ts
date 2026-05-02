/**
 * Shared UI sizing tokens. Keeping these in one place ensures the "Versus"
 * crests stay perfectly aligned across Match History, Match Details and the
 * Match Report Pop-Up at every responsive breakpoint.
 */
export const CREST_SIZE = {
  /** Match History list rows */
  list: 22,
  /** Match Dialog versus header */
  dialog: 48,
  /** Match Detail Modal & Report Modal versus header */
  detail: 64,
} as const;
