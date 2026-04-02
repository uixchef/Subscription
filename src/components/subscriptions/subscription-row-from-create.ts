import type {
  CreatedProductLineSnapshot,
  SubscriptionPaymentMode,
  SubscriptionRow,
} from "@/components/subscriptions/subscription-row-model";
import { formatDateMMDDYYYY } from "@/lib/date-format";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function naturalQty(n: number): number {
  const f = Math.floor(Number(n));
  return Number.isFinite(f) && f >= 1 ? f : 1;
}

/**
 * Builds a table/detail row from the Create subscription modal snapshot.
 * Provider is fixed to Manual until a real payments integration exists.
 */
export function buildSubscriptionRowFromCreateModal(args: {
  id: string;
  customerName: string;
  customerAvatarBg?: string;
  /** Line item names (non-empty), in order — used for list `source` summary */
  productNames: string[];
  /** Full line snapshot for subscription detail Product(s) table */
  productLines: CreatedProductLineSnapshot[];
  amount: number;
  paymentMode: SubscriptionPaymentMode;
}): SubscriptionRow {
  const names = args.productNames.map((n) => n.trim()).filter(Boolean);
  let source = "Subscription";
  if (names.length === 1) source = names[0]!;
  else if (names.length > 1)
    source = `${names[0]!} +${names.length - 1} more`;

  const lines: CreatedProductLineSnapshot[] = args.productLines.map((l) => ({
    name: l.name.trim(),
    price: l.price,
    qty: naturalQty(l.qty),
    taxPercent: l.taxPercent,
  }));

  return {
    id: args.id,
    provider: "Manual",
    customer: {
      name: args.customerName.trim() || "Customer",
      avatarBg: args.customerAvatarBg ?? "#f2f4f7",
    },
    source,
    createdOn: formatDateMMDDYYYY(new Date()),
    amount: formatUsd(args.amount),
    status: "Active",
    paymentMode: args.paymentMode,
    createdProductLines: lines.length > 0 ? lines : undefined,
  };
}

/**
 * Applies Create/Update modal snapshot onto an existing subscription row (id, dates, provider, status preserved).
 */
export function mergeSubscriptionRowFromUpdateModal(args: {
  existing: SubscriptionRow;
  customerName: string;
  customerAvatarBg?: string;
  productNames: string[];
  productLines: CreatedProductLineSnapshot[];
  amount: number;
  paymentMode: SubscriptionPaymentMode;
}): SubscriptionRow {
  const names = args.productNames.map((n) => n.trim()).filter(Boolean);
  let source = "Subscription";
  if (names.length === 1) source = names[0]!;
  else if (names.length > 1)
    source = `${names[0]!} +${names.length - 1} more`;

  const lines: CreatedProductLineSnapshot[] = args.productLines.map((l) => ({
    name: l.name.trim(),
    price: l.price,
    qty: naturalQty(l.qty),
    taxPercent: l.taxPercent,
  }));

  return {
    ...args.existing,
    customer: {
      name: args.customerName.trim() || args.existing.customer.name,
      avatarBg: args.customerAvatarBg ?? args.existing.customer.avatarBg,
    },
    source,
    amount: formatUsd(args.amount),
    paymentMode: args.paymentMode,
    createdProductLines: lines.length > 0 ? lines : undefined,
  };
}
