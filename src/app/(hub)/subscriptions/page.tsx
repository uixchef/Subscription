import type { Metadata } from "next";

import { SUBSCRIPTION_TOTAL_ROWS } from "@/components/subscriptions/subscriptions-constants";
import { SubscriptionsHeader } from "@/components/subscriptions/subscriptions-header";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";
import { SubscriptionsToolbar } from "@/components/subscriptions/subscriptions-toolbar";

export const metadata: Metadata = {
  title: "Subscriptions | Payments",
  description: "Manage subscriptions created via order forms",
};

export default function SubscriptionsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubscriptionsHeader />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden rounded-[var(--border-radius-3)] bg-[var(--color-neutral-white-base)] px-4 pt-4 pb-4 shadow-[var(--shadow-lg)]">
          {SUBSCRIPTION_TOTAL_ROWS > 0 ? <SubscriptionsToolbar /> : null}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <SubscriptionsTable />
          </div>
        </div>
      </div>
    </div>
  );
}
