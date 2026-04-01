import { allCountries } from "country-region-data";

import isoCountries from "@/components/subscriptions/data/iso-countries.json";

type IsoRow = {
  name: string;
  "alpha-2": string;
};

export type CountryOption = {
  name: string;
  code: string;
};

/** Unicode regional indicator symbols from ISO 3166-1 alpha-2 */
export function countryFlagEmoji(iso2: string): string {
  const c = iso2.toUpperCase();
  if (c.length !== 2 || !/^[A-Z]{2}$/.test(c)) return "🏳️";
  const base = 0x1f1e6 - 65;
  return String.fromCodePoint(
    base + c.charCodeAt(0),
    base + c.charCodeAt(1)
  );
}

export const COUNTRIES: CountryOption[] = (isoCountries as IsoRow[])
  .map((r) => ({ name: r.name, code: r["alpha-2"] }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Stored demo / legacy labels → ISO list names in `iso-countries.json` */
const LEGACY_COUNTRY_ALIASES: Record<string, string> = {
  "United States": "United States of America",
  "United Kingdom": "United Kingdom of Great Britain and Northern Ireland",
  USA: "United States of America",
  UK: "United Kingdom of Great Britain and Northern Ireland",
  US: "United States of America",
  GB: "United Kingdom of Great Britain and Northern Ireland",
};

export function normalizeCountryName(stored: string): string {
  const fromAlias = LEGACY_COUNTRY_ALIASES[stored.trim()];
  if (fromAlias) {
    const hit = COUNTRIES.find((c) => c.name === fromAlias);
    if (hit) return hit.name;
  }
  const exact = COUNTRIES.find((c) => c.name === stored.trim());
  if (exact) return exact.name;
  return stored.trim();
}

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
] as const;

const IN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

const UK_REGIONS = [
  "England",
  "Northern Ireland",
  "Scotland",
  "Wales",
] as const;

const CA_PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
] as const;

const AU_STATES = [
  "Australian Capital Territory",
  "New South Wales",
  "Northern Territory",
  "Queensland",
  "South Australia",
  "Tasmania",
  "Victoria",
  "Western Australia",
] as const;

const DE_STATES = [
  "Baden-Württemberg",
  "Bavaria",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hesse",
  "Lower Saxony",
  "Mecklenburg-Vorpommern",
  "North Rhine-Westphalia",
  "Rhineland-Palatinate",
  "Saarland",
  "Saxony",
  "Saxony-Anhalt",
  "Schleswig-Holstein",
  "Thuringia",
] as const;

const FR_REGIONS = [
  "Auvergne-Rhône-Alpes",
  "Bourgogne-Franche-Comté",
  "Brittany",
  "Centre-Val de Loire",
  "Corsica",
  "Grand Est",
  "Hauts-de-France",
  "Île-de-France",
  "Normandy",
  "Nouvelle-Aquitaine",
  "Occitanie",
  "Pays de la Loire",
  "Provence-Alpes-Côte d'Azur",
] as const;

const BR_STATES = [
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins",
] as const;

const MX_STATES = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Coahuila",
  "Colima",
  "Durango",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "México",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas",
  "Mexico City",
] as const;

/** ISO English country name → administrative divisions (curated; takes precedence over dataset) */
export const STATES_BY_COUNTRY: Record<string, readonly string[]> = {
  "United States of America": US_STATES,
  India: IN_STATES,
  "United Kingdom of Great Britain and Northern Ireland": UK_REGIONS,
  Canada: CA_PROVINCES,
  Australia: AU_STATES,
  Germany: DE_STATES,
  France: FR_REGIONS,
  Brazil: BR_STATES,
  Mexico: MX_STATES,
};

type CountryRegionRow = readonly [string, string, readonly [string, string][]];

function buildRegionsByIso2(): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const row of allCountries as unknown as CountryRegionRow[]) {
    const [, code, regions] = row;
    if (!regions?.length) continue;
    const names = [...regions]
      .map((r) => r[0])
      .sort((a, b) => a.localeCompare(b));
    m.set(code.toUpperCase(), names);
  }
  return m;
}

const REGIONS_BY_ISO2 = buildRegionsByIso2();

/**
 * Regions/states for addressing. Uses curated lists where defined; otherwise ISO-3166-2–style
 * regions from `country-region-data` keyed by ISO alpha-2 (`iso2Hint`).
 */
export function statesForCountry(countryName: string, iso2Hint?: string): string[] {
  const normalized = normalizeCountryName(countryName.trim());
  const curated = STATES_BY_COUNTRY[normalized];
  if (curated) return [...curated];

  const code = (
    iso2Hint ?? COUNTRIES.find((c) => c.name === normalized)?.code
  )?.toUpperCase();
  if (!code) return [];
  const fromDataset = REGIONS_BY_ISO2.get(code);
  return fromDataset ? [...fromDataset] : [];
}
