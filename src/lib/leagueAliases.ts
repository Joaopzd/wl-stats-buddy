/**
 * Apelidos/nomes curtos de liga → nome "oficial" na TheSportsDB.
 * Mesmo esquema do clubAliases.ts: se uma liga não estiver trazendo o escudo,
 * olhe o aviso no Console e adicione o caso aqui (chave em minúsculas).
 */
export const LEAGUE_ALIASES: Record<string, string> = {
  "premier league": "English Premier League",
  "epl": "English Premier League",
  "la liga": "Spanish La Liga",
  "laliga": "Spanish La Liga",
  "serie a": "Italian Serie A",
  "bundesliga": "German Bundesliga",
  "ligue 1": "French Ligue 1",
  "brasileirao": "Brazilian Serie A",
  "brasileirão": "Brazilian Serie A",
  "eredivisie": "Dutch Eredivisie",
  "primeira liga": "Portuguese Primeira Liga",
  "liga portugal": "Portuguese Primeira Liga",
  "mls": "American Major League Soccer",
  "champions league": "UEFA Champions League",
  "uefa champions league": "UEFA Champions League",
  "europa league": "UEFA Europa League",
};

export function resolveLeagueSearchTerm(league: string): string {
  const alias = LEAGUE_ALIASES[league.trim().toLowerCase()];
  return alias ?? league;
}
