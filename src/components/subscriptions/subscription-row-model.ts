import { SUBSCRIPTION_TOTAL_ROWS } from "@/components/subscriptions/subscriptions-constants";
import type { TaxMode } from "@/components/subscriptions/tax-catalog";
import { formatDateMMDDYYYY } from "@/lib/date-format";

export type SubscriptionStatus =
  | "Active"
  | "Trailing"
  | "Scheduled"
  | "Canceled"
  | "Incomplete"
  | "Paused";

export type SubscriptionPaymentMode = "live" | "test";

/** Snapshot from Create subscription — drives detail Product(s) table for user-created rows. */
export type CreatedProductLineSnapshot = {
  name: string;
  /** Unit price in dollars (matches form). */
  price: number;
  qty: number;
  taxPercent: number | null;
  /** Persisted from Add tax modal — required to restore manual multi-select on update. */
  taxMode?: TaxMode | null;
  taxSelectedIds?: string[] | null;
};

export type SubscriptionRow = {
  id: string;
  provider: string;
  customer: { name: string; avatarBg?: string };
  source: string;
  createdOn: string;
  amount: string;
  status: SubscriptionStatus;
  /** Live vs test processing — set in `buildSubscriptionRow` for demo variety. */
  paymentMode: SubscriptionPaymentMode;
  /** When set (hub create flow), product table shows these lines instead of generated demo rows. */
  createdProductLines?: CreatedProductLineSnapshot[];
  /**
   * Rehydrates Create/Update subscription modal (coupon, business tax ID).
   * Omitted on legacy/mock rows — update modal applies defaults.
   */
  savedCouponCode?: string;
  savedCouponDiscountAmount?: number;
  savedBusinessTaxId?: string;
};

type SubscriptionRowSeed = Pick<
  SubscriptionRow,
  "provider" | "customer" | "source" | "status"
>;

/** Template rows — `buildSubscriptionRow` adds id, dates, amount, paymentMode. */
export const MOCK_ROWS: SubscriptionRowSeed[] = [
  {
    provider: "Manual",
    customer: { name: "Olivia John", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    status: "Active",
  },
  {
    provider: "Stripe",
    customer: { name: "Erin Ekstrom Bothman", avatarBg: "#dbeafe" },
    source: "Annual plan — checkout",
    status: "Active",
  },
  {
    provider: "PayPal",
    customer: { name: "Madelyn Calzoni", avatarBg: "#dbc0dd" },
    source: "30% - 1 step order form",
    status: "Scheduled",
  },
  {
    provider: "Square",
    customer: { name: "James Hall", avatarBg: "#dfcc9f" },
    source: "30% - 1 step order form",
    status: "Canceled",
  },
  {
    provider: "Amazon Pay",
    customer: { name: "Kris Ullman", avatarBg: "#c2c7b8" },
    source: "30% - 1 step order form",
    status: "Incomplete",
  },
  {
    provider: "Apple Pay",
    customer: { name: "Lori Bryson", avatarBg: "#d1baa9" },
    source: "30% - 1 step order form",
    status: "Active",
  },
  {
    provider: "Google Pay",
    customer: { name: "Chris Glasser", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    status: "Incomplete",
  },
  {
    provider: "Venmo",
    customer: { name: "Kris Ullman", avatarBg: "#c2c7b8" },
    source: "30% - 1 step order form",
    status: "Canceled",
  },
  {
    provider: "Cash App",
    customer: { name: "Olivia John", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    status: "Trailing",
  },
  {
    provider: "Zelle",
    customer: { name: "Erin Ekstrom Bothman", avatarBg: "#dbeafe" },
    source: "Annual plan — checkout",
    status: "Active",
  },
  {
    provider: "Samsung Pay",
    customer: { name: "Madelyn Calzoni", avatarBg: "#dbc0dd" },
    source: "30% - 1 step order form",
    status: "Incomplete",
  },
  {
    provider: "Dwolla",
    customer: { name: "James Hall", avatarBg: "#dfcc9f" },
    source: "30% - 1 step order form",
    status: "Canceled",
  },
];

const CREATED_ON_STEP_DAYS = 22;

/** MM/DD/YYYY: newest first — row 0 is today, each next row is CREATED_ON_STEP_DAYS earlier (no future dates). */
export function formatCreatedOnMMDDYYYY(stepsOlderThanNewest: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - stepsOlderThanNewest * CREATED_ON_STEP_DAYS);
  return formatDateMMDDYYYY(d);
}

/** Unique USD per row index, e.g. $1,500.00 */
export function formatUsdUnique(index: number): string {
  const cents = 150000 + index * 8471 + (index % 100) * 3;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function buildSubscriptionRow(globalIdx: number): SubscriptionRow {
  const template = MOCK_ROWS[globalIdx % MOCK_ROWS.length];
  return {
    ...template,
    id: `row-${globalIdx + 1}`,
    createdOn: formatCreatedOnMMDDYYYY(globalIdx),
    amount: formatUsdUnique(globalIdx),
    /** Alternate by row so list + detail show both Live and Test badges. */
    paymentMode: globalIdx % 2 === 0 ? "live" : "test",
  };
}

/**
 * Parses `row-N` ids from the subscriptions table. Returns 0-based global index or null.
 */
export function parseSubscriptionRowIndexFromId(id: string): number | null {
  const m = /^row-(\d+)$/.exec(id.trim());
  if (!m) return null;
  const num = parseInt(m[1], 10);
  if (num < 1 || num > SUBSCRIPTION_TOTAL_ROWS) return null;
  return num - 1;
}

export function getSubscriptionRowById(subscriptionId: string): SubscriptionRow | null {
  const idx = parseSubscriptionRowIndexFromId(subscriptionId);
  if (idx === null) return null;
  return buildSubscriptionRow(idx);
}
