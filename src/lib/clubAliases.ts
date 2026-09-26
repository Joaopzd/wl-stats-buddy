/**
 * Apelidos/abreviações de clubes → nome "oficial" usado para buscar na TheSportsDB.
 *
 * Como usar: se um clube não estiver trazendo a badge certa (ou nenhuma), abra o
 * Console do navegador — o hook `useTeamBadge` loga um aviso com o nome que foi
 * buscado e a resposta da API. Se for caso de apelido, adicione uma entrada aqui
 * (chave sempre em minúsculas). Se for caso de nome ambíguo (ex.: "Arsenal" tem
 * clubes na Inglaterra, Rússia e Argentina), normalmente nem precisa mexer aqui —
 * o hook já prioriza o time mais popular (`intLoved`) entre os resultados.
 */
export const CLUB_ALIASES: Record<string, string> = {
  // Inglaterra
  "man city": "Manchester City",
  "man utd": "Manchester United",
  "man united": "Manchester United",
  "spurs": "Tottenham Hotspur",
  "tottenham": "Tottenham Hotspur",
  "wolves": "Wolverhampton Wanderers",
  "nottm forest": "Nottingham Forest",
  "newcastle": "Newcastle United",
  "west ham": "West Ham United",
  "leicester": "Leicester City",

  // Espanha
  "real madrid": "Real Madrid",
  "barca": "Barcelona",
  "barça": "Barcelona",
  "atleti": "Atletico Madrid",
  "atletico madrid": "Atletico Madrid",
  "atlético madrid": "Atletico Madrid",

  // Itália
  "juve": "Juventus",
  "inter": "Inter Milan",
  "inter milan": "Inter Milan",
  "milan": "AC Milan",

  // Alemanha
  "bayern": "Bayern Munich",
  "bayern münchen": "Bayern Munich",
  "dortmund": "Borussia Dortmund",
  "bvb": "Borussia Dortmund",

  // França
  "Paris SG": "Paris Saint-Germain",

  // Brasil (nomes populares que às vezes não batem direto)
  "flamengo": "Flamengo",
  "corinthians": "Corinthians",
  "vasco": "Vasco da Gama",
  "atletico mg": "Atletico Mineiro",
  "atlético mg": "Atletico Mineiro",
  "atletico-mg": "Atletico Mineiro",
  "gremio": "Gremio",
  "grêmio": "Gremio",
};

/** Resolve o termo de busca a partir do nome de clube salvo no seu app. */
export function resolveClubSearchTerm(club: string): string {
  const alias = CLUB_ALIASES[club.trim().toLowerCase()];
  return alias ?? club;
}
