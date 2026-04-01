"use client";

import { ArrowRight, Check, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import { figmaFieldFocusTransition, figmaFieldFocusVisible } from "@/components/subscriptions/figma-field-focus";
import { FigmaRadioRowOption } from "@/components/subscriptions/figma-radio-row-option";
import { getPaginationItems } from "@/components/subscriptions/pagination-utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TAX_NAME_ICONS = [
  "Sales tax",
  "Income tax",
  "VAT",
  "GST",
  "Use tax",
  "Excise tax",
] as const;

/** Catalog-sized list so manual tax uses the same pagination pattern as the dashboard. */
const ALL_TAX_TABLE_ROWS = Array.from({ length: 24 }, (_, i) => ({
  id: `tax-${i + 1}`,
  name:
    i < TAX_NAME_ICONS.length
      ? TAX_NAME_ICONS[i]
      : `Tax type ${i + 1}`,
  rate: 5 + (i % 15),
  taxId: `TID${5343 + i}`,
}));

export type TaxMode = "automatic" | "manual";

/**
 * Figma 1164:119519 — table checkbox (16px, radius 2px, Gray/300 border, Primary fill + check;
 * indeterminate = primary border + dash).
 */
function TaxTableCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onCheckedChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange: () => void;
  "aria-label": string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      className={cn(
        "inline-flex items-center justify-center leading-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
    >
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onCheckedChange()}
        className="peer sr-only"
        aria-label={ariaLabel}
      />
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[2px] border bg-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
          figmaFieldFocusTransition,
          !disabled &&
            "peer-focus-visible:border-[#84adff] peer-focus-visible:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_0_0_4px_#d1e0ff]",
          checked
            ? "border-[#155eef] bg-[#155eef]"
            : indeterminate
              ? "border-[#155eef] bg-white"
              : "border-[#d0d5dd] hover:border-[#98a2b3]",
          disabled && "hover:border-[#d0d5dd]"
        )}
        aria-hidden
      >
        {checked ? (
          <Check
            className="pointer-events-none size-3 text-white"
            strokeWidth={2.5}
            aria-hidden
          />
        ) : indeterminate ? (
          <span
            className="h-0.5 w-2 rounded-[1px] bg-[#155eef]"
            aria-hidden
          />
        ) : (
          <Check
            className="pointer-events-none size-3 text-white opacity-0"
            strokeWidth={2.5}
            aria-hidden
          />
        )}
      </span>
    </label>
  );
}

export type LineItemTaxSavePayload = {
  taxPercent: number;
  mode: TaxMode;
  /** Selected catalog tax row ids when `mode` is `manual` (empty when automatic). */
  selectedTaxIds: string[];
};

export type AddLineItemTaxModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `line` — title “Add taxes on '{productName}'”. `subscription` — title “Add tax” (all lines). */
  variant?: "line" | "subscription";
  /** Used when variant is `line`. */
  productName: string;
  /** `edit` — title “Edit tax” / “Edit taxes on …”; restores `initialMode` / `initialSelectedTaxIds`. */
  intent?: "add" | "edit";
  /** When reopening for edit (subscription or line). */
  initialMode?: TaxMode;
  /** When `initialMode` is `manual` (or omitted default), pre-check these rows. */
  initialSelectedTaxIds?: string[];
  onSave: (payload: LineItemTaxSavePayload) => void;
};

