"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Figma 1164:119519 — Radio row: parent uses `gap-4` (16px) between options; 4px control–label; 16px rounded radios + check when selected. */
export function FigmaRadioRowOption({
  selected,
  label,
  onSelect,
}: {
  selected: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex shrink-0 items-center gap-1 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-lg border",
          selected
            ? "border-[#155eef] bg-[#155eef]"
            : "border-[#98a2b3] bg-white"
        )}
        aria-hidden
      >
        {selected ? (
          <Check className="size-2.5 text-white" strokeWidth={3} aria-hidden />
        ) : null}
      </span>
      <span className="text-base font-normal leading-6 text-[#101828]">{label}</span>
    </button>
  );
}
