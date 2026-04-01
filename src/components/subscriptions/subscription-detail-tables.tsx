import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

import {
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { cn } from "@/lib/utils";

/** Figma 1193:69367 — column chrome (icon + label). */
export type DataColumn = {
  key: string;
  label: string;
  icon?: LucideIcon;
  widthClass?: string;
  headerAlign?: "left" | "right";
};

type DataTableCardProps = {
  title: string;
  /** Search (and table pagination footer, when used) align to rows **> 5**. */
  rowCount: number;
  searchPlaceholder?: string;
  columns: DataColumn[];
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Subscription-2025 — bordered data table card (toolbar + grid + optional footer).
 * Matches Figma: CRUD bar, 36px header/body rows, #f2f4f7 headers, #d0d5dd grid.
 */
export function DataTableCard({
  title,
  rowCount,
  searchPlaceholder = "Search",
  columns,
  children,
  footer,
}: DataTableCardProps) {
  const showSearch = rowCount > 5;
  return (
    <div className="overflow-hidden rounded-[4px] border border-[#d0d5dd] bg-white shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]">
      <div className="flex items-center justify-between gap-2 border-b border-[#d0d5dd] bg-white px-3 py-2">
        <h3 className="text-base font-semibold leading-6 text-[#101828]">{title}</h3>
        {showSearch ? (
          <div
            className={cn(
              "flex h-8 w-[198px] max-w-full shrink-0 items-center gap-1 rounded-[4px] border border-[#d0d5dd] bg-white px-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
              figmaFieldFocusWithin
            )}
            role="search"
          >
            <Search className="size-4 shrink-0 text-[#667085]" strokeWidth={2} aria-hidden />
            <input
              type="search"
              placeholder={searchPlaceholder}
              aria-label={`Search ${title}`}
              className={cn(
                "min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-normal leading-5 text-[#101828] outline-none placeholder:text-[#667085] focus:outline-none focus-visible:outline-none focus-visible:ring-0",
                figmaFieldInnerInput
              )}
            />
          </div>
        ) : null}
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "h-9 border-b border-r border-[#d0d5dd] bg-[#f2f4f7] px-3 align-middle last:border-r-0",
                    c.widthClass,
                    c.headerAlign === "right" && "text-right"
                  )}
                >
                  <div
                    className={cn(
                      "flex min-w-0 items-center gap-1",
                      c.headerAlign === "right" && "justify-end"
                    )}
                  >
                    {c.icon ? (
                      <c.icon className="size-4 shrink-0 text-[#475467]" strokeWidth={2} aria-hidden />
                    ) : null}
                    <span className="min-w-0 truncate text-base font-semibold leading-6 text-[#101828]">
                      {c.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  );
}

const cellBase =
  "h-9 max-h-9 border-b border-r border-[#d0d5dd] px-3 align-middle text-base font-medium leading-6 text-[#475467] last:border-r-0";

export function DataTableCell({
  className,
  alignRight,
  children,
}: {
  className?: string;
  alignRight?: boolean;
  children: ReactNode;
}) {
  return <td className={cn(cellBase, alignRight && "text-right", className)}>{children}</td>;
}

export { TablePaginationFooter } from "@/components/subscriptions/table-pagination-footer";
