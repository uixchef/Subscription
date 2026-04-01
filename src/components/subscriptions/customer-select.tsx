"use client";

import { ChevronDown, Plus } from "lucide-react";
import { useMemo } from "react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type CustomerOption = {
  id: string;
  name: string;
  email: string;
  /** Same hex palette as subscriptions table `customer.avatarBg` */
  avatarBg?: string;
};

/** Backgrounds aligned with `subscriptions-table` CustomerCell / MOCK_ROWS. */
const CUSTOMERS: CustomerOption[] = [
  { id: "sg", name: "Sarthak Goyal", email: "hey@uixchef.com", avatarBg: "#f2f4f7" },
  {
    id: "eb",
    name: "Erin Ekstrom Bothman",
    email: "erinekstrombothman@gmail.com",
    avatarBg: "#dbeafe",
  },
  {
    id: "mc",
    name: "Madelyn Calzoni",
    email: "madelyncalzoni@gmail.com",
    avatarBg: "#dbc0dd",
  },
  {
    id: "mg",
    name: "Madelyn Geidt",
    email: "madelyngeidt@gmail.com",
    avatarBg: "#d1baa9",
  },
  {
    id: "ds",
    name: "Dulce Schleifer",
    email: "dulceschleifer@gmail.com",
    avatarBg: "#dfcc9f",
  },
  {
    id: "am",
    name: "Allison Mango",
    email: "allisonmango@gmail.com",
    avatarBg: "#c2c7b8",
  },
  {
    id: "oj",
    name: "Olivia John",
    email: "olivia.john@gmail.com",
    avatarBg: "#f2f4f7",
  },
  {
    id: "jh",
    name: "James Hall",
    email: "james.hall@gmail.com",
    avatarBg: "#dfcc9f",
  },
  {
    id: "ku",
    name: "Kris Ullman",
    email: "kris.ullman@gmail.com",
    avatarBg: "#c2c7b8",
  },
  {
    id: "lb",
    name: "Lori Bryson",
    email: "lori.bryson@gmail.com",
    avatarBg: "#d1baa9",
  },
  {
    id: "cg",
    name: "Chris Glasser",
    email: "chris.glasser@gmail.com",
    avatarBg: "#f2f4f7",
  },
  {
    id: "mw",
    name: "Marcus Webb",
    email: "marcus.webb@gmail.com",
    avatarBg: "#dbeafe",
  },
  {
    id: "ps",
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    avatarBg: "#dbc0dd",
  },
  {
    id: "nc",
    name: "Noah Chen",
    email: "noah.chen@gmail.com",
    avatarBg: "#dfcc9f",
  },
  {
    id: "tr",
    name: "Taylor Reid",
    email: "taylor.reid@gmail.com",
    avatarBg: "#c2c7b8",
  },
  {
    id: "av",
    name: "Avery Kim",
    email: "avery.kim@gmail.com",
    avatarBg: "#f2f4f7",
  },
  {
    id: "jr",
    name: "Jordan Rivera",
    email: "jordan.rivera@gmail.com",
    avatarBg: "#dbeafe",
  },
  {
    id: "em",
    name: "Emma Fitzgerald",
    email: "emma.fitzgerald@gmail.com",
    avatarBg: "#dbc0dd",
  },
];

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CustomerAvatar({ option }: { option: CustomerOption }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-[#344054]"
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
};

export function CustomerSelect({ id, value, onValueChange }: CustomerSelectProps) {
  const { showSuccess } = useHubToast();

  const selected = useMemo(
    () => CUSTOMERS.find((c) => c.id === value),
    [value]
  );

  const label = selected?.name ?? "Select customer";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "group flex h-9 w-full min-h-9 items-center justify-between gap-2 rounded border border-[#d0d5dd] bg-white p-2 text-left text-base leading-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none",
            "focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
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
        className={cn(
          "z-[200] w-[320px] max-w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded border border-[#d0d5dd] bg-white p-0 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
        )}
      >
        <DropdownMenuItem
          className="cursor-pointer justify-start gap-2 rounded-none px-4 py-2 text-base font-semibold leading-6 text-[#004eeb] focus:bg-white data-[highlighted]:bg-[#f9fafb]"
          onSelect={() => showSuccess("Add customer flow would open here.")}
        >
          <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          Add customer
        </DropdownMenuItem>
        <div className="h-px w-full bg-[#d0d5dd]" role="separator" />
        <div className="max-h-[min(356px,calc(100vh-12rem))] overflow-y-auto overflow-x-hidden py-1">
          {CUSTOMERS.map((c) => (
            <DropdownMenuItem
              key={c.id}
              className="cursor-pointer rounded-none border-0 bg-transparent px-4 py-2 text-left shadow-none focus:bg-[#f9fafb] data-[highlighted]:bg-[#f9fafb]"
              onSelect={() => onValueChange(c.id)}
            >
              <div className="flex w-full min-w-0 items-center gap-2 rounded-md">
                <CustomerAvatar option={c} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-base font-medium leading-6 text-[#101828]">
                      {c.name}
                    </p>
                  </div>
                  <p className="truncate text-sm font-normal leading-5 text-[#475467]">
                    {c.email}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
