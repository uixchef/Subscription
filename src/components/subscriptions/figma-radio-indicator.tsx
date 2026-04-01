"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Radio control surface from Figma Subscription 2025 (Create subscription modal):
 * 16×16, radius 8, border #98a2b3 default / #155eef selected, white check when selected.
 */
export function FigmaRadioIndicator({
  checked,
  className,
}: {
  checked: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center rounded-[8px] border",
        checked
          ? "border-[#155eef] bg-[#155eef]"
          : "border-[#98a2b3] bg-white",
        className
      )}
      aria-hidden
    >
      {checked ? (
        <Check className="size-3 text-white" strokeWidth={3} />
      ) : null}
    </span>
  );
}
