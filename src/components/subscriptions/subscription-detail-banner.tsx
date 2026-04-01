import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  PauseCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { SubscriptionStatus } from "@/components/subscriptions/subscription-row-model";
import { SubscriptionDetailBannerActions } from "@/components/subscriptions/subscription-detail-banner-actions";
import { formatDateMMDDYYYY, parseMMDDYYYY } from "@/lib/date-format";
import { cn } from "@/lib/utils";

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

type BannerTheme = {
  wrap: string;
  iconWrap: string;
  icon: LucideIcon;
  titleClass: string;
};

const bannerThemes: Record<SubscriptionStatus, BannerTheme> = {
  Active: {
    wrap: "bg-[#ecfdf3] border-[#eaecf0]",
    iconWrap: "bg-[#027a48] border-[#eaecf0]",
    icon: CheckCircle2,
    titleClass: "text-[#027a48]",
  },
  Trailing: {
    wrap: "bg-[#eff4ff] border-[#eaecf0]",
    iconWrap: "bg-[#004eeb] border-[#eaecf0]",
    icon: RefreshCw,
    titleClass: "text-[#004eeb]",
  },
  Scheduled: {
    wrap: "bg-[#eff4ff] border-[#eaecf0]",
    iconWrap: "bg-[#004eeb] border-[#eaecf0]",
    icon: CalendarClock,
    titleClass: "text-[#004eeb]",
  },
  Canceled: {
    wrap: "bg-[#fffaeb] border-[#eaecf0]",
    iconWrap: "bg-[#b54708] border-[#eaecf0]",
    icon: XCircle,
    titleClass: "text-[#b54708]",
  },
  Incomplete: {
    wrap: "bg-[#fef3f2] border-[#eaecf0]",
    iconWrap: "bg-[#b42318] border-[#eaecf0]",
    icon: AlertCircle,
    titleClass: "text-[#b42318]",
  },
  Paused: {
    wrap: "bg-[#f2f4f7] border-[#eaecf0]",
    iconWrap: "bg-[#344054] border-[#eaecf0]",
    icon: PauseCircle,
    titleClass: "text-[#344054]",
  },
};

function bannerCopy(
  status: SubscriptionStatus,
  createdOn: string
): { title: string; description: string } {
  const created = parseMMDDYYYY(createdOn);
  const trialEnd = addDays(created, 44);
  const nextBill = addDays(created, 12);

  switch (status) {
    case "Trailing":
      return {
        title: `Trial ends on ${formatDateMMDDYYYY(trialEnd)}`,
        description:
          "This subscription is currently in trial. Billing will start automatically once the trial ends.",
      };
    case "Active":
      return {
        title: "Subscription is active",
        description: `Next payment is scheduled. Billing continues on ${formatDateMMDDYYYY(nextBill)} unless you make changes.`,
      };
    case "Scheduled":
      return {
        title: `Starts on ${formatDateMMDDYYYY(addDays(created, 4))}`,
        description:
          "This subscription is scheduled. No charges apply until the start date.",
      };
    case "Paused":
      return {
        title: "Subscription is paused",
        description:
          "Billing is paused. Resume anytime to continue the subscription.",
      };
    case "Canceled":
      return {
        title: "Subscription canceled",
        description:
          "This subscription is canceled. No further charges will be attempted.",
      };
    case "Incomplete":
      return {
        title: "Payment required",
        description:
          "Complete payment to activate this subscription and avoid interruption.",
      };
    default:
      return { title: "", description: "" };
  }
}

export function SubscriptionDetailBanner({
  displayStatus,
  baseStatus,
  amount,
  createdOn,
  subscriptionId,
}: {
  displayStatus: SubscriptionStatus;
  baseStatus: SubscriptionStatus;
  amount: string;
  createdOn: string;
  subscriptionId: string;
}) {
  const theme = bannerThemes[displayStatus];
  const Icon = theme.icon;
  const { title, description } = bannerCopy(displayStatus, createdOn);

  return (
    <div
      className={cn(
        "flex flex-col gap-12 border border-solid border-[#eaecf0] p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-12",
        theme.wrap
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-2xl border border-solid",
                theme.iconWrap
              )}
            >
              <Icon className="size-[18px] text-white" strokeWidth={2} aria-hidden />
            </span>
            <h2
              className={cn(
                "min-w-0 text-xl font-semibold leading-[30px] tracking-normal",
                theme.titleClass
              )}
            >
              {title}
            </h2>
          </div>
          <p className="text-sm font-normal leading-5 text-[#475467]">{description}</p>
        </div>
        <SubscriptionDetailBannerActions
          subscriptionId={subscriptionId}
          displayStatus={displayStatus}
          baseStatus={baseStatus}
        />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 whitespace-nowrap text-[#101828]">
        <span className="text-sm font-normal leading-5">Total amount</span>
        <span className="text-2xl font-bold leading-8 tracking-normal">{amount}</span>
      </div>
    </div>
  );
}
