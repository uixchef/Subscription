"use client";

import * as React from "react";
import {
  DropdownMenu as DropdownMenuRoot,
  DropdownMenuContent as DropdownMenuContentRadix,
  DropdownMenuGroup as DropdownMenuGroupRadix,
  DropdownMenuItem as DropdownMenuItemRadix,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

import { cn } from "@/lib/utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuRoot>) {
  return <DropdownMenuRoot data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  onWheel,
  ...props
}: React.ComponentProps<typeof DropdownMenuContentRadix>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuContentRadix
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-h-0 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
        onWheel={(event) => {
          // Dialog uses react-remove-scroll; without this, wheel events don’t scroll portaled menus.
          event.stopPropagation();
          onWheel?.(event);
        }}
      />
    </DropdownMenuPortal>
  );
}

function DropdownMenuGroup({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuGroupRadix>) {
  return (
    <DropdownMenuGroupRadix
      data-slot="dropdown-menu-group"
      className={className}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  inset,
  selected,
  ...props
}: React.ComponentProps<typeof DropdownMenuItemRadix> & {
  inset?: boolean;
  /** Current value in option lists (e.g. customer picker). Distinct from keyboard/hover highlight. */
  selected?: boolean;
}) {
  return (
    <DropdownMenuItemRadix
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-selected={selected ? "true" : undefined}
      aria-selected={selected}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-popover-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[inset]:pl-8 data-[highlighted]:bg-[#f2f4f7] data-[highlighted]:text-[#101828] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        selected &&
          "bg-[#eff8ff] text-[#101828] data-[highlighted]:bg-[#e0edff] data-[highlighted]:text-[#101828]",
        className
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
};