/** Figma 1164:119518 — Add taxes on line item (Automatically / Manually + table). */
export function AddLineItemTaxModal({
  open,
  onOpenChange,
  variant = "line",
  productName,
  intent = "add",
  initialMode,
  initialSelectedTaxIds,
  onSave,
}: AddLineItemTaxModalProps) {
  const { showSuccess } = useHubToast();
  const titleId = useId();
  const [mode, setMode] = useState<TaxMode>("manual");
  const [taxPage, setTaxPage] = useState(1);
  const [taxPerPage, setTaxPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(["tax-1"])
  );

  const initialSelectionKey =
    initialSelectedTaxIds?.join(",") ?? "";

  useEffect(() => {
    if (!open) return;
    const nextMode = initialMode ?? "manual";
    setMode(nextMode);
    setTaxPage(1);
    setTaxPerPage(10);
    if (nextMode === "automatic") {
      setSelectedIds(new Set());
    } else if (initialSelectedTaxIds && initialSelectedTaxIds.length > 0) {
      setSelectedIds(new Set(initialSelectedTaxIds));
    } else {
      setSelectedIds(new Set(["tax-1"]));
    }
  }, [open, initialMode, initialSelectionKey]);

  const displayName = productName.trim() || "Product";
  const isSubscriptionScope = variant === "subscription";

  const dialogTitle = isSubscriptionScope
    ? intent === "edit"
      ? "Edit tax"
      : "Add tax"
    : intent === "edit"
      ? `Edit taxes on '${displayName}'`
      : `Add taxes on '${displayName}'`;

  const manualPercent = useMemo(() => {
    let sum = 0;
    for (const row of ALL_TAX_TABLE_ROWS) {
      if (selectedIds.has(row.id)) sum += row.rate;
    }
    return sum;
  }, [selectedIds]);

  const totalTaxRows = ALL_TAX_TABLE_ROWS.length;

  const { slice: taxPageRows, start: taxRangeStart, end: taxRangeEnd } =
    useMemo(() => {
      const startIdx = (taxPage - 1) * taxPerPage;
      const slice = ALL_TAX_TABLE_ROWS.slice(startIdx, startIdx + taxPerPage);
      const rowCount = slice.length;
      return {
        slice,
        start: rowCount === 0 ? 0 : startIdx + 1,
        end: startIdx + rowCount,
      };
    }, [taxPage, taxPerPage]);

  const taxTotalPages = Math.max(1, Math.ceil(totalTaxRows / taxPerPage));

  const taxPaginationItems = useMemo(
    () => getPaginationItems(taxPage, taxTotalPages),
    [taxPage, taxTotalPages]
  );

  const canSave =
    mode === "automatic" || (mode === "manual" && selectedIds.size > 0);

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const taxPageRowIds = useMemo(
    () => taxPageRows.map((r) => r.id),
    [taxPageRows]
  );
  const allTaxesOnPageSelected =
    taxPageRowIds.length > 0 &&
    taxPageRowIds.every((id) => selectedIds.has(id));
  const someTaxesOnPageSelected = taxPageRowIds.some((id) =>
    selectedIds.has(id)
  );
  const headerCheckboxIndeterminate =
    someTaxesOnPageSelected && !allTaxesOnPageSelected;

  const toggleTaxPageSelection = useCallback(() => {
    const ids = taxPageRows.map((r) => r.id);
    if (ids.length === 0) return;
    setSelectedIds((prev) => {
      const allOnPage = ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allOnPage) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [taxPageRows]);

  const handleSave = () => {
    if (!canSave) return;
    const taxPercent =
      mode === "automatic" ? 10 : Math.round(manualPercent * 10) / 10;
    onSave({
      taxPercent,
      mode,
      selectedTaxIds:
        mode === "automatic" ? [] : Array.from(selectedIds),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-labelledby={titleId}
        className="z-[200] flex max-h-[min(90vh,calc(100vh-2rem))] w-full max-w-[min(600px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden border border-[#f2f4f7] bg-white p-0 shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)] sm:max-w-[min(600px,calc(100vw-2rem))] sm:rounded-lg"
      >
        <div className="flex shrink-0 flex-col px-4 pt-4">
          <div className="flex w-full items-start gap-2">
            <div className="min-w-0 flex-1">
              <DialogTitle
                id={titleId}
                className="text-base font-semibold leading-6 text-[#101828]"
              >
                {dialogTitle}
              </DialogTitle>
            </div>
            <DialogClose className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30">
              <X className="size-5" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4 pt-4">
          <div
            className="flex w-full max-w-[568px] flex-wrap items-center gap-4"
            role="radiogroup"
            aria-label="Tax calculation mode"
          >
            <FigmaRadioRowOption
              label="Automatically"
              selected={mode === "automatic"}
              onSelect={() => setMode("automatic")}
            />
            <FigmaRadioRowOption
              label="Manually"
              selected={mode === "manual"}
              onSelect={() => setMode("manual")}
            />
          </div>

          {mode === "automatic" ? (
            <div
              className="w-full max-w-[568px] rounded border border-[#d0d5dd] p-3"
              role="region"
              aria-label="Automatic tax information"
            >
              <div className="flex flex-col gap-1">
                <p className="text-base leading-6 text-[#101828]">
                  <span className="font-medium">
                    Automatically calculates tax based on the customer&apos;s
                    and/or business&apos;s address. Manage your tax rules
                    anytime in{" "}
                  </span>
                  <span className="font-semibold">
                    Payments → Settings → Taxes.
                  </span>
                </p>
                <button
                  type="button"
                  className="inline-flex w-fit items-center gap-1 rounded text-base font-semibold text-[#004eeb] outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                  onClick={() =>
                    showSuccess(
                      "Open Payments → Settings → Taxes to manage your tax rules."
                    )
                  }
                >
                  Manage
                  <ArrowRight className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex w-full min-w-0 flex-col gap-0 bg-white">
              <div className="isolate flex min-h-0 w-full flex-col overflow-hidden rounded-[4px] border border-[#d0d5dd] bg-white">
                <div className="flex max-h-[min(280px,calc(50vh))] min-h-0 w-full flex-1 flex-col overflow-x-auto">
                  <div className="flex min-h-0 w-full min-w-[568px] flex-1 flex-col">
                    <div className="shrink-0">
                      <table className="w-full table-fixed border-separate border-spacing-0 text-left">
                        <colgroup>
                          <col style={{ width: 40 }} />
                          <col style={{ width: "auto" }} />
                          <col style={{ width: 148 }} />
                          <col style={{ width: 160 }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              className="h-9 w-10 border-b border-r border-[#d0d5dd] bg-[#f2f4f7] px-2 text-center align-middle"
                            >
                              <TaxTableCheckbox
                                checked={allTaxesOnPageSelected}
                                indeterminate={headerCheckboxIndeterminate}
                                disabled={taxPageRowIds.length === 0}
                                onCheckedChange={toggleTaxPageSelection}
                                aria-label="Select all taxes on this page"
                              />
                            </th>
                            <th
                              scope="col"
                              className="h-9 border-b border-r border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left align-middle text-base font-semibold leading-6 text-[#101828]"
                            >
                              Tax name
                            </th>
                            <th
                              scope="col"
                              className="h-9 whitespace-nowrap border-b border-r border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left align-middle text-base font-semibold leading-6 text-[#101828]"
                            >
                              Tax rate (%)
                            </th>
                            <th
                              scope="col"
                              className="h-9 border-b border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left align-middle text-base font-semibold leading-6 text-[#101828]"
                            >
                              Tax ID
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                    <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-visible [scrollbar-gutter:stable]">
                      <table className="w-full table-fixed border-separate border-spacing-0 text-left">
                        <colgroup>
                          <col style={{ width: 40 }} />
                          <col style={{ width: "auto" }} />
                          <col style={{ width: 148 }} />
                          <col style={{ width: 160 }} />
                        </colgroup>
                        <tbody>
                          {taxPageRows.map((row) => {
                            const rowSelected = selectedIds.has(row.id);
                            return (
                            <tr
                              key={row.id}
                              className={cn(
                                "transition-colors",
                                rowSelected
                                  ? "bg-[#eff4ff]"
                                  : "bg-white hover:bg-slate-50/80"
                              )}
                            >
                              <td className="h-9 border-b border-r border-[#d0d5dd] px-2 text-center align-middle">
                                <TaxTableCheckbox
                                  checked={selectedIds.has(row.id)}
                                  onCheckedChange={() => toggleRow(row.id)}
                                  aria-label={`Select ${row.name}`}
                                />
                              </td>
                              <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle">
                                <span className="block min-w-0 truncate text-base font-medium leading-6 text-[#475467]">
                                  {row.name}
                                </span>
                              </td>
                              <td className="h-9 whitespace-nowrap border-b border-r border-[#d0d5dd] px-3 align-middle text-base font-medium leading-6 text-[#475467]">
                                {row.rate}
                              </td>
                              <td className="h-9 border-b border-[#d0d5dd] px-3 align-middle">
                                <span className="block min-w-0 truncate text-base font-medium leading-6 text-[#475467]">
                                  {row.taxId}
                                </span>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex h-fit w-full shrink-0 flex-nowrap items-end justify-end gap-4 bg-white px-0 pt-2 pb-0 text-left">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  <label className="flex items-center gap-1 text-sm font-medium leading-5 text-[#475467]">
                    <span className="whitespace-nowrap">Rows per page</span>
                    <select
                      value={taxPerPage}
                      onChange={(e) => {
                        setTaxPerPage(Number(e.target.value));
                        setTaxPage(1);
                      }}
                      className={cn(
                        "h-8 min-w-[64px] cursor-pointer rounded border border-[#d0d5dd] bg-white px-2 py-1.5 text-sm font-normal leading-5 text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-[#98a2b3]",
                        figmaFieldFocusVisible
                      )}
                      aria-label="Rows per page"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                  <p className="text-sm font-normal leading-5 text-[#475467]">
                    {taxRangeStart}-{taxRangeEnd} of {totalTaxRows}
                  </p>
                </div>
                <nav
                  className="flex flex-wrap items-center gap-1"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    disabled={taxPage <= 1}
                    onClick={() => setTaxPage((p) => Math.max(1, p - 1))}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 py-1 text-sm font-semibold leading-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors",
                      taxPage <= 1
                        ? "cursor-not-allowed text-[#d0d5dd]"
                        : "text-[#475467] hover:bg-slate-50"
                    )}
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {taxPaginationItems.map((item, idx) =>
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
                          onClick={() => setTaxPage(item)}
                          className={cn(
                            "inline-flex min-h-8 min-w-8 items-center justify-center rounded p-1.5 text-sm font-normal leading-5 text-[#475467] transition-colors",
                            taxPage === item
                              ? "border border-[#2970ff] bg-white"
                              : "border border-transparent hover:bg-slate-100"
                          )}
                          aria-current={taxPage === item ? "page" : undefined}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={taxPage >= taxTotalPages}
                    onClick={() =>
                      setTaxPage((p) => Math.min(taxTotalPages, p + 1))
                    }
                    className="inline-flex h-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 py-1 text-sm font-semibold leading-5 text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-[#d0d5dd]"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-[#d0d5dd] px-4 pb-3 pt-3">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold leading-6 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              className="inline-flex items-center justify-center rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold leading-6 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-[#155eef]/90 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 disabled:pointer-events-none disabled:opacity-50"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
