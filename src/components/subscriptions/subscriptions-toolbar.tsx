"use client";

import { Filter, Plus, Search, ChevronsUpDown } from "lucide-react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import { figmaFieldFocusWithin } from "@/components/subscriptions/figma-field-focus";
import { cn } from "@/lib/utils";

function FilterBadge({
  icon,
  label,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-0.5 rounded-[14px] border border-[#d0d5dd] bg-white pl-2 pr-3 text-sm font-medium leading-5 text-[#344054]",
        "shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
      )}
    >
      <span className="flex size-[18px] shrink-0 items-center justify-center text-[#475467] [&_svg]:size-[18px]">
        {icon}
      </span>
      {label}
    </button>
  );
}

export function SubscriptionsToolbar() {
  const { showSuccess } = useHubToast();

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <FilterBadge
          icon={<Plus className="size-[18px]" strokeWidth={2} />}
          label="Add filter"
          onSelect={() => showSuccess("Add filter")}
        />
        <FilterBadge
          icon={<Filter className="size-[18px]" strokeWidth={2} />}
          label="Advanced filters"
          onSelect={() => showSuccess("Advanced filters")}
        />
        <FilterBadge
          icon={<ChevronsUpDown className="size-[18px]" strokeWidth={2} />}
          label="Sort"
          onSelect={() => showSuccess("Sort")}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 justify-end">
        <div className="w-full max-w-[198px] shrink-0">
          <label htmlFor="subscriptions-toolbar-search" className="sr-only">
            Search subscriptions
          </label>
          <div
            className={cn(
              "flex h-9 w-full items-center gap-1 rounded-[4px] border border-[#d0d5dd] bg-white px-2 shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
              figmaFieldFocusWithin
            )}
          >
            <Search
              className="size-4 shrink-0 text-[#667085]"
              strokeWidth={2}
              aria-hidden
            />
            <input
              id="subscriptions-toolbar-search"
              type="search"
              placeholder="Search"
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-6 text-[#667085] outline-none placeholder:text-[#667085] focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
