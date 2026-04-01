"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuSearchField,
  DropdownMenuSearchFooter,
  DropdownMenuSearchScrollArea,
  SEARCHABLE_DROPDOWN_MENU_CONTENT_CLASS,
} from "@/components/ui/dropdown-menu-search-panel";
import { figmaFieldFocusVisible } from "@/components/subscriptions/figma-field-focus";
import {
  CUSTOMER_DEMO_PROFILES,
  type CustomerDemoProfile,
} from "@/components/subscriptions/customer-demo-data";
import { cn } from "@/lib/utils";

export type CustomerOption = CustomerDemoProfile;

/** Demo directory — identity + default address/phone per customer. */
export const CUSTOMERS = CUSTOMER_DEMO_PROFILES;

export function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function findCustomerById(id: string): CustomerOption | undefined {
  return CUSTOMERS.find((c) => c.id === id);
}

export function CustomerAvatar({
  option,
  className,
}: {
  option: CustomerOption;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-[#344054]",
        className
      )}
      style={{ backgroundColor: option.avatarBg ?? "#e4e7ec" }}
      aria-hidden
    >
      {initialsFromName(option.name)}
    </span>
  );
}

type CustomerSelectProps = {
  id?: string;
  value: string;
  onValueChange: (id: string) => void;
  onAddCustomer?: () => void;
};

export function CustomerSelect({
  id,
  value,
  onValueChange,
  onAddCustomer,
}: CustomerSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const selected = useMemo(
    () => CUSTOMERS.find((c) => c.id === value),
    [value]
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CUSTOMERS;
    return CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const label = selected?.name ?? "Select customer";

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => {
        if (!open) setSearchQuery("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "group flex h-9 w-full min-h-9 items-center justify-between gap-2 rounded border border-[#d0d5dd] bg-white p-2 text-left text-base leading-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
            figmaFieldFocusVisible,
            "data-[state=open]:border-[#84adff] data-[state=open]:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_#d1e0ff]",
            selected ? "text-[#101828]" : "text-[#475467]"
          )}
        >
          <span className="min-w-0 truncate">{label}</span>
          <ChevronDown
            className="size-4 shrink-0 text-[#344054] transition-transform duration-200 group-data-[state=open]:rotate-180"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className={SEARCHABLE_DROPDOWN_MENU_CONTENT_CLASS}
      >
        <DropdownMenuSearchField
          inputId={id ? `${id}-search` : undefined}
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search"
        />
        <DropdownMenuSearchScrollArea>
          {filteredCustomers.length === 0 ? (
            <div className="px-4 py-3 text-sm leading-5 text-[#667085]">
              No customers match your search.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isSelected = c.id === value;
              return (
                <DropdownMenuItem
                  key={c.id}
                  selected={isSelected}
                  className="cursor-pointer rounded-none border-0 px-4 py-2 text-left text-base font-medium shadow-none"
                  onSelect={() => onValueChange(c.id)}
                >
                  <div className="flex w-full min-w-0 items-center gap-2 rounded-md">
                    <CustomerAvatar option={c} />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p
                          className={cn(
                            "truncate text-base leading-6 text-[#101828]",
                            isSelected ? "font-semibold" : "font-medium"
                          )}
                        >
                          {c.name}
                        </p>
                      </div>
                      <p className="truncate text-sm font-normal leading-5 text-[#475467]">
                        {c.email}
                      </p>
                    </div>
                    {isSelected ? (
                      <Check
                        className="size-4 shrink-0 text-[#155eef]"
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuSearchScrollArea>
        <DropdownMenuSearchFooter>
          <DropdownMenuItem
            className="cursor-pointer justify-start gap-2 rounded-none px-4 py-2 text-base font-semibold leading-6 text-[#004eeb] data-[highlighted]:bg-[#f9fafb] data-[highlighted]:text-[#004eeb]"
            onSelect={() => onAddCustomer?.()}
          >
            <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            Add customer
          </DropdownMenuItem>
        </DropdownMenuSearchFooter>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
