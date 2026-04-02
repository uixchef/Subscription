"use client";

import {
  Calendar,
  Check,
  ClipboardCheck,
  Info,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";

import { Separator } from "@/components/ui/separator";
import type { SubscriptionTaxDisplayLine } from "@/components/subscriptions/tax-catalog";
import { formatDateMMDDYYYY, parseMMDDYYYY } from "@/lib/date-format";
import { cn } from "@/lib/utils";

function naturalQty(n: number): number {
  const f = Math.floor(Number(n));
  return Number.isFinite(f) && f >= 1 ? f : 1;
}

function lineSubCents(price: number, qty: number): number {
  return Math.round(price * naturalQty(qty) * 100);
}

function formatUsdParts(n: number): { dollars: string; cents: string } {
  const [a, b = "00"] = n.toFixed(2).split(".");
  return { dollars: a!, cents: b };
}

/** Figma Summary: "30 Oct, 2025" */
function formatDayMonthCommaYear(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${day} ${month}, ${year}`;
}

/** Figma: “July 24, 2025” from internal MM/DD/YYYY labels. */
function formatDueDateLong(usMdY: string): string {
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(usMdY.trim())) {
    return usMdY;
  }
  try {
    const d = parseMMDDYYYY(usMdY.trim());
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return usMdY;
  }
}

function formatDueDateLongFromDate(d: Date): string {
  return formatDueDateLong(formatDateMMDDYYYY(d));
}

/** Figma reset row: "Bills 8 October, 2025" */
function formatBillsResetLine(d: Date): string {
  const rest = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `Bills ${rest}`;
}

function calendarMonthsBetween(a: Date, b: Date): number {
  return Math.max(
    0,
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

type PreviewLine = {
  name: string;
  price: number;
  qty: number;
  taxPercent: number | null;
};

type SummaryTimelineProps = {
  amountDue: number;
  summaryStartDate: Date;
  summaryNextChargeDate: Date;
  summaryFrequencyEnabled: boolean;
  summaryFrequencyStartDate: Date;
  summaryFrequencyEndDate: Date;
};

/**
 * Figma 1159:50354 — Summary tab: vertical progress steps + connector line.
 */
function SummaryTimeline({
  amountDue,
  summaryStartDate,
  summaryNextChargeDate,
  summaryFrequencyEnabled,
  summaryFrequencyStartDate,
  summaryFrequencyEndDate,
}: SummaryTimelineProps) {
  const amt = amountDue.toFixed(2);
  const cyclesBetween = summaryFrequencyEnabled
    ? Math.max(0, calendarMonthsBetween(
        summaryFrequencyStartDate,
        summaryFrequencyEndDate
      ))
    : 2;
  const milestoneTitle = formatDueDateLongFromDate(
    summaryFrequencyEnabled
      ? summaryFrequencyEndDate
      : summaryNextChargeDate
  );

  const steps: Array<{
    key: string;
    Icon: typeof Calendar;
    title: string;
    lines: Array<{ text: string; weight: "medium" | "normal" }>;
    showConnector: boolean;
  }> = [
    {
      key: "immediate",
      Icon: Calendar,
      title: formatDayMonthCommaYear(summaryStartDate),
      lines: [
        {
          text: "Billed immediately for 1 month",
          weight: "medium",
        },
      ],
      showConnector: true,
    },
    {
      key: "next",
      Icon: ClipboardCheck,
      title: "Next payment",
      lines: [
        { text: `Amount due $${amt}`, weight: "medium" },
        {
          text: `Bills on ${formatDayMonthCommaYear(summaryNextChargeDate)} for 1 month`,
          weight: "normal",
        },
      ],
      showConnector: true,
    },
    {
      key: "cycles",
      Icon: Check,
      title: "Billing cycles",
      lines: [{ text: `In between: ${cyclesBetween}`, weight: "medium" }],
      showConnector: true,
    },
    {
      key: "future",
      Icon: Calendar,
      title: milestoneTitle,
      lines: [
        { text: `Amount due $${amt}`, weight: "medium" },
        { text: "Subscription updates", weight: "normal" },
      ],
      showConnector: true,
    },
    {
      key: "reset",
      Icon: RefreshCw,
      title: "Reset billing cycle",
      lines: [{ text: formatBillsResetLine(summaryNextChargeDate), weight: "medium" }],
      showConnector: false,
    },
  ];

  return (
    <div className="flex w-full max-w-[276px] flex-col">
      {steps.map((step) => (
        <div key={step.key} className="flex gap-2">
          <div className="flex w-7 shrink-0 flex-col items-center">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#475467] bg-white">
              <step.Icon
                className="size-4 text-[#475467]"
                strokeWidth={2}
                aria-hidden
              />
            </div>
            {step.showConnector ? (
              <div className="mt-0 min-h-4 w-px flex-1 bg-[#475467]" aria-hidden />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 pb-4">
            <p className="text-base font-semibold leading-6 text-[#101828]">
              {step.title}
            </p>
            <div className="mt-0.5 flex flex-col gap-0.5">
              {step.lines.map((line, i) => (
                <p
                  key={`${step.key}-l-${i}`}
                  className={cn(
                    "text-sm leading-5 text-[#475467]",
                    line.weight === "medium" ? "font-medium" : "font-normal"
                  )}
                >
                  {line.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Figma 1159:103379 — Preview: tabs, Summary timeline or Calculations table + breakdown.
 */
export function UpdateSubscriptionPreviewPanel({
  activeTab,
  onTabChange,
  amountDue,
  dueDateLabel,
  summaryStartDate,
  summaryNextChargeDate,
  summaryFrequencyEnabled,
  summaryFrequencyStartDate,
  summaryFrequencyEndDate,
  lines,
  lineSubtotal,
  taxableSubtotal,
  discountAdded,
  couponCode,
  discountAmount,
  taxSummaryLines,
  hasLineItemTax,
}: {
  activeTab: "summary" | "calculations";
  onTabChange: (t: "summary" | "calculations") => void;
  amountDue: number;
  dueDateLabel: string;
  summaryStartDate: Date;
  summaryNextChargeDate: Date;
  summaryFrequencyEnabled: boolean;
  summaryFrequencyStartDate: Date;
  summaryFrequencyEndDate: Date;
  lines: PreviewLine[];
  lineSubtotal: number;
  taxableSubtotal: number;
  discountAdded: boolean;
  couponCode: string;
  discountAmount: number;
  taxSummaryLines: SubscriptionTaxDisplayLine[];
  hasLineItemTax: boolean;
}) {
  const hero = formatUsdParts(amountDue);
  const dueLong = useMemo(
    () => formatDueDateLong(dueDateLabel),
    [dueDateLabel]
  );

  return (
    <aside
      className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col overflow-hidden rounded border border-[#d0d5dd] bg-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] lg:w-[min(520px,calc(100vw-2rem))]"
      aria-label="Subscription preview"
    >
      <div className="flex shrink-0 gap-2 border-b border-[#d0d5dd] bg-white px-4 pt-2">
        <div className="flex min-h-0 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => onTabChange("summary")}
            className={cn(
              "flex h-10 shrink-0 items-center rounded-t px-2 pb-2 pt-1 text-base leading-6 transition-colors",
              activeTab === "summary"
                ? "border-b-2 border-[#004eeb] font-semibold text-[#004eeb]"
                : "border-b-2 border-transparent font-medium text-[#475467]"
            )}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => onTabChange("calculations")}
            className={cn(
              "flex h-10 shrink-0 items-center rounded-t px-2 pb-2 pt-1 text-base leading-6 transition-colors",
              activeTab === "calculations"
                ? "border-b-2 border-[#004eeb] font-semibold text-[#004eeb]"
                : "border-b-2 border-transparent font-medium text-[#475467]"
            )}
          >
            Calculations
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-[#f2f4f7] p-4">
        {activeTab === "summary" ? (
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
            <SummaryTimeline
              amountDue={amountDue}
              summaryStartDate={summaryStartDate}
              summaryNextChargeDate={summaryNextChargeDate}
              summaryFrequencyEnabled={summaryFrequencyEnabled}
              summaryFrequencyStartDate={summaryFrequencyStartDate}
              summaryFrequencyEndDate={summaryFrequencyEndDate}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[4px] bg-white shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.1),0px_2px_4px_-2px_rgba(16,24,40,0.06)]">
            <div className="shrink-0 border-b border-[#d0d5dd] bg-white px-4 py-4">
              <p className="text-[18px] font-semibold leading-7 text-[#101828] tabular-nums">
                ${hero.dollars}.{hero.cents} USD due {dueLong}
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full min-w-[400px] table-fixed border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th className="h-9 min-h-9 border-b border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left text-base font-semibold leading-6 text-[#101828]">
                      Item
                    </th>
                    <th className="h-9 min-h-9 w-[100px] border-b border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left text-base font-semibold leading-6 text-[#101828]">
                      Price
                    </th>
                    <th className="h-9 min-h-9 w-[60px] border-b border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left text-base font-semibold leading-6 text-[#101828]">
                      Qty
                    </th>
                    <th className="h-9 min-h-9 w-[80px] border-b border-[#d0d5dd] bg-[#f2f4f7] px-3 text-center text-base font-semibold leading-6 text-[#101828]">
                      Tax
                    </th>
                    <th className="h-9 min-h-9 w-[90px] border-b border-[#d0d5dd] bg-[#f2f4f7] px-3 text-right text-base font-semibold leading-6 text-[#101828]">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((row, i) => {
                    const subC = lineSubCents(row.price, row.qty);
                    const subStr = (subC / 100).toFixed(2);
                    return (
                      <tr key={`${row.name}-${i}`}>
                        <td className="min-h-9 border-b border-[#d0d5dd] px-3 py-1 text-base font-medium leading-6 text-[#475467]">
                          <span className="line-clamp-2">{row.name}</span>
                        </td>
                        <td className="min-h-9 border-b border-[#d0d5dd] px-3 py-1 text-left tabular-nums text-base font-medium leading-6 text-[#475467]">
                          ${row.price.toFixed(2)}
                        </td>
                        <td className="min-h-9 border-b border-[#d0d5dd] px-3 py-1 text-left tabular-nums text-base font-medium leading-6 text-[#475467]">
                          {naturalQty(row.qty)}
                        </td>
                        <td className="min-h-9 border-b border-[#d0d5dd] px-3 py-1 text-center text-base font-medium leading-6 text-[#475467]">
                          {row.taxPercent != null ? (
                            <span className="inline-flex items-center justify-center gap-1">
                              {row.taxPercent}%
                              <Info
                                className="size-4 shrink-0 text-[#667085]"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="min-h-9 border-b border-[#d0d5dd] px-3 py-1 text-right tabular-nums text-base font-medium leading-6 text-[#475467]">
                          ${subStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex shrink-0 flex-col bg-white py-4 pl-0 pr-4">
              <div className="ml-auto flex w-full max-w-[330px] flex-col gap-1">
                <BreakdownRow
                  label="Subtotal"
                  value={`$${lineSubtotal.toFixed(2)}`}
                />
                {discountAdded ? (
                  <BreakdownRow
                    label={`Discount (${couponCode})`}
                    value={`-$${discountAmount.toFixed(2)}`}
                  />
                ) : null}
                <BreakdownRow
                  label="Taxable subtotal"
                  value={`$${taxableSubtotal.toFixed(2)}`}
                />
                {hasLineItemTax
                  ? taxSummaryLines.map((tl) => (
                      <BreakdownRow
                        key={tl.key}
                        label={tl.label}
                        value={`$${tl.amount.toFixed(2)}`}
                      />
                    ))
                  : null}
                <Separator className="my-2 w-full bg-[#eaecf0]" />
                <BreakdownRow
                  label="Amount due"
                  value={`$${amountDue.toFixed(2)}`}
                  emphasize
                />
                <BreakdownRow
                  label="Amount due after trial"
                  value={`$${amountDue.toFixed(2)}`}
                  emphasize
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function BreakdownRow({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex w-full items-start gap-0">
      <div className="flex min-w-0 flex-1 px-3">
        <span className="min-w-0 text-base font-medium leading-6 text-[#101828]">
          {label}
        </span>
      </div>
      <div
        className={cn(
          "w-[90px] shrink-0 px-3 text-right tabular-nums text-base leading-6 text-[#101828]",
          emphasize ? "font-semibold" : "font-medium"
        )}
      >
        {value}
      </div>
    </div>
  );
}
