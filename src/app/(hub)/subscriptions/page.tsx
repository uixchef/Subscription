import type { Metadata } from "next";

import { SubscriptionsHeader } from "@/components/subscriptions/subscriptions-header";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";
import { SubscriptionsToolbar } from "@/components/subscriptions/subscriptions-toolbar";

export const metadata: Metadata = {
  title: "Subscriptions | Payment Hub",
  description: "Manage subscriptions created via order forms",
};

export default function SubscriptionsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubscriptionsHeader />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3 overflow-hidden rounded-[12px] bg-white px-4 pt-4 pb-2 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
          <SubscriptionsToolbar />
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <SubscriptionsTable />
          </div>
        </div>
      </div>
    </div>
  );
}
