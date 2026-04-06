import { parseUsdToCents } from "@/components/subscriptions/subscription-detail-derived-data";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import type { TaxMode } from "@/components/subscriptions/tax-catalog";

function seedFromRowId(rowId: string): number {
  let h = 2166136261;
  for (let i = 0; i < rowId.length; i++) {
    h ^= rowId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function naturalQty(n: number): number {
  const f = Math.floor(Number(n));
  return Number.isFinite(f) && f >= 1 ? f : 1;
}

export function newProductLineId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `line-${crypto.randomUUID()}`
    : `line-${Date.now()}-${Math.random()}`;
}

/** Editable line items for Create subscription modal (matches internal ProductLineItem shape). */
export type EditableProductLineSeed = {
  id: string;
  name: string;
  price: number;
  qty: number;
  taxPercent: number | null;
  taxMode?: TaxMode | null;
  taxSelectedIds?: string[] | null;
};

/**
 * Maps a subscription row to editable product lines — mirrors `buildProductLineItems` split for mock rows.
 */
export function subscriptionRowToEditableProductLines(
  row: SubscriptionRow
): EditableProductLineSeed[] {
  if (row.createdProductLines && row.createdProductLines.length > 0) {
    return row.createdProductLines.map((l) => ({
      id: newProductLineId(),
      name: l.name,
      price: l.price,
      qty: naturalQty(l.qty),
      taxPercent: l.taxPercent,
      taxMode: l.taxMode ?? null,
      taxSelectedIds: l.taxSelectedIds ?? null,
    }));
  }
  const cents = parseUsdToCents(row.amount);
  const seed = seedFromRowId(row.id);
  const p1 = Math.floor(cents * 0.56);
  const p2 = Math.floor(cents * 0.27);
  const p3 = Math.max(0, cents - p1 - p2);
  const mainLabel = truncate(row.source, 44) || "Subscription plan";
  return [
    {
      id: newProductLineId(),
      name: mainLabel,
      price: p1 / 100,
      qty: 1,
      taxPercent: null,
    },
    {
      id: newProductLineId(),
      name: "Platform & processing",
      price: p2 / 100,
      qty: 1,
      taxPercent: null,
    },
    {
      id: newProductLineId(),
      name: "Add-on & adjustments",
      price: p3 / 100,
      qty: 1 + (seed % 2),
      taxPercent: null,
    },
  ];
}

export function customerDirectoryIdForSubscriptionRow(
  row: SubscriptionRow,
  customers: readonly { id: string; name: string }[]
): string {
  const target = row.customer.name.trim().toLowerCase();
  const match = customers.find((c) => c.name.trim().toLowerCase() === target);
  return match?.id ?? "";
}

/** Default line tax % when a subscription row has no per-line tax (typical “already purchased” state). */
const DEFAULT_UPDATE_LINE_TAX_PERCENTS = [10, 8, 8] as const;

/**
 * If no line has tax, assign default rates so the update modal shows tax like a completed checkout.
 */
export function seedDefaultLineTaxesForUpdateModal(
  lines: EditableProductLineSeed[]
): EditableProductLineSeed[] {
  if (lines.some((l) => l.taxPercent != null)) {
    return lines.map((l) => ({ ...l }));
  }
  return lines.map((l, i) => ({
    ...l,
    taxPercent: DEFAULT_UPDATE_LINE_TAX_PERCENTS[i] ?? 8,
  }));
}
