import type {
  CreatedProductLineSnapshot,
  SubscriptionRow,
} from "@/components/subscriptions/subscription-row-model";

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

function isCreatedProductLineLike(x: unknown): x is CreatedProductLineSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    typeof o.qty === "number" &&
    Number.isFinite(o.qty) &&
    (o.taxPercent === null ||
      (typeof o.taxPercent === "number" && Number.isFinite(o.taxPercent)))
  );
}

function isSubscriptionRowLike(x: unknown): x is SubscriptionRow {
  if (!x || typeof x !== "object") return false;
  const r = x as Record<string, unknown>;
  const cust = r.customer;
  if (!cust || typeof cust !== "object") return false;
  const customer = cust as Record<string, unknown>;
  const base =
    typeof r.id === "string" &&
    typeof r.provider === "string" &&
    typeof customer.name === "string" &&
    typeof r.source === "string" &&
    typeof r.createdOn === "string" &&
    typeof r.amount === "string" &&
    typeof r.status === "string" &&
    (r.paymentMode === "live" || r.paymentMode === "test");

  if (!base) return false;
  if (r.createdProductLines === undefined) return true;
  if (!Array.isArray(r.createdProductLines)) return false;
  return r.createdProductLines.every(isCreatedProductLineLike);
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

/** Replace an existing user-created row by id (Update subscription flow). */
export function replaceCreatedSubscription(row: SubscriptionRow): void {
  const prev = loadCreatedSubscriptions();
  const idx = prev.findIndex((r) => r.id === row.id);
  if (idx === -1) return;
  const next = [...prev];
  next[idx] = row;
  saveCreatedSubscriptions(next);
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
