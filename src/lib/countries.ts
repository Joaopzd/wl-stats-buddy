export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
}

export function flagEmoji(code: string): string {
  const upper = code.toUpperCase();
  if (upper.length !== 2) return "";
  return upper
    .split("")
    .map((char) => String.fromCodePoint(0x1f1a5 + char.charCodeAt(0)))
    .join("");
}

export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afeganistão" },
  { code: "ZA", name: "África do Sul" },
  { code: "AL", name: "Albânia" },
  { code: "DE", name: "Alemanha" },
  { code: "AD", name: "Andorra" },
  { code: "AO", name: "Angola" },
  { code: "AR", name: "Argentina" },
  { code: "AM", name: "Armênia" },
  { code: "AU", name: "Austrália" },
  { code: "AT", name: "Áustria" },
  { code: "BE", name: "Bélgica" },
  { code: "BO", name: "Bolívia" },
  { code: "BA", name: "Bósnia e Herzegovina" },
  { code: "BR", name: "Brasil" },
  { code: "BG", name: "Bulgária" },
  { code: "CM", name: "Camarões" },
  { code: "CA", name: "Canadá" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colômbia" },
  { code: "KR", name: "Coreia do Sul" },
  { code: "CR", name: "Costa Rica" },
  { code: "HR", name: "Croácia" },
  { code: "DK", name: "Dinamarca" },
  { code: "EG", name: "Egito" },
  { code: "EC", name: "Equador" },
  { code: "ES", name: "Espanha" },
  { code: "US", name: "Estados Unidos" },
  { code: "FR", name: "França" },
  { code: "GA", name: "Gabão" },
  { code: "GH", name: "Gana" },
  { code: "GR", name: "Grécia" },
  { code: "GT", name: "Guatemala" },
  { code: "HN", name: "Honduras" },
  { code: "HU", name: "Hungria" },
  { code: "IN", name: "Índia" },
  { code: "IE", name: "Irlanda" },
  { code: "IS", name: "Islândia" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Itália" },
  { code: "JM", name: "Jamaica" },
  { code: "JP", name: "Japão" },
  { code: "MX", name: "México" },
  { code: "MA", name: "Marrocos" },
  { code: "NG", name: "Nigéria" },
  { code: "NO", name: "Noruega" },
  { code: "NZ", name: "Nova Zelândia" },
  { code: "NL", name: "Países Baixos" },
  { code: "PA", name: "Panamá" },
  { code: "PY", name: "Paraguai" },
  { code: "PE", name: "Peru" },
  { code: "PL", name: "Polônia" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "Reino Unido" },
  { code: "CZ", name: "República Tcheca" },
  { code: "RO", name: "Romênia" },
  { code: "RU", name: "Rússia" },
  { code: "SN", name: "Senegal" },
  { code: "RS", name: "Sérvia" },
  { code: "SE", name: "Suécia" },
  { code: "CH", name: "Suíça" },
  { code: "TR", name: "Turquia" },
  { code: "UA", name: "Ucrânia" },
  { code: "UY", name: "Uruguai" },
  { code: "VE", name: "Venezuela" },
  { code: "ZM", name: "Zâmbia" },
  { code: "ZW", name: "Zimbábue" },
].map((c) => ({ ...c, flag: flagEmoji(c.code) }));

const COUNTRY_BY_NAME = new Map(COUNTRIES.map((c) => [c.name, c]));

export function countryByName(name?: string | null): Country | undefined {
  if (!name) return undefined;
  return COUNTRY_BY_NAME.get(name);
}

export function countryFlag(name?: string | null): string {
  return countryByName(name)?.flag ?? "";
}
