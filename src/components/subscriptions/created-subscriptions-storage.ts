import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";

const STORAGE_KEY = "subscriptions-created-by-user-v1";

const CHANGED = "created-subscriptions-changed";

export function loadCreatedSubscriptions(): SubscriptionRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSubscriptionRowLike);
  } catch {
    return [];
  }
}

function isSubscriptionRowLike(x: unknown): x is SubscriptionRow {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  const cust = r.customer;
  if (!cust || typeof cust !== "object") return false;
  const customer = cust as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.provider === "string" &&
    typeof customer.name === "string" &&
    typeof r.source === "string" &&
    typeof r.createdOn === "string" &&
    typeof r.amount === "string" &&
    typeof r.status === "string" &&
    (r.paymentMode === "live" || r.paymentMode === "test")
  );
}

export function saveCreatedSubscriptions(rows: SubscriptionRow[]): void {
  if (typeof window === "undefined") return;
  try {
    const next = JSON.stringify(rows);
    if (sessionStorage.getItem(STORAGE_KEY) === next) return;
    sessionStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent(CHANGED));
  } catch {
    /* quota / private mode */
  }
}

/** Newest subscriptions first (prepended). */
export function appendCreatedSubscription(row: SubscriptionRow): void {
  const prev = loadCreatedSubscriptions();
  saveCreatedSubscriptions([row, ...prev]);
}

export function subscribeCreatedSubscriptions(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const run = () => callback();
  window.addEventListener(CHANGED, run);
  window.addEventListener("storage", run);
  return () => {
    window.removeEventListener(CHANGED, run);
    window.removeEventListener("storage", run);
  };
}
