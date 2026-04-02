import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";

const STORAGE_KEY = "subscription-row-updates-v1";

const CHANGED = "subscription-row-updates-changed";

export function loadSubscriptionRowUpdates(): Record<string, SubscriptionRow> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, SubscriptionRow> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (isSubscriptionRowLike(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
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

export function saveSubscriptionRowUpdate(row: SubscriptionRow): void {
  if (typeof window === "undefined") return;
  try {
    const prev = loadSubscriptionRowUpdates();
    const next = { ...prev, [row.id]: row };
    const serialized = JSON.stringify(next);
    if (sessionStorage.getItem(STORAGE_KEY) === serialized) return;
    sessionStorage.setItem(STORAGE_KEY, serialized);
    window.dispatchEvent(new CustomEvent(CHANGED));
  } catch {
    /* quota */
  }
}

export function subscribeSubscriptionRowUpdates(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const run = () => callback();
  window.addEventListener(CHANGED, run);
  window.addEventListener("storage", run);
  return () => {
    window.removeEventListener(CHANGED, run);
    window.removeEventListener("storage", run);
  };
}
