/**
 * Shared dial codes + parser for the customer phone field (edit/add modals).
 * Data: `country-telephone-data` (ITU-style country calling codes).
 * Longest dial prefixes are matched first (e.g. +1684 before +1).
 */

import { allCountries } from "country-telephone-data";
import { countryFlagEmoji } from "@/components/subscriptions/country-state-data";

export type PhoneDialOption = {
  dial: string;
  iso2: string;
  /** e.g. `IN +91` — shown in the field (Figma 1318:68385). */
  label: string;
  flag: string;
  /** English display name for search. */
  name: string;
};

function buildPhoneDialOptions(): PhoneDialOption[] {
  return allCountries
    .filter((c) => c.dialCode && String(c.dialCode).trim() !== "")
    .map((c) => {
      const iso = c.iso2.toUpperCase();
      const dc = String(c.dialCode).trim();
      return {
        dial: `+${dc}`,
        iso2: iso,
        label: `${iso} +${dc}`,
        flag: countryFlagEmoji(c.iso2),
        name: c.name,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export const PHONE_DIAL_OPTIONS: PhoneDialOption[] = buildPhoneDialOptions();

const DIAL_PREFIXES_LONGEST_FIRST = Array.from(
  new Set(PHONE_DIAL_OPTIONS.map((o) => o.dial))
).sort((a, b) => b.length - a.length);

const DEFAULT_DIAL =
  PHONE_DIAL_OPTIONS.find((o) => o.iso2 === "US")?.dial ??
  PHONE_DIAL_OPTIONS[0]?.dial ??
  "+1";

export function parsePhoneToDialAndNational(full: string): {
  dial: string;
  national: string;
} {
  const t = full.trim();
  if (!t) {
    return { dial: DEFAULT_DIAL, national: "" };
  }
  for (const prefix of DIAL_PREFIXES_LONGEST_FIRST) {
    if (t.startsWith(prefix)) {
      return {
        dial: prefix,
        national: t.slice(prefix.length).replace(/\D/g, ""),
      };
    }
  }
  const digits = t.replace(/\D/g, "");
  return { dial: DEFAULT_DIAL, national: digits };
}

/** When several territories share a dial (e.g. +1), pick by `preferredIso2` when set. */
export function resolvePhoneDialOption(
  dial: string,
  preferredIso2: string | null | undefined
): PhoneDialOption {
  const candidates = PHONE_DIAL_OPTIONS.filter((o) => o.dial === dial);
  if (candidates.length === 0) {
    return (
      PHONE_DIAL_OPTIONS.find((o) => o.dial === DEFAULT_DIAL) ??
      PHONE_DIAL_OPTIONS[0]
    );
  }
  if (candidates.length === 1) return candidates[0];
  const pref = preferredIso2?.toUpperCase();
  if (pref) {
    const hit = candidates.find((o) => o.iso2 === pref);
    if (hit) return hit;
  }
  if (dial === "+1") {
    const us = candidates.find((o) => o.iso2 === "US");
    if (us) return us;
  }
  return candidates[0];
}
