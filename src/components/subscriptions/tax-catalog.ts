/**
 * Shared tax catalog + helpers for Add tax modal and subscription totals.
 * Rates mirror the manual table in AddLineItemTaxModal.
 */

export type TaxMode = "automatic" | "manual";

const TAX_NAME_ICONS = [
  "Sales tax",
  "Income tax",
  "VAT",
  "GST",
  "Use tax",
  "Excise tax",
] as const;

/** Same automatic rate as AddLineItemTaxModal `handleSave`. */
export const AUTOMATIC_TAX_RATE = 10;

export const ALL_TAX_TABLE_ROWS = Array.from({ length: 24 }, (_, i) => ({
  id: `tax-${i + 1}`,
  name:
    i < TAX_NAME_ICONS.length
      ? TAX_NAME_ICONS[i]
      : `Tax type ${i + 1}`,
  rate: 5 + (i % 15),
  taxId: `TID${5343 + i}`,
}));

/** Merge selected rows that share the same tax name (sum rates). */
export function aggregateTaxRowsByName(
  selectedIds: string[]
): { name: string; rate: number }[] {
  const map = new Map<string, number>();
  for (const id of selectedIds) {
    const row = ALL_TAX_TABLE_ROWS.find((r) => r.id === id);
    if (!row) continue;
    map.set(row.name, (map.get(row.name) ?? 0) + row.rate);
  }
  return Array.from(map.entries()).map(([name, rate]) => ({ name, rate }));
}

export type SubscriptionTaxDisplayLine = {
  key: string;
  label: string;
  amount: number;
};

/**
 * Builds one row per tax component for the subscription summary (Figma calculations).
 * Manual mode: one line per merged tax name; duplicate names in the catalog combine into one rate.
 */
export function buildSubscriptionTaxDisplayLines(
  taxableSubtotal: number,
  mode: TaxMode,
  selectedTaxIds: string[]
): SubscriptionTaxDisplayLine[] {
  const base = Math.max(0, taxableSubtotal);
  const baseStr = base.toFixed(2);
  if (mode === "automatic") {
    const rate = AUTOMATIC_TAX_RATE;
    return [
      {
        key: "automatic",
        label: `Estimated tax (${rate}% on $${baseStr})`,
        amount: roundMoney(base * (rate / 100)),
      },
    ];
  }
  const merged = aggregateTaxRowsByName(selectedTaxIds);
  return merged.map((row, i) => ({
    key: `${row.name}-${i}`,
    label: `${row.name} (${row.rate}% on $${baseStr})`,
    amount: roundMoney(base * (row.rate / 100)),
  }));
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumTaxLineAmounts(lines: { amount: number }[]): number {
  return roundMoney(lines.reduce((s, l) => s + l.amount, 0));
}

function naturalQtyLine(n: number): number {
  const f = Math.floor(Number(n));
  return Number.isFinite(f) && f >= 1 ? f : 1;
}

type RowTaxInput = {
  price: number;
  qty: number;
  taxPercent: number | null;
  taxMode?: TaxMode | null;
  taxSelectedIds?: string[] | null;
};

/**
 * Rolls up per-line taxes into summary lines (same label pattern as subscription tax).
 * Merges identical tax name + rate across lines; base in the label is the sum of line
 * subtotals that include that component.
 */
export function aggregateLineItemTaxesForSummary(
  rows: RowTaxInput[]
): SubscriptionTaxDisplayLine[] {
  type Bucket = {
    name: string;
    rate: number;
    baseSum: number;
    amountSum: number;
  };
  const map = new Map<string, Bucket>();

  const add = (name: string, rate: number, base: number, amt: number) => {
    const k = `${name}\0${rate}`;
    const roundedAmt = roundMoney(amt);
    const ex = map.get(k);
    if (!ex) {
      map.set(k, {
        name,
        rate,
        baseSum: base,
        amountSum: roundedAmt,
      });
    } else {
      ex.baseSum += base;
      ex.amountSum = roundMoney(ex.amountSum + roundedAmt);
    }
  };

  for (const r of rows) {
    if (r.taxPercent == null) continue;
    const base = Math.max(0, r.price * naturalQtyLine(r.qty));

    if (r.taxMode === "automatic") {
      const rate = AUTOMATIC_TAX_RATE;
      add("Estimated tax", rate, base, base * (rate / 100));
    } else if (
      r.taxMode === "manual" &&
      r.taxSelectedIds &&
      r.taxSelectedIds.length > 0
    ) {
      for (const { name, rate } of aggregateTaxRowsByName(r.taxSelectedIds)) {
        add(name, rate, base, base * (rate / 100));
      }
    } else {
      add("Tax", r.taxPercent, base, base * (r.taxPercent / 100));
    }
  }

  return Array.from(map.values()).map((b, i) => ({
    key: `${b.name}-${b.rate}-${i}`,
    label: `${b.name} (${b.rate}% on $${roundMoney(b.baseSum).toFixed(2)})`,
    amount: roundMoney(b.amountSum),
  }));
}

/** Per-line tax rows for tooltips (Invoices / Estimates–style breakdown). */
export type LineTaxBreakdownEntry = {
  name: string;
  ratePercent: number;
  amount: number;
};

export function getLineTaxBreakdown(row: RowTaxInput): LineTaxBreakdownEntry[] {
  if (row.taxPercent == null) return [];
  const base = Math.max(0, row.price * naturalQtyLine(row.qty));

  if (row.taxMode === "automatic") {
    const rate = AUTOMATIC_TAX_RATE;
    return [
      {
        name: "Estimated tax",
        ratePercent: rate,
        amount: roundMoney(base * (rate / 100)),
      },
    ];
  }
  if (
    row.taxMode === "manual" &&
    row.taxSelectedIds &&
    row.taxSelectedIds.length > 0
  ) {
    return aggregateTaxRowsByName(row.taxSelectedIds).map((t) => ({
      name: t.name,
      ratePercent: t.rate,
      amount: roundMoney(base * (t.rate / 100)),
    }));
  }
  return [
    {
      name: "Tax",
      ratePercent: row.taxPercent,
      amount: roundMoney(base * (row.taxPercent / 100)),
    },
  ];
}
