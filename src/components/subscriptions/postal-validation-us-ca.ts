import zipcodes from "zipcodes";

import {
  POSTAL_MSG_FORMAT,
  POSTAL_MSG_NOT_FOUND,
  POSTAL_MSG_REGION_MISMATCH,
  type PostalValidationResult,
} from "@/components/subscriptions/postal-validation-messages";

export function validateUS(state: string, zip: string): PostalValidationResult {
  const t = zip.trim();
  const m = t.match(/^(\d{5})(?:-(\d{4}))?$/);
  if (!m) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  const zip5 = m[1];
  if (m[2] !== undefined && m[2].length !== 4) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  const loc = zipcodes.lookup(zip5);
  if (!loc || loc.country !== "US") {
    return { ok: false, message: POSTAL_MSG_NOT_FOUND };
  }
  const st = state.trim();
  if (st) {
    const expected = zipcodes.states.normalize(st);
    if (loc.state !== expected) {
      return { ok: false, message: POSTAL_MSG_REGION_MISMATCH };
    }
  }
  return { ok: true };
}

/**
 * US-affiliated territories (ISO AS, GU, MP, PR, VI): same 5+4 ZIP shape as US;
 * `zipcodes` stores them with `country: "US"` and `state` = territory code (e.g. AS).
 * Region names in our UI (e.g. Tutuila) do not match `zipcodes.states` — validate by ZIP ↔ territory only.
 */
export function validateUSTerritory(
  territoryCode: string,
  zip: string
): PostalValidationResult {
  const tc = territoryCode.toUpperCase();
  const t = zip.trim();
  const m = t.match(/^(\d{5})(?:-(\d{4}))?$/);
  if (!m) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  const zip5 = m[1];
  if (m[2] !== undefined && m[2].length !== 4) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  const loc = zipcodes.lookup(zip5);
  if (!loc || loc.country !== "US") {
    return { ok: false, message: POSTAL_MSG_NOT_FOUND };
  }
  if (loc.state !== tc) {
    return { ok: false, message: POSTAL_MSG_REGION_MISMATCH };
  }
  return { ok: true };
}

export function validateCanada(
  state: string,
  zip: string
): PostalValidationResult {
  const compact = zip.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) {
    return { ok: false, message: POSTAL_MSG_FORMAT };
  }
  const loc = zipcodes.lookup(compact);
  if (!loc || loc.country !== "Canada") {
    return { ok: false, message: POSTAL_MSG_NOT_FOUND };
  }
  const st = state.trim();
  if (st && loc.state.toLowerCase() !== st.toLowerCase()) {
    return { ok: false, message: POSTAL_MSG_REGION_MISMATCH };
  }
  return { ok: true };
}
