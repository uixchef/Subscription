"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { figmaFieldFocusVisible } from "@/components/subscriptions/figma-field-focus";
import { cn } from "@/lib/utils";

const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildMonthGrid(visibleYear: number, visibleMonth: number) {
  const first = new Date(visibleYear, visibleMonth, 1);
  const startPad = first.getDay();
  const dim = new Date(visibleYear, visibleMonth + 1, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = 0; i < startPad; i++) {
    const d = new Date(visibleYear, visibleMonth, -startPad + i + 1);
    cells.push({ date: d, inMonth: false });
  }
  for (let day = 1; day <= dim; day++) {
    cells.push({
      date: new Date(visibleYear, visibleMonth, day),
      inMonth: true,
    });
  }
  while (cells.length < 42) {
    const last = cells[cells.length - 1]!.date;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }
  return cells;
}

/** Display tokens for MM/DD/YYYY (US). */
function formatMmDdYyyy(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { mm, dd, yyyy };
}

type PanelView = "day" | "monthYear";

export type FigmaDatePickerFieldProps = {
  value: Date;
  onChange: (next: Date) => void;
  id?: string;
  "aria-label"?: string;
  className?: string;
  triggerClassName?: string;
};

/**
 * Figma Subscription 2025 — Picker Menu (1417:38672): calendar popover;
 * header month/year opens month+year columns view per same spec.
 */
