"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";

import {
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-transparent text-[#101828]",
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

/**
 * Search field for cmdk lists — inset padded shell + bordered row with leading icon
 * (aligned with subscriptions toolbar search / HighRise dropdown search pattern).
 */
const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="shrink-0 border-b border-[#e4e7ec] bg-white px-2 pb-2 pt-2"
    cmdk-input-wrapper=""
  >
    <div
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded border border-[#d0d5dd] bg-white px-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
        figmaFieldFocusWithin
      )}
    >
      <Search
        className="pointer-events-none size-4 shrink-0 text-[#667085]"
        strokeWidth={2}
        aria-hidden
      />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-6 text-[#101828] outline-none placeholder:text-[#667085] disabled:cursor-not-allowed disabled:opacity-50",
          figmaFieldInnerInput,
          className
        )}
        {...props}
      />
    </div>
  </div>
));
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-[min(60vh,380px)] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-1 touch-pan-y outline-none [scrollbar-gutter:stable]",
      className
    )}
    {...props}
  />
));
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm text-[#475467]"
    {...props}
  />
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-[#101828] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-[#475467]",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & {
    /** Matches the field’s current value — distinct from cmdk keyboard highlight (`data-[selected]`). */
    isActiveChoice?: boolean;
  }
>(({ className, isActiveChoice, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    aria-current={isActiveChoice ? "true" : undefined}
    className={cn(
      "relative flex w-full min-w-0 cursor-pointer select-none items-center gap-2 rounded-none px-4 py-2 text-base leading-6 text-[#101828] outline-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      "data-[selected=true]:bg-[#f2f4f7]",
      isActiveChoice &&
        "bg-[#eff8ff] text-[#101828] data-[selected=true]:bg-[#e0edff]",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CommandPrimitive.Item.displayName;

export {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
};
