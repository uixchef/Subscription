"use client";

import { Check, Info } from "lucide-react";
import { useMemo } from "react";

import { Separator } from "@/components/ui/separator";
import {
  buildUpdatePreviewSummarySteps,
  SummaryTimelineStep,
} from "@/components/subscriptions/subscription-summary-timeline";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import type { SubscriptionTaxDisplayLine } from "@/components/subscriptions/tax-catalog";
import { parseMMDDYYYY } from "@/lib/date-format";
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

/** Long due date for calculations header — matches subscription detail phrasing. */
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

type PreviewLine = {
  name: string;
  price: number;
  qty: number;
  taxPercent: number | null;
};

/**
 * Figma 1159:103379 — Preview: tabs, Summary (same rail as View subscription) or Calculations.
 */
export function UpdateSubscriptionPreviewPanel({
  activeTab,
  onTabChange,
  subscriptionRow,
  amountDue,
  dueDateLabel,
  summaryStartDate,
  summaryNextChargeDate,
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
  subscriptionRow: SubscriptionRow;
  amountDue: number;
  dueDateLabel: string;
  summaryStartDate: Date;
  summaryNextChargeDate: Date;
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

  const summarySteps = useMemo(
    () =>
      buildUpdatePreviewSummarySteps(
        subscriptionRow,
        summaryStartDate,
        summaryNextChargeDate,
        amountDue
      ),
    [
      subscriptionRow,
      summaryStartDate,
      summaryNextChargeDate,
      amountDue,
    ]
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
            <ol className="m-0 flex list-none flex-col px-1 py-0">
              {summarySteps.map((step, i) => (
                <SummaryTimelineStep
                  key={`${step.title}-${i}`}
                  icon={step.icon}
                  title={step.title}
                  lines={step.lines}
                  showConnectorAfter={step.showConnectorAfter}
                />
              ))}
            </ol>
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
