import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import type { SubscriptionPaymentMode } from "@/components/subscriptions/subscription-row-model";
import { cn } from "@/lib/utils";

/**
 * Subscription-2025 Figma node 1193:62717 — Subscriptions header Variant2
 * (back + "Subscription details" + Live / Test mode badge).
 *
 * Live: same success tokens as Active status (`bg-[#ecfdf3]`, `text-[#027a48]`).
 * Test: same surface as Canceled banner rail (`bg-[#fffaeb]`, `text-[#b54708]`, border `#eaecf0`).
 */
export function SubscriptionDetailHeader({
  paymentMode,
}: {
  paymentMode: SubscriptionPaymentMode;
}) {
  const isLive = paymentMode === "live";

  return (
    <header className="flex h-12 w-full min-w-0 shrink-0 items-center border-b border-[#d0d5dd] bg-white px-4">
      <div className="flex w-full items-center gap-2">
        <Link
          href="/subscriptions"
          className="flex items-center gap-2 text-[#101828] outline-none transition-colors hover:text-[#344054] focus-visible:ring-2 focus-visible:ring-[#f2f4f7] focus-visible:ring-offset-2"
        >
          <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
            <ArrowLeft className="size-4" strokeWidth={2} />
          </span>
          <span className="text-base font-semibold leading-6 tracking-normal">
            Subscription details
          </span>
        </Link>
        <span
          className={cn(
            "inline-flex h-6 min-h-6 max-h-6 items-center justify-center rounded-[12px] border border-solid px-2 text-sm font-medium leading-5",
            isLive
              ? "border-[#eaecf0] bg-[#ecfdf3] text-[#027a48]"
              : "border-[#eaecf0] bg-[#fffaeb] text-[#b54708]"
          )}
        >
          {isLive ? "Live mode" : "Test mode"}
        </span>
      </div>
    </header>
  );
}
