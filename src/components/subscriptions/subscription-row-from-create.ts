import type { SubscriptionPaymentMode } from "@/components/subscriptions/subscription-row-model";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import { formatDateMMDDYYYY } from "@/lib/date-format";

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Builds a table/detail row from the Create subscription modal snapshot.
 * Provider is fixed to Manual until a real payments integration exists.
 */
export function buildSubscriptionRowFromCreateModal(args: {
  id: string;
  customerName: string;
  customerAvatarBg?: string;
  /** Line item names (non-empty), in order */
  productNames: string[];
  amount: number;
  paymentMode: SubscriptionPaymentMode;
}): SubscriptionRow {
  const names = args.productNames.map((n) => n.trim()).filter(Boolean);
  let source = "Subscription";
  if (names.length === 1) source = names[0]!;
  else if (names.length > 1)
    source = `${names[0]!} +${names.length - 1} more`;

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
  };
}
