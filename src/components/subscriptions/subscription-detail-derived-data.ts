import type {
  CreatedProductLineSnapshot,
  SubscriptionRow,
} from "@/components/subscriptions/subscription-row-model";
import { formatDateMMDDYYYY, parseMMDDYYYY } from "@/lib/date-format";

export type ProductLineItem = {
  item: string;
  price: string;
  qty: string;
  freq: "weekly" | "monthly" | "once";
  tax: string;
  sub: string;
};

export type TransactionDetailRow = {
  provider: string;
  chargeLabel: string;
  dateLabel: string;
  amount: string;
  status: SubscriptionRow["status"];
};

function seedFromRowId(rowId: string): number {
  let h = 2166136261;
  for (let i = 0; i < rowId.length; i++) {
    h ^= rowId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function parseUsdToCents(s: string): number {
  const n = Number.parseFloat(s.replace(/[$,\s]/g, ""));
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

const PROVIDER_POOL = [
  "Manual",
  "Stripe",
  "PayPal",
  "Square",
  "Amazon Pay",
  "Cash App",
  "Apple Pay",
] as const;

const CHARGE_ALTERNATES = [
  "30% - 1 step order form",
  "50% - 2 step order form",
  "Limited edition product",
  "Subscription product",
  "New link",
  "Mobile wallet — subscription",
] as const;

const TXN_STATUS_ROTATION: SubscriptionRow["status"][] = [
  "Active",
  "Active",
  "Trailing",
  "Canceled",
  "Incomplete",
  "Active",
];

function naturalQty(n: number): number {
  const f = Math.floor(Number(n));
  return Number.isFinite(f) && f >= 1 ? f : 1;
}

function buildProductLineItemsFromCreated(
  row: SubscriptionRow,
  lines: CreatedProductLineSnapshot[]
): ProductLineItem[] {
  const seed = seedFromRowId(row.id);
  const freqCycle: ProductLineItem["freq"][] = ["weekly", "monthly", "once"];
  return lines.map((line, i) => {
    const qty = naturalQty(line.qty);
    const unitCents = Math.round(line.price * 100);
    const lineSubtotalCents = Math.round(line.price * qty * 100);
    const taxCents =
      line.taxPercent != null
        ? Math.round((lineSubtotalCents * line.taxPercent) / 100)
        : 0;
    return {
      item: truncate(line.name, 44) || "Subscription plan",
      price: formatUsdFromCents(unitCents),
      qty: String(qty),
      freq: freqCycle[(seed + i) % 3],
      tax: formatUsdFromCents(taxCents),
      sub: formatUsdFromCents(lineSubtotalCents),
    };
  });
}

/** Line items priced from `row.amount` so subtotals reconcile with the subscription. */
export function buildProductLineItems(row: SubscriptionRow): ProductLineItem[] {
  if (row.createdProductLines && row.createdProductLines.length > 0) {
    return buildProductLineItemsFromCreated(row, row.createdProductLines);
  }

  const cents = parseUsdToCents(row.amount);
  const seed = seedFromRowId(row.id);
  const p1 = Math.floor(cents * 0.56);
  const p2 = Math.floor(cents * 0.27);
  const p3 = Math.max(0, cents - p1 - p2);
  const tax = (c: number) => Math.round(c * 0.1);

  const mainLabel = truncate(row.source, 44) || "Subscription plan";
  const freqCycle: ProductLineItem["freq"][] = ["weekly", "monthly", "once"];
  const f0 = freqCycle[seed % 3];
  const f1 = freqCycle[(seed + 1) % 3];
  const f2 = freqCycle[(seed + 2) % 3];

  return [
    {
      item: mainLabel,
      price: formatUsdFromCents(p1),
      qty: "1",
      freq: f0,
      tax: formatUsdFromCents(tax(p1)),
      sub: formatUsdFromCents(p1),
    },
    {
      item: "Platform & processing",
      price: formatUsdFromCents(p2),
      qty: "1",
      freq: f1,
      tax: formatUsdFromCents(tax(p2)),
      sub: formatUsdFromCents(p2),
    },
    {
      item: "Add-on & adjustments",
      price: formatUsdFromCents(p3),
      qty: String(1 + (seed % 2)),
      freq: f2,
      tax: formatUsdFromCents(tax(p3)),
      sub: formatUsdFromCents(p3),
    },
  ];
}

/** Newest-first transaction history tied to subscription start and amount. */
export function buildTransactionRows(row: SubscriptionRow): TransactionDetailRow[] {
  const created = parseMMDDYYYY(row.createdOn);
  const baseCents = parseUsdToCents(row.amount);
  const seed = seedFromRowId(row.id);

  /** Days after subscription start (spread across tenure). */
  const dayOffsets = [68, 44, 21, 11, 4, 1];

  const rows: TransactionDetailRow[] = dayOffsets.map((days, i) => {
    const d = addDays(created, days);
    const dateLabel = formatDateMMDDYYYY(d);

    const provider =
      i === 0
        ? row.provider
        : PROVIDER_POOL[(seed + i * 7) % PROVIDER_POOL.length];

    const chargeLabel =
      i === 0 ? truncate(row.source, 48) : CHARGE_ALTERNATES[(seed + i) % CHARGE_ALTERNATES.length];

    const mult = 0.94 + (i % 4) * 0.02 + (seed % 17) / 200;
    const amtCents = Math.min(
      Math.round(baseCents * mult * (i === 0 ? 1 : 0.92 + i * 0.012)),
      Math.round(baseCents * 1.12)
    );
    const amount = formatUsdFromCents(Math.max(amtCents, Math.round(baseCents * 0.45)));

    let status: SubscriptionRow["status"];
    if (i === 0) {
      status =
        row.status === "Paused" || row.status === "Scheduled" ? "Active" : row.status;
    } else {
      status = TXN_STATUS_ROTATION[(seed + i) % TXN_STATUS_ROTATION.length];
    }

    return {
      provider,
      chargeLabel,
      dateLabel,
      amount,
      status,
    };
  });

  return rows.sort((a, b) => {
    const da = parseMMDDYYYY(a.dateLabel).getTime();
    const db = parseMMDDYYYY(b.dateLabel).getTime();
    return db - da;
  });
}

/** “Amount due …” second line in Summary (slightly above base recurring). */
export function buildSummaryAdjustmentAmount(row: SubscriptionRow): string {
  const c = parseUsdToCents(row.amount);
  return formatUsdFromCents(Math.round(c * 1.09));
}

export function invoiceServiceLabel(row: SubscriptionRow): string {
  const first = row.customer.name.split(/\s+/).filter(Boolean)[0] ?? "Customer";
  return `${first} — services invoice`;
}

export function sourceLinkLabel(row: SubscriptionRow): string {
  return truncate(row.source, 52) || "Payment link";
}

export function totalPaymentsDueCount(row: SubscriptionRow): number {
  const created = parseMMDDYYYY(row.createdOn);
  const now = new Date();
  const months =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());
  const rough = Math.max(1, months + 1);
  const seed = seedFromRowId(row.id);
  return Math.min(120, rough + (seed % 3));
}

export function paymentCardBrand(rowId: string): "Visa" | "Mastercard" {
  return seedFromRowId(rowId) % 2 === 0 ? "Visa" : "Mastercard";
}

export function paymentCardLast4(rowId: string): string {
  const n = 1000 + (seedFromRowId(rowId + "card") % 9000);
  return String(n);
}

/** MM/YY */
export function paymentCardExpiry(rowId: string): string {
  const m = 1 + (seedFromRowId(rowId + "exp") % 12);
  const y = 26 + (seedFromRowId(rowId + "yr") % 5);
  return `${String(m).padStart(2, "0")}/${String(y).slice(-2)}`;
}

/** Varies with subscription tenure for Summary “In between” line. */
export function billingCyclesBetweenLabel(row: SubscriptionRow): string {
  const t = totalPaymentsDueCount(row);
  const n = Math.max(1, Math.min(8, Math.floor(t / 3) + (seedFromRowId(row.id) % 3)));
  return `In between:${n}`;
}
