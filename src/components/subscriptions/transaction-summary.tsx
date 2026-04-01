import {
  Calendar,
  CalendarCheck,
  CalendarMinus,
  Copy,
  Hash,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";

import { SubscriptionDetailBanner } from "@/components/subscriptions/subscription-detail-banner";
import type {
  SubscriptionRow,
  SubscriptionStatus,
} from "@/components/subscriptions/subscription-row-model";
import { cn } from "@/lib/utils";

/** Figma 1193:64108 — vertical separator between metric cells (34px tall). */
function MetricDivider() {
  return (
    <div
      className="hidden h-[34px] w-px shrink-0 bg-[#eaecf0] sm:block"
      aria-hidden
    />
  );
}

function MetricIconWell({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-[#f2f4f7] text-[#475467]">
      {children}
    </div>
  );
}

function TransactionMetric({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center justify-end gap-2 border-b border-[#eaecf0] px-4 py-4 last:border-b-0 sm:min-h-[76px] sm:border-b-0 sm:last:border-b-0">
      <MetricIconWell>{icon}</MetricIconWell>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-0">
        <p className="w-full text-sm font-normal leading-5 text-[#475467]">{label}</p>
        <div className="w-full min-w-0">{children}</div>
      </div>
    </div>
  );
}

function MetricsRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col border-t border-[#eaecf0] bg-white sm:flex-row sm:items-center sm:gap-2">
      {children}
    </div>
  );
}

/**
 * Subscription-2025 Figma node 1193:64108 — Transaction Summary
 * (card shell, status banner, two metric rows with icon wells + dividers).
 */
export function TransactionSummarySection({
  row,
  baseStatus,
  subIdHex,
  createdDisplay,
  upcomingPaymentStr,
  totalPaymentsDue,
  startDateStr,
  endDateStr,
}: {
  row: SubscriptionRow;
  /** Mock data status (not overridden by pause/cancel UI). */
  baseStatus: SubscriptionStatus;
  subIdHex: string;
  createdDisplay: string;
  upcomingPaymentStr: string;
  totalPaymentsDue: number;
  startDateStr: string;
  endDateStr: string;
}) {
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-[1080px] flex-col overflow-hidden rounded-[4px]",
        "border border-[#d0d5dd] bg-white",
        "shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]"
      )}
    >
      <SubscriptionDetailBanner
        displayStatus={row.status}
        baseStatus={baseStatus}
        amount={row.amount}
        createdOn={row.createdOn}
        subscriptionId={row.id}
      />

      <MetricsRow>
        <TransactionMetric
          icon={<Hash className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />}
          label="Subscription ID"
        >
          <div className="flex w-full min-w-0 items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-base font-medium leading-6 text-[#101828]">
              {subIdHex}
            </p>
            <span
              className="inline-flex size-4 shrink-0 items-center justify-center text-[#475467]"
              aria-hidden
            >
              <Copy className="size-4" strokeWidth={2} />
            </span>
          </div>
        </TransactionMetric>
        <MetricDivider />
        <TransactionMetric
          icon={<Calendar className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />}
          label="Created"
        >
          <p className="whitespace-nowrap font-medium text-[#101828] text-base leading-6">
            {createdDisplay}
          </p>
        </TransactionMetric>
        <MetricDivider />
        <TransactionMetric
          icon={<Wallet className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />}
          label="Upcoming payment"
        >
          <p className="whitespace-nowrap font-medium text-[#101828] text-base leading-6">
            {upcomingPaymentStr}
          </p>
        </TransactionMetric>
      </MetricsRow>

      <MetricsRow>
        <TransactionMetric
          icon={<Hash className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />}
          label="Total payments due"
        >
          <p className="whitespace-nowrap font-medium text-[#101828] text-base leading-6">
            {totalPaymentsDue}
          </p>
        </TransactionMetric>
        <MetricDivider />
        <TransactionMetric
          icon={
            <CalendarCheck className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
          }
          label="Subscription start date"
        >
          <p className="whitespace-nowrap font-medium text-[#101828] text-base leading-6">
            {startDateStr}
          </p>
        </TransactionMetric>
        <MetricDivider />
        <TransactionMetric
          icon={
            <CalendarMinus className="size-[18px] shrink-0" strokeWidth={2} aria-hidden />
          }
          label="Subscription end date"
        >
          <p className="whitespace-nowrap font-medium text-[#101828] text-base leading-6">
            {endDateStr}
          </p>
        </TransactionMetric>
      </MetricsRow>
    </section>
  );
}
