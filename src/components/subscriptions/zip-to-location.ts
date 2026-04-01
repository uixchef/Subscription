import zipcodes from "zipcodes";

import {
  COUNTRIES,
  STATES_BY_COUNTRY,
  statesForCountry,
} from "@/components/subscriptions/country-state-data";

/** Runtime export includes `abbr`; package typings omit it. */
const zipStateAbbr = (
  zipcodes.states as typeof zipcodes.states & {
    abbr: Record<string, string>;
  }
).abbr;

const US_STATES = STATES_BY_COUNTRY["United States of America"];
const CA_PROVINCES = STATES_BY_COUNTRY.Canada;

const US_COUNTRY_NAME =
  COUNTRIES.find((c) => c.code === "US")?.name ?? "United States of America";
const CA_COUNTRY_NAME =
  COUNTRIES.find((c) => c.code === "CA")?.name ?? "Canada";

/** ZIP data marks territories with these `state` codes; `zipcodes.states.abbr` omits them. */
const US_TERRITORY_ZIP_CODES = new Set(["AS", "GU", "MP", "PR", "VI"]);

function usAbbrToStateName(abbr: string): string | undefined {
  const key = zipStateAbbr[abbr.toUpperCase()];
  if (!key) return undefined;
  return US_STATES.find((s) => s.toUpperCase() === key.replace(/_/g, " "));
}

function territoryIsoFromZipState(code: string): string | undefined {
  const c = code.toUpperCase();
  if (!US_TERRITORY_ZIP_CODES.has(c)) return undefined;
  return COUNTRIES.some((x) => x.code === c) ? c : undefined;
}

export type ZipInferenceResult =
  | {
      kind: "match";
      /** ISO 3166-1 alpha-2 (US, CA, or US territory: PR, GU, …). */
      iso2: string;
      countryName: string;
      state: string;
      normalizedZip: string;
    }
  | { kind: "not_found"; region: "US" | "CA" }
  | { kind: "bad_format"; region: "US" | "CA" }
  | { kind: "neutral" };

/** `#####`, `#####-####`, or nine digits without a hyphen (e.g. `902101234`). */
function parseUsZipParts(raw: string): { zip5: string; ext?: string } | null {
  const t = raw.trim();
  const hyphen = t.match(/^(\d{5})(?:-(\d{4}))?$/);
  if (hyphen) {
    const zip5 = hyphen[1];
    const ext = hyphen[2];
    if (ext !== undefined && ext.length !== 4) {
      return null;
    }
    return { zip5, ext };
  }
  if (/^\d{9}$/.test(t)) {
    return { zip5: t.slice(0, 5), ext: t.slice(5) };
  }
  return null;
}

/**
 * True when the string is a complete US or Canadian postal pattern (not a partial while typing).
 * Used to debounce zip-first autofill without flagging errors mid-input.
 */
export function zipLooksCompleteForInference(raw: string): boolean {
  const t = raw.trim();
  if (parseUsZipParts(t) !== null) return true;
  const compact = t.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact);
}

/**
 * Resolves US / Canada / US-affiliated territory ZIP or postal codes via `zipcodes`.
 * Used for zip-first country/state autofill and for “looks like US/CA but unknown” errors.
 */
export function inferLocationFromZip(raw: string): ZipInferenceResult {
  const t = raw.trim();
  const usParts = parseUsZipParts(t);
  if (usParts) {
    const zip5 = usParts.zip5;
    const ext = usParts.ext;
    const loc = zipcodes.lookup(zip5);
    if (!loc || loc.country !== "US") {
      return { kind: "not_found", region: "US" };
    }

    const territoryIso = territoryIsoFromZipState(loc.state);
    if (territoryIso) {
      const countryName = COUNTRIES.find((c) => c.code === territoryIso)?.name;
      if (!countryName) {
        return { kind: "not_found", region: "US" };
      }
      const regions = statesForCountry(countryName, territoryIso);
      const state = regions[0] ?? "";
      let normalizedZip = zip5;
      if (ext) normalizedZip = `${zip5}-${ext}`;
      return {
        kind: "match",
        iso2: territoryIso,
        countryName,
        state,
        normalizedZip,
      };
    }

    const stateFull = usAbbrToStateName(loc.state);
    if (!stateFull) {
      return { kind: "not_found", region: "US" };
    }
    let normalizedZip = zip5;
    if (ext) normalizedZip = `${zip5}-${ext}`;
    return {
      kind: "match",
      iso2: "US",
      countryName: US_COUNTRY_NAME,
      state: stateFull,
      normalizedZip,
    };
  }

  const compact = t.replace(/\s/g, "").toUpperCase();
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) {
    const loc = zipcodes.lookup(compact);
    if (!loc || loc.country !== "Canada") {
      return { kind: "not_found", region: "CA" };
    }
    const matched = CA_PROVINCES.find(
      (p) => p.toLowerCase() === loc.state.toLowerCase()
    );
    if (!matched) {
      return { kind: "not_found", region: "CA" };
    }
    const normalizedZip = `${compact.slice(0, 3)} ${compact.slice(3)}`;
    return {
      kind: "match",
      iso2: "CA",
      countryName: CA_COUNTRY_NAME,
      state: matched,
      normalizedZip,
    };
  }

  return { kind: "neutral" };
}
