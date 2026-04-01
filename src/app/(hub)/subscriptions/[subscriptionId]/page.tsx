import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubscriptionDetailHeader } from "@/components/subscriptions/subscription-detail-header";
import { SubscriptionDetailViewWithOverrides } from "@/components/subscriptions/subscription-detail-view-with-overrides";
import { getSubscriptionRowById } from "@/components/subscriptions/subscription-row-model";

type Props = { params: Promise<{ subscriptionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subscriptionId } = await params;
  const row = getSubscriptionRowById(subscriptionId);
  const title = row
    ? `${row.customer.name} · Subscription`
    : `Subscription ${subscriptionId}`;
  return {
    title: `${title} | Payments`,
  };
}

export default async function SubscriptionDetailPage({ params }: Props) {
  const { subscriptionId } = await params;
  const row = getSubscriptionRowById(subscriptionId);
  if (!row) {
    notFound();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubscriptionDetailHeader paymentMode={row.paymentMode} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-[var(--border-radius-3)] bg-[var(--color-neutral-white-base)] px-4 pt-4 pb-4 shadow-[var(--shadow-lg)]">
          <div className="mx-auto w-full max-w-[1160px]">
            <SubscriptionDetailViewWithOverrides row={row} />
          </div>
        </div>
      </div>
    </div>
  );
}
