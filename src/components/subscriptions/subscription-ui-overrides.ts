import type { SubscriptionStatus } from "@/components/subscriptions/subscription-row-model";

const STORAGE_KEY = "subscription-ui-overrides-v1";

export type SubscriptionUiOverrides = {
  pausedById: Record<string, SubscriptionStatus>;
  canceledIds: Record<string, boolean>;
};

const empty = (): SubscriptionUiOverrides => ({
  pausedById: {},
  canceledIds: {},
});

export function loadSubscriptionUiOverrides(): SubscriptionUiOverrides {
  if (typeof window === "undefined") return empty();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<SubscriptionUiOverrides>;
    return {
      pausedById:
        parsed.pausedById && typeof parsed.pausedById === "object"
          ? parsed.pausedById
          : {},
      canceledIds:
        parsed.canceledIds && typeof parsed.canceledIds === "object"
          ? parsed.canceledIds
          : {},
    };
  } catch {
    return empty();
  }
}

export function saveSubscriptionUiOverrides(data: SubscriptionUiOverrides): void {
  if (typeof window === "undefined") return;
  try {
    const next = JSON.stringify(data);
    const prev = sessionStorage.getItem(STORAGE_KEY);
    if (prev === next) return;
    sessionStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("subscription-ui-overrides-changed"));
  } catch {
    /* quota / private mode */
  }
}

export function subscribeSubscriptionUiOverrides(
  callback: () => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const run = () => callback();
  window.addEventListener("subscription-ui-overrides-changed", run);
  window.addEventListener("storage", run);
  return () => {
    window.removeEventListener("subscription-ui-overrides-changed", run);
    window.removeEventListener("storage", run);
  };
}

/** Same rules as the subscriptions table status cell. */
export function resolveDisplayStatus(
  baseStatus: SubscriptionStatus,
  subscriptionId: string,
  overrides: SubscriptionUiOverrides
): SubscriptionStatus {
  if (overrides.canceledIds[subscriptionId]) return "Canceled";
  if (overrides.pausedById[subscriptionId] !== undefined) return "Paused";
  return baseStatus;
}

/** Merge into sessionStorage + notify (same outcome as dashboard state updates). */
export function applyPauseSubscription(
  subscriptionId: string,
  previousStatus: SubscriptionStatus
): void {
  const o = loadSubscriptionUiOverrides();
  o.pausedById[subscriptionId] = previousStatus;
  saveSubscriptionUiOverrides(o);
}

export function applyResumeSubscription(subscriptionId: string): void {
  const o = loadSubscriptionUiOverrides();
  delete o.pausedById[subscriptionId];
  saveSubscriptionUiOverrides(o);
}

export function applyCancelSubscription(subscriptionId: string): void {
  const o = loadSubscriptionUiOverrides();
  o.canceledIds[subscriptionId] = true;
  delete o.pausedById[subscriptionId];
  saveSubscriptionUiOverrides(o);
}
