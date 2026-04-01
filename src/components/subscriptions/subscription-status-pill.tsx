import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import { cn } from "@/lib/utils";

export function SubscriptionStatusPill({
  status,
}: {
  status: SubscriptionRow["status"];
}) {
  const map: Record<SubscriptionRow["status"], string> = {
    Active: "bg-[#ecfdf3] text-[#027a48]",
    Trailing: "bg-[#eff4ff] text-[#004eeb]",
    Scheduled: "bg-[#eff4ff] text-[#004eeb]",
    Canceled: "bg-[#fffaeb] text-[#b54708]",
    Incomplete: "bg-[#fef3f2] text-[#b42318]",
    Paused: "bg-[#f2f4f7] text-[#344054]",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-sm font-medium",
        map[status]
      )}
    >
      {status}
    </span>
  );
}
