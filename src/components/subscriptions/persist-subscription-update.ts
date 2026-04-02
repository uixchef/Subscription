import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import {
  loadCreatedSubscriptions,
  replaceCreatedSubscription,
} from "@/components/subscriptions/created-subscriptions-storage";
import { saveSubscriptionRowUpdate } from "@/components/subscriptions/subscription-row-updates-storage";

/** User-created rows update the array; catalog rows use sessionStorage overlay. */
export function persistSubscriptionUpdate(row: SubscriptionRow): void {
  const created = loadCreatedSubscriptions();
  if (created.some((r) => r.id === row.id)) {
    replaceCreatedSubscription(row);
  } else {
    saveSubscriptionRowUpdate(row);
  }
}
