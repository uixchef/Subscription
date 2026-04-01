import {
  postcodeValidator,
  postcodeValidatorExistsForCountry,
} from "postcode-validator";

import {
  POSTAL_MSG_FORMAT,
  POSTAL_MSG_REQUIRED,
  type PostalValidationResult,
} from "@/components/subscriptions/postal-validation-messages";

export type { PostalValidationResult } from "@/components/subscriptions/postal-validation-messages";

/** India: 6-digit PIN; no reliable open dataset for PIN→state in-app — format only. */
const RE_IN = /^\d{6}$/;

/** Australia: 4 digits. */
const RE_AU = /^\d{4}$/;

/** Germany / France / Mexico: 5 digits. */
const RE_DE_FR_MX = /^\d{5}$/;

/** Brazil CEP: #####-### or ######## */
function isValidBrazilCep(z: string): boolean {
  const m = z.match(/^(\d{5})-?(\d{3})$/);
  return Boolean(m);
}

function validateIndia(zip: string): PostalValidationResult {
  if (!RE_IN.test(zip.trim())) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return { ok: true };
}

function validateUK(zip: string): PostalValidationResult {
  const z = zip.trim();
  if (/^gir\s*0aa$/i.test(z.replace(/\s+/g, " "))) {
    return { ok: true };
  }
  const RE_UK_SIMPLE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  if (!RE_UK_SIMPLE.test(z)) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return { ok: true };
}

function validateAU(zip: string): PostalValidationResult {
  if (!RE_AU.test(zip.trim())) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return { ok: true };
}

function validateDE_FR_MX(zip: string): PostalValidationResult {
  if (!RE_DE_FR_MX.test(zip.trim())) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return { ok: true };
}

function validateBR(zip: string): PostalValidationResult {
  if (!isValidBrazilCep(zip.trim())) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return { ok: true };
}

/** Lenient fallback when no country-specific rule exists (rare ISOs). */
function validateGeneric(zip: string): PostalValidationResult {
  const z = zip.trim();
  if (z.length < 2 || z.length > 12) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9\s-]*[A-Za-z0-9])?$/.test(z)) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return { ok: true };
}

/**
 * Countries missing from `postcode-validator` but with a documented national format.
 * (State/province vs code is not verified here — only shape for that country.)
 */
const POSTAL_REGEX_BY_ISO: Record<string, RegExp> = {
  /** Angola — 4-digit CODIGO POSTAL */
  AO: /^\d{4}$/,
};

/** Default branch: library regex per ISO, then supplemental map, then generic. */
function validateDefaultInternational(
  countryCode: string,
  zipTrimmed: string
): PostalValidationResult {
  if (postcodeValidatorExistsForCountry(countryCode)) {
    const ok = postcodeValidator(zipTrimmed, countryCode);
    return ok ? { ok: true } : { ok: false, message: POSTAL_MSG_FORMAT };
  }
  const rule = POSTAL_REGEX_BY_ISO[countryCode];
  if (rule) {
    return rule.test(zipTrimmed)
      ? { ok: true }
      : { ok: false, message: POSTAL_MSG_FORMAT };
  }
  return validateGeneric(zipTrimmed);
}

/**
 * Validates postal/ZIP for the selected ISO country and region.
 * US & Canada: ZIP database + region match. US territories: ZIP ↔ territory.
 * Other countries: `postcode-validator` when available, else supplemental regex (e.g. AO), else generic.
 * Province/state vs code is only enforced where we have data (notably US/CA).
 */
export async function validatePostalForLocation(input: {
  countryCode: string;
  state: string;
  zip: string;
}): Promise<PostalValidationResult> {
  const zip = input.zip.trim();
  if (!zip) {
    return { ok: false, message: POSTAL_MSG_REQUIRED };
  }

  const code = input.countryCode.toUpperCase();

  switch (code) {
    case "US":
    case "CA": {
      const { validateUS, validateCanada } = await import(
        "@/components/subscriptions/postal-validation-us-ca"
      );
      return code === "US"
        ? validateUS(input.state, zip)
        : validateCanada(input.state, zip);
    }
    case "IN":
      return validateIndia(zip);
    case "GB":
      return validateUK(zip);
    case "AU":
      return validateAU(zip);
    case "DE":
    case "FR":
    case "MX":
      return validateDE_FR_MX(zip);
    case "BR":
      return validateBR(zip);
    case "AS":
    case "GU":
    case "MP":
    case "PR":
    case "VI": {
      const { validateUSTerritory } = await import(
        "@/components/subscriptions/postal-validation-us-ca"
      );
      return validateUSTerritory(code, zip);
    }
    default:
      return validateDefaultInternational(code, zip);
  }
}
