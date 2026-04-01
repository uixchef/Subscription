export type PostalValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/** Shown when format is wrong for the selected country. */
export const POSTAL_MSG_FORMAT =
  "That postal code doesn’t match the format for the selected country.";

/** Shown when we can’t resolve the code in our reference data (US/CA). */
export const POSTAL_MSG_NOT_FOUND =
  "We couldn’t find that postal code. Check the number and try again.";

/** Shown when the code exists but the selected region doesn’t match (US/CA). */
export const POSTAL_MSG_REGION_MISMATCH =
  "That postal code doesn’t match the selected country and region. Update the region or enter a code that matches.";

export const POSTAL_MSG_REQUIRED = "Enter a postal code.";
