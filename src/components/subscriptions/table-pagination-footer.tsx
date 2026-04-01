"use client";

import { useEffect, useMemo } from "react";

import { figmaFieldFocusVisible } from "@/components/subscriptions/figma-field-focus";
import { getPaginationItems } from "@/components/subscriptions/pagination-utils";
import { cn } from "@/lib/utils";

export type TablePaginationFooterProps = {
  totalRows: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

/**
 * Same pagination pattern as the subscriptions dashboard (`subscriptions-table.tsx`),
 * with the detail table footer border (`border-t border-[#eaecf0]` + `px-2 py-2`).
 *
 * Only shown when there are **more than 5** rows; otherwise returns `null`.
 * Minimum “rows per page” option is **5**.
 */
export function TablePaginationFooter({
  totalRows,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}: TablePaginationFooterProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / perPage));

  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [totalPages, page, onPageChange]);

  const start = totalRows === 0 ? 0 : (page - 1) * perPage + 1;
  const end = totalRows === 0 ? 0 : Math.min(totalRows, page * perPage);

  const paginationItems = useMemo(
    () => getPaginationItems(page, totalPages),
    [page, totalPages]
  );

  if (totalRows <= 5) {
    return null;
  }

  return (
    <div className="flex h-fit w-full shrink-0 flex-nowrap items-end justify-end gap-4 border-t border-[#eaecf0] bg-white px-2 py-2 text-left">
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <label className="flex items-center gap-1 text-sm font-medium leading-5 text-[#475467]">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            value={perPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
            }}
            className={cn(
              "h-8 min-w-[64px] cursor-pointer rounded border border-[#d0d5dd] bg-white px-2 py-1.5 text-sm font-normal leading-5 text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-[#98a2b3]",
              figmaFieldFocusVisible
            )}
            aria-label="Rows per page"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
        <p className="text-sm font-normal leading-5 text-[#475467]">
          {start}-{end} of {totalRows}
        </p>
      </div>
      <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 py-1 text-sm font-semibold leading-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors",
            page <= 1
              ? "cursor-not-allowed text-[#d0d5dd]"
              : "text-[#475467] hover:bg-slate-50"
          )}
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {paginationItems.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 text-sm leading-5 text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                aria-hidden
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={cn(
                  "inline-flex min-h-8 min-w-8 items-center justify-center rounded p-1.5 text-sm font-normal leading-5 text-[#475467] transition-colors",
                  page === item
                    ? "border border-[#2970ff] bg-white"
                    : "border border-transparent hover:bg-slate-100"
                )}
                aria-current={page === item ? "page" : undefined}
              >
                {item}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 py-1 text-sm font-semibold leading-5 text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-[#d0d5dd]"
          )}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
