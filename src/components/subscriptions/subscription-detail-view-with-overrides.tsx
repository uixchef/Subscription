"use client";

import { useLayoutEffect, useState } from "react";

import { SubscriptionDetailView } from "@/components/subscriptions/subscription-detail-view";
import {
  loadSubscriptionUiOverrides,
  resolveDisplayStatus,
  subscribeSubscriptionUiOverrides,
} from "@/components/subscriptions/subscription-ui-overrides";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";

/**
 * Applies dashboard pause/cancel overrides (sessionStorage) so detail status
 * matches the table without a backend.
 */
export function SubscriptionDetailViewWithOverrides({
  row,
}: {
  row: SubscriptionRow;
}) {
  const [effectiveRow, setEffectiveRow] = useState(() => {
    if (typeof window === "undefined") return row;
    const overrides = loadSubscriptionUiOverrides();
    return {
      ...row,
      status: resolveDisplayStatus(row.status, row.id, overrides),
    };
  });

  useLayoutEffect(() => {
    const apply = () => {
      const overrides = loadSubscriptionUiOverrides();
      setEffectiveRow({
        ...row,
        status: resolveDisplayStatus(row.status, row.id, overrides),
      });
    };
    apply();
    return subscribeSubscriptionUiOverrides(apply);
  }, [row]);

  return (
    <SubscriptionDetailView row={effectiveRow} baseStatus={row.status} />
  );
}
