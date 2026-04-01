"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

import {
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { cn } from "@/lib/utils";

/**
 * Shell for HighRise / Ecommerce searchable dropdowns (Figma Ecommerce-HighRise 5966:92554):
 * sticky search on top, scroll only on list, CTA pinned at bottom.
 * Use on `DropdownMenuContent` with `align` / `sideOffset` as needed.
 */
export const SEARCHABLE_DROPDOWN_MENU_CONTENT_CLASS = cn(
  "z-[200] flex max-h-[min(400px,calc(100vh-8rem))] min-h-0 w-[320px] max-w-[min(320px,calc(100vw-2rem))] flex-col overflow-hidden rounded border border-[#d0d5dd] bg-white p-0 shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
);

type DropdownMenuSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional id for the input (e.g. from `useId()`). */
  inputId?: string;
};

export function DropdownMenuSearchField({
  value,
  onChange,
  placeholder = "Search",
  inputId,
}: DropdownMenuSearchFieldProps) {
  return (
    <div
      className="shrink-0 p-2"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "flex h-9 w-full items-center gap-1 rounded border border-[#d0d5dd] bg-white px-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
          figmaFieldFocusWithin
        )}
      >
        <Search
          className="pointer-events-none size-4 shrink-0 text-[#667085]"
          strokeWidth={2}
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label={placeholder}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-base leading-6 text-[#101828] placeholder:text-[#667085]",
            figmaFieldInnerInput
          )}
        />
      </div>
    </div>
  );
}

export function DropdownMenuSearchScrollArea({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-1",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSearchFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "shrink-0 border-t border-[#d0d5dd] bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}
