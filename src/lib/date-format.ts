function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** US-style calendar date: MM/DD/YYYY (used app-wide). */
export function formatDateMMDDYYYY(d: Date): string {
  return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
}

/** Parse `MM/DD/YYYY` strings from subscription row data. */
export function parseMMDDYYYY(s: string): Date {
  const [mm, dd, yyyy] = s.split("/").map((x) => parseInt(x, 10));
  return new Date(yyyy, mm - 1, dd);
}

/** Split parts for date-picker trigger display (same numeric convention). */
export function getDatePartsMMDDYYYY(d: Date): {
  mm: string;
  dd: string;
  yyyy: string;
} {
  return {
    mm: pad2(d.getMonth() + 1),
    dd: pad2(d.getDate()),
    yyyy: String(d.getFullYear()),
  };
}