export function FigmaDatePickerField({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
  className,
  triggerClassName,
}: FigmaDatePickerFieldProps) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("day");
  const [cursor, setCursor] = useState(() => new Date(value));
  const [pendingMonth, setPendingMonth] = useState(value.getMonth());
  const [pendingYear, setPendingYear] = useState(value.getFullYear());

  const syncPickerFromValue = useCallback(() => {
    setCursor(new Date(value));
    setPanelView("day");
    setPendingMonth(value.getMonth());
    setPendingYear(value.getFullYear());
  }, [value]);

  const handleTriggerClick = () => {
    if (open) {
      setOpen(false);
    } else {
      syncPickerFromValue();
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const display = formatMmDdYyyy(value);
  const today = useMemo(() => startOfDay(new Date()), []);
  const grid = useMemo(
    () => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );

  const yearWindow = useMemo(() => {
    const y = pendingYear;
    const years: number[] = [];
    for (let i = y - 6; i <= y + 6; i++) years.push(i);
    return years;
  }, [pendingYear]);

  const applyMonthYear = () => {
    const dim = new Date(pendingYear, pendingMonth + 1, 0).getDate();
    const day = Math.min(value.getDate(), dim);
    setCursor(new Date(pendingYear, pendingMonth, day));
    setPanelView("day");
  };

  const selectDay = (d: Date) => {
    onChange(startOfDay(d));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        id={triggerId}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={handleTriggerClick}
        className={cn(
          "flex h-9 w-full min-h-9 items-center gap-1 rounded border border-[#d0d5dd] bg-white px-2 text-left text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
          figmaFieldFocusVisible,
          triggerClassName
        )}
      >
        <Calendar className="size-4 shrink-0 text-[#344054]" strokeWidth={2} aria-hidden />
        <span>{display.mm}</span>
        <span>/</span>
        <span>{display.dd}</span>
        <span>/</span>
        <span>{display.yyyy}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute left-0 top-[calc(100%+4px)] z-[250] flex w-[280px] flex-col gap-2 rounded-[4px] border border-[#f2f4f7] bg-white p-2 shadow-[0px_4px_8px_0px_rgba(16,24,40,0.1),0px_2px_4px_0px_rgba(16,24,40,0.06)]"
        >
          {panelView === "day" ? (
            <>
              <div className="flex w-full items-center justify-between">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded p-1 text-[#344054] hover:bg-slate-50"
                    aria-label="Previous year"
                    onClick={() =>
                      setCursor(
                        (c) => new Date(c.getFullYear() - 1, c.getMonth(), 1)
                      )
                    }
                  >
                    <ChevronsLeft className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded p-1 text-[#344054] hover:bg-slate-50"
                    aria-label="Previous month"
                    onClick={() =>
                      setCursor(
                        (c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)
                      )
                    }
                  >
                    <ChevronLeft className="size-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="rounded px-1 py-0.5 text-sm font-semibold leading-5 text-[#1d2939] hover:bg-slate-50"
                    onClick={() => {
                      setPendingMonth(cursor.getMonth());
                      setPendingYear(cursor.getFullYear());
                      setPanelView("monthYear");
                    }}
                  >
                    {MONTHS_SHORT[cursor.getMonth()]}
                  </button>
                  <button
                    type="button"
                    className="rounded px-1 py-0.5 text-sm font-semibold leading-5 text-[#1d2939] hover:bg-slate-50"
                    onClick={() => {
                      setPendingMonth(cursor.getMonth());
                      setPendingYear(cursor.getFullYear());
                      setPanelView("monthYear");
                    }}
                  >
                    {cursor.getFullYear()}
                  </button>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded p-1 text-[#344054] hover:bg-slate-50"
                    aria-label="Next month"
                    onClick={() =>
                      setCursor(
                        (c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)
                      )
                    }
                  >
                    <ChevronRight className="size-4" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded p-1 text-[#344054] hover:bg-slate-50"
                    aria-label="Next year"
                    onClick={() =>
                      setCursor(
                        (c) => new Date(c.getFullYear() + 1, c.getMonth(), 1)
                      )
                    }
                  >
                    <ChevronsRight className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="flex w-full gap-4 border-b border-[#f2f4f7] py-2">
                {WEEK.map((d) => (
                  <div
                    key={d}
                    className="flex size-6 flex-1 items-center justify-center text-sm font-semibold leading-5 text-[#98a2b3]"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid w-full grid-cols-7 gap-1">
                {grid.map(({ date, inMonth }) => {
                  const isToday = sameDay(date, today);
                  const isSelected = sameDay(date, value);
                  const label = date.getDate();
                  return (
                    <button
                      key={date.getTime()}
                      type="button"
                      disabled={!inMonth}
                      onClick={() => inMonth && selectDay(date)}
                      className={cn(
                        "relative flex size-6 items-center justify-center rounded text-[13px] leading-[18px]",
                        !inMonth && "cursor-default text-[#d0d5dd]",
                        inMonth && !isSelected && "font-medium text-[#475467] hover:bg-slate-50",
                        isSelected &&
                          inMonth &&
                          "border border-[#155eef] bg-[#eff4ff] font-semibold text-[#00359e]",
                        isToday && inMonth && !isSelected && "font-medium text-[#475467]"
                      )}
                    >
                      {label}
                      {isToday && inMonth ? (
                        <span className="absolute right-0.5 top-0.5 size-1 rounded-full bg-[#155eef]" aria-hidden />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="flex w-full gap-1 border-t border-[#d0d5dd] pt-2">
                <button
                  type="button"
                  className="h-8 flex-1 rounded border border-[#d0d5dd] bg-white text-sm font-semibold leading-5 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8 flex-1 rounded border border-[#155eef] bg-[#155eef] text-sm font-semibold leading-5 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#004eeb]"
                  onClick={() => setOpen(false)}
                >
                  Confirm
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="inline-flex size-7 items-center justify-center rounded p-1 text-[#344054] hover:bg-slate-50"
                  aria-label="Back to calendar"
                  onClick={() => setPanelView("day")}
                >
                  <ArrowLeft className="size-4" strokeWidth={2} />
                </button>
              </div>

              <div className="flex border-b border-[#f2f4f7] py-2">
                <div className="flex flex-1 justify-center text-sm font-semibold text-[#1d2939]">
                  Month
                </div>
                <div className="w-px self-stretch bg-[#eaecf0]" />
                <div className="flex flex-1 justify-center text-sm font-semibold text-[#1d2939]">
                  Year
                </div>
              </div>

              <div className="flex max-h-[220px] gap-2">
                <div className="flex max-h-[220px] flex-1 flex-col gap-2 overflow-y-auto px-1">
                  {MONTHS_SHORT.map((m, idx) => {
                    const sel = pendingMonth === idx;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPendingMonth(idx)}
                        className={cn(
                          "flex h-6 w-full items-center justify-center rounded text-[13px]",
                          sel
                            ? "border border-[#155eef] bg-[#eff4ff] font-semibold text-[#00359e]"
                            : "font-medium text-[#475467] hover:bg-slate-50"
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
                <div className="w-px shrink-0 bg-[#eaecf0]" />
                <div className="flex max-h-[220px] flex-1 flex-col gap-2 overflow-y-auto px-1">
                  {yearWindow.map((y) => {
                    const sel = pendingYear === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setPendingYear(y)}
                        className={cn(
                          "flex h-6 w-full items-center justify-center rounded text-[13px]",
                          sel
                            ? "border border-[#155eef] bg-[#eff4ff] font-semibold text-[#00359e]"
                            : "font-medium text-[#475467] hover:bg-slate-50"
                        )}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex w-full gap-1 border-t border-[#d0d5dd] pt-2">
                <button
                  type="button"
                  className="h-8 flex-1 rounded border border-[#d0d5dd] bg-white text-sm font-semibold leading-5 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-slate-50"
                  onClick={() => setPanelView("day")}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="h-8 flex-1 rounded border border-[#155eef] bg-[#155eef] text-sm font-semibold leading-5 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#004eeb]"
                  onClick={applyMonthYear}
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
