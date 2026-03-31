"use client";

import {
  Phone,
  Megaphone,
  HelpCircle,
  Bell,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const primaryTabs = [
  { id: "overview", label: "Overview" },
  { id: "invoices", label: "Invoices & estimates" },
  { id: "docs", label: "Docs & contracts" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "products", label: "Products" },
  { id: "integrations", label: "Integrations" },
] as const;

function getActiveTabId(
  pathname: string
): (typeof primaryTabs)[number]["id"] {
  if (pathname === "/subscriptions" || pathname.startsWith("/subscriptions/")) {
    return "subscriptions";
  }
  if (pathname === "/payments" || pathname.startsWith("/payments/")) {
    return "overview";
  }
  return "overview";
}

export function Topbar() {
  const pathname = usePathname();
  const activeTabId = getActiveTabId(pathname);

  return (
    <header className="w-full min-w-0 border-b border-[#d0d5dd] bg-white">
      <div className="flex w-full flex-col gap-3 px-4 py-2 md:h-10 md:flex-row md:items-stretch md:justify-between md:gap-12 md:py-0">
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <h1 className="shrink-0 text-xl font-semibold leading-[30px] tracking-normal text-[#101828]">
            Payments
          </h1>
          <nav
            className="flex min-h-0 min-w-0 flex-1 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Payments sections"
          >
            {primaryTabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center border-b-2 px-2 text-base leading-6 transition-colors",
                    isActive
                      ? "border-[#004eeb] font-semibold text-[#004eeb]"
                      : "border-transparent font-medium text-[#667085] hover:text-[#101828]"
                  )}
                >
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex h-full shrink-0 items-center gap-3">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg p-1.5 hover:bg-slate-50"
            aria-label="Phone"
          >
            <span className="relative flex size-5 items-center justify-center rounded-full bg-[#34d399]">
              <Phone className="size-3 text-white" strokeWidth={2} />
            </span>
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg p-1.5 text-[#667085] hover:bg-slate-50 hover:text-[#101828]"
            aria-label="Announcements"
          >
            <Megaphone className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg p-1.5 text-[#667085] hover:bg-slate-50 hover:text-[#101828]"
            aria-label="Help"
          >
            <HelpCircle className="size-5" strokeWidth={2} />
          </button>
          <button
            type="button"
            className="relative flex size-8 items-center justify-center rounded-lg p-1.5 text-[#667085] hover:bg-slate-50 hover:text-[#101828]"
            aria-label="Notifications"
          >
            <Bell className="size-5" strokeWidth={2} />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[#f56565]" />
          </button>
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d9d6fe] text-sm font-medium leading-5 text-[#475467]"
            aria-hidden
          >
            SG
          </div>
        </div>
      </div>
    </header>
  );
}
