import { loadCreatedSubscriptions } from "@/components/subscriptions/created-subscriptions-storage";
import {
  getSubscriptionRowById,
  type SubscriptionRow,
} from "@/components/subscriptions/subscription-row-model";
import { loadSubscriptionRowUpdates } from "@/components/subscriptions/subscription-row-updates-storage";

/** Client-side: user-created rows in sessionStorage, then mock catalog rows + update overlay. */
export function resolveSubscriptionRow(subscriptionId: string): SubscriptionRow | null {
  if (typeof window !== "undefined") {
    const created = loadCreatedSubscriptions();
    const found = created.find((r) => r.id === subscriptionId);
    if (found) return found;
  }
  const base = getSubscriptionRowById(subscriptionId);
  if (!base) return null;
  if (typeof window === "undefined") return base;
  const updates = loadSubscriptionRowUpdates();
  return updates[subscriptionId] ?? base;
}
