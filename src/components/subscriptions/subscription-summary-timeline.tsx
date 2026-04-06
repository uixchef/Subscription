"use client";

import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  Check,
  Receipt,
  RefreshCw,
} from "lucide-react";

import {
  billingCyclesBetweenLabel,
  formatUsdFromCents,
} from "@/components/subscriptions/subscription-detail-derived-data";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import { formatDateMMDDYYYY } from "@/lib/date-format";
import { cn } from "@/lib/utils";

export type SummaryLine = {
  text: string;
  weight: "medium" | "regular";
  singleLine?: boolean;
};

export type SummaryStepConfig = {
  icon: LucideIcon;
  title: string;
  lines: SummaryLine[];
  showConnectorAfter: boolean;
};

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/**
 * Update subscription modal preview — same step structure and copy as
 * `buildSummaryTimelineSteps` for Active (subscription-detail-view), with dates
 * and amounts driven by the form (start date, next charge, computed amount due).
 */
export function buildUpdatePreviewSummarySteps(
  row: SubscriptionRow,
  subscriptionStart: Date,
  nextChargeDate: Date,
  amountDue: number
): SummaryStepConfig[] {
  const fmt = (d: Date) => formatDateMMDDYYYY(d);
  const cents = Math.round(amountDue * 100);
  const amountStr = formatUsdFromCents(cents);
  const summaryAdj = formatUsdFromCents(Math.round(cents * 1.09));
  const cyclesLine = billingCyclesBetweenLabel(row);

  return [
    {
      icon: Calendar,
      title: fmt(subscriptionStart),
      lines: [
        {
          text: "Billed immediately for 1 month",
          weight: "medium",
          singleLine: true,
        },
      ],
      showConnectorAfter: true,
    },
    {
      icon: Receipt,
      title: "Next payment",
      lines: [
        { text: `Amount due ${amountStr}`, weight: "medium", singleLine: true },
        {
          text: `Bills on ${fmt(nextChargeDate)} for 1 month`,
          weight: "regular",
        },
      ],
      showConnectorAfter: true,
    },
    {
      icon: Check,
      title: "Billing cycles",
      lines: [{ text: cyclesLine, weight: "medium" }],
      showConnectorAfter: true,
    },
    {
      icon: Calendar,
      title: fmt(addDays(subscriptionStart, 21)),
      lines: [
        {
          text: `Amount due ${summaryAdj}`,
          weight: "medium",
          singleLine: true,
        },
        { text: "Subscription updates", weight: "regular" },
      ],
      showConnectorAfter: true,
    },
    {
      icon: RefreshCw,
      title: "Reset billing cycle",
      lines: [
        {
          text: `Bills ${fmt(addDays(subscriptionStart, 7))}`,
          weight: "medium",
        },
      ],
      showConnectorAfter: false,
    },
  ];
}

/** Figma 1193:117414 — progress steps: 28px rail, #475467, 8px gap (subscription detail + update preview). */
export function SummaryTimelineStep({
  icon: Icon,
  title,
  lines,
  showConnectorAfter,
}: {
  icon: LucideIcon;
  title: string;
  lines: SummaryLine[];
  showConnectorAfter: boolean;
}) {
  return (
    <li className="flex w-full flex-col">
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex w-7 shrink-0 flex-col items-center",
            showConnectorAfter && "min-h-[1px] self-stretch"
          )}
        >
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-[14px] border border-[#475467] bg-white"
            aria-hidden
          >
            <Icon className="size-4 text-[#475467]" strokeWidth={2} />
          </div>
          {showConnectorAfter ? (
            <div className="mt-0 min-h-[1px] w-px flex-1 bg-[#475467]" aria-hidden />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold leading-6 tracking-normal text-[#101828]">
              {title}
            </p>
            {lines.map((line, i) => (
              <p
                key={i}
                className={cn(
                  "text-sm leading-5 tracking-normal text-[#475467]",
                  line.weight === "medium" ? "font-medium" : "font-normal",
                  line.singleLine &&
                    "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                )}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      </div>
      {showConnectorAfter ? (
        <div className="flex h-4 w-7 shrink-0 justify-center">
          <div className="h-full w-px bg-[#475467]" aria-hidden />
        </div>
      ) : null}
    </li>
  );
}
