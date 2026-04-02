import type { PaymentCardFormValues } from "@/components/subscriptions/add-payment-card-modal";

export type SubscriptionPaymentCardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "generic";

export type SubscriptionPaymentCard = {
  id: string;
  /** Primary line, e.g. "Visa ending in 4242" */
  title: string;
  /** Secondary line — cardholder + expiry (reads like a real wallet row). */
  subtitle: string;
  brand: SubscriptionPaymentCardBrand;
  /** Unix ms when saved in this flow (for “just added” emphasis). */
  savedAt: number;
  /** Normalized cardholder name from the form. */
  nameOnCard: string;
};

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

export function cardLast4(cardNumber: string): string {
  const d = digitsOnly(cardNumber);
  if (d.length === 0) return "0000";
  return d.slice(-4);
}

export function inferCardBrand(cardNumber: string): SubscriptionPaymentCardBrand {
  const d = digitsOnly(cardNumber);
  if (d.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
  if (d.startsWith("34") || d.startsWith("37")) return "amex";
  if (d.startsWith("6")) return "discover";
  return "generic";
}

function brandShortLabel(brand: SubscriptionPaymentCardBrand): string {
  switch (brand) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "MC";
    case "amex":
      return "Amex";
    case "discover":
      return "Disc";
    default:
      return "Card";
  }
}

export function brandBadgeLabel(brand: SubscriptionPaymentCardBrand): string {
  return brandShortLabel(brand);
}

function pad2(n: string) {
  const t = n.trim();
  if (t.length >= 2) return t.slice(-2);
  return t.padStart(2, "0");
}

export function buildSubscriptionPaymentCard(
  id: string,
  values: PaymentCardFormValues
): SubscriptionPaymentCard {
  const brand = inferCardBrand(values.cardNumber);
  const last = cardLast4(values.cardNumber);
  const brandName =
    brand === "mastercard" ? "Mastercard" : brandShortLabel(brand);
  const title =
    brand === "generic"
      ? `Card ending in ${last}`
      : `${brandName} ending in ${last}`;
  const nameOnCard = values.nameOnCard.trim() || "Cardholder";
  const expY = values.expiryYear.trim();
  const expShort = expY.length >= 2 ? expY.slice(-2) : pad2(expY);
  const subtitle = `${nameOnCard} · Expires ${pad2(values.expiryMonth)}/${expShort}`;
  return {
    id,
    title,
    subtitle,
    brand,
    savedAt: Date.now(),
    nameOnCard,
  };
}
