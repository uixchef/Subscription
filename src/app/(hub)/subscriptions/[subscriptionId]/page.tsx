"use client";

import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SubscriptionDetailHeader } from "@/components/subscriptions/subscription-detail-header";
import { SubscriptionDetailViewWithOverrides } from "@/components/subscriptions/subscription-detail-view-with-overrides";
import { subscribeCreatedSubscriptions } from "@/components/subscriptions/created-subscriptions-storage";
import { resolveSubscriptionRow } from "@/components/subscriptions/resolve-subscription-row";
import { subscribeSubscriptionRowUpdates } from "@/components/subscriptions/subscription-row-updates-storage";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";

export default function SubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = String(params?.subscriptionId ?? "");
  const [row, setRow] = useState<SubscriptionRow | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setRow(resolveSubscriptionRow(subscriptionId));
    queueMicrotask(() => {
      sync();
      setReady(true);
    });
    const unsubCreated = subscribeCreatedSubscriptions(sync);
    const unsubUpdates = subscribeSubscriptionRowUpdates(sync);
    return () => {
      unsubCreated();
      unsubUpdates();
    };
  }, [subscriptionId]);

  if (!ready) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SubscriptionDetailHeader paymentMode="live" />
        <div className="flex min-h-[240px] flex-1 items-center justify-center p-4 text-sm text-[#475467]">
          Loading…
        </div>
      </div>
    );
  }

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
