import { loadCreatedSubscriptions } from "@/components/subscriptions/created-subscriptions-storage";
import {
  getSubscriptionRowById,
  type SubscriptionRow,
} from "@/components/subscriptions/subscription-row-model";

/** Client-side: user-created rows in sessionStorage, then mock catalog rows. */
export function resolveSubscriptionRow(subscriptionId: string): SubscriptionRow | null {
  if (typeof window !== "undefined") {
    const created = loadCreatedSubscriptions();
    const found = created.find((r) => r.id === subscriptionId);
    if (found) return found;
  }
  return getSubscriptionRowById(subscriptionId);
}
