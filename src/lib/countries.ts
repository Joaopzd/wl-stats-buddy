export interface Country {
  code: string; // ISO 3166-1 alpha-2 (lowercase for flagcdn)
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: "af", name: "Afghanistan" },
  { code: "al", name: "Albania" },
  { code: "dz", name: "Algeria" },
  { code: "ad", name: "Andorra" },
  { code: "ao", name: "Angola" },
  { code: "ar", name: "Argentina" },
  { code: "am", name: "Armenia" },
  { code: "au", name: "Australia" },
  { code: "at", name: "Austria" },
  { code: "be", name: "Belgium" },
  { code: "bo", name: "Bolivia" },
  { code: "ba", name: "Bosnia and Herzegovina" },
  { code: "br", name: "Brazil" },
  { code: "bg", name: "Bulgaria" },
  { code: "cm", name: "Cameroon" },
  { code: "ca", name: "Canada" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "cr", name: "Costa Rica" },
  { code: "hr", name: "Croatia" },
  { code: "cz", name: "Czech Republic" },
  { code: "dk", name: "Denmark" },
  { code: "ec", name: "Ecuador" },
  { code: "eg", name: "Egypt" },
  { code: "gb-eng", name: "England" },
  { code: "fi", name: "Finland" },
  { code: "fr", name: "France" },
  { code: "ga", name: "Gabon" },
  { code: "de", name: "Germany" },
  { code: "gh", name: "Ghana" },
  { code: "gr", name: "Greece" },
  { code: "gt", name: "Guatemala" },
  { code: "hn", name: "Honduras" },
  { code: "hu", name: "Hungary" },
  { code: "is", name: "Iceland" },
  { code: "in", name: "India" },
  { code: "ie", name: "Ireland" },
  { code: "il", name: "Israel" },
  { code: "it", name: "Italy" },
  { code: "jm", name: "Jamaica" },
  { code: "jp", name: "Japan" },
  { code: "mx", name: "Mexico" },
  { code: "ma", name: "Morocco" },
  { code: "nl", name: "Netherlands" },
  { code: "nz", name: "New Zealand" },
  { code: "ng", name: "Nigeria" },
  { code: "gb-nir", name: "Northern Ireland" },
  { code: "no", name: "Norway" },
  { code: "pa", name: "Panama" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Peru" },
  { code: "pl", name: "Poland" },
  { code: "pt", name: "Portugal" },
  { code: "ro", name: "Romania" },
  { code: "ru", name: "Russia" },
  { code: "gb-sct", name: "Scotland" },
  { code: "sn", name: "Senegal" },
  { code: "rs", name: "Serbia" },
  { code: "za", name: "South Africa" },
  { code: "kr", name: "South Korea" },
  { code: "es", name: "Spain" },
  { code: "se", name: "Sweden" },
  { code: "ch", name: "Switzerland" },
  { code: "tr", name: "Turkey" },
  { code: "ua", name: "Ukraine" },
  { code: "gb", name: "United Kingdom" },
  { code: "us", name: "United States" },
  { code: "uy", name: "Uruguay" },
  { code: "ve", name: "Venezuela" },
  { code: "gb-wls", name: "Wales" },
  { code: "zm", name: "Zambia" },
  { code: "zw", name: "Zimbabwe" },
];

const BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c]));

export function countryByName(name?: string | null): Country | undefined {
  if (!name) return undefined;
  return BY_NAME.get(name);
}

/** flagcdn image URL for a country name; returns empty string if unknown. */
export function countryFlagUrl(name?: string | null, width: 20 | 40 | 80 = 40): string {
  const c = countryByName(name);
  if (!c) return "";
  return `https://flagcdn.com/w${width}/${c.code}.png`;
}
