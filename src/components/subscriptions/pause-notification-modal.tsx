"use client";

import { X } from "lucide-react";
import { useCallback, useId, useState } from "react";

import { FigmaDatePickerField } from "@/components/subscriptions/figma-date-picker";
import { FigmaRadioIndicator } from "@/components/subscriptions/figma-radio-indicator";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PauseConfirmPayload } from "@/components/subscriptions/pause-subscription-messages";
import { cn } from "@/lib/utils";

export type { PauseConfirmPayload } from "@/components/subscriptions/pause-subscription-messages";

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

type PauseNotificationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires on Confirm; does not close the modal — close only via X or Cancel. */
  onConfirm?: (payload: PauseConfirmPayload) => void | Promise<void>;
};

export function PauseNotificationModal({
  open,
  onOpenChange,
  onConfirm,
}: PauseNotificationModalProps) {
  const [duration, setDuration] = useState<"indefinite" | "custom">(
    "indefinite"
  );
  const [invoiceBehaviour, setInvoiceBehaviour] = useState<"void" | "draft">(
    "void"
  );
  const [resumeDate, setResumeDate] = useState(startOfToday);
  const groupDuration = useId();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setDuration("indefinite");
        setResumeDate(startOfToday());
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-[min(576px,calc(100vw-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[min(576px,calc(100vw-2rem))]">
        {/* Modal header — title + subtitle */}
        <div className="flex flex-col px-4 pt-3 pb-0">
          <div className="flex w-full items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <DialogTitle className="text-base font-semibold leading-6 text-[#101828]">
                Pause subscription
              </DialogTitle>
              <DialogDescription className="text-sm font-normal leading-5 text-[#475467]">
                Decide how long you want to pause payment collection for this
                subscription.
              </DialogDescription>
            </div>
            <DialogClose className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30">
              <X className="size-5" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        {/* Modal body */}
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-4">
            {/* Pause duration — max width 240px per Figma */}
            <div className="flex max-w-[240px] flex-col gap-1">
              <p className="text-base font-medium leading-6 text-[#101828]">
                Pause duration
              </p>
              <div className="flex flex-col gap-2" role="radiogroup">
                <label className="flex min-w-0 cursor-pointer items-start gap-1">
                  <input
                    type="radio"
                    name={`pause-duration-${groupDuration}`}
                    className="sr-only"
                    checked={duration === "indefinite"}
                    onChange={() => setDuration("indefinite")}
                  />
                  <span className="flex h-5 shrink-0 items-center">
                    <FigmaRadioIndicator checked={duration === "indefinite"} />
                  </span>
                  <span className="min-w-0 flex-1 text-base leading-6 text-[#101828]">
                    Indefinite
                  </span>
                </label>

                <label className="flex min-w-0 cursor-pointer items-start gap-1">
                  <input
                    type="radio"
                    name={`pause-duration-${groupDuration}`}
                    className="sr-only"
                    checked={duration === "custom"}
                    onChange={() => setDuration("custom")}
                  />
                  <span className="flex h-5 shrink-0 items-center">
                    <FigmaRadioIndicator checked={duration === "custom"} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base leading-6 text-[#101828]">
                      Custom date
                    </span>
                    {duration === "custom" ? (
                      <FigmaDatePickerField
                        value={resumeDate}
                        onChange={setResumeDate}
                        aria-label="Resume date"
                      />
                    ) : null}
                  </div>
                </label>
              </div>
            </div>

            {/* Invoice behaviour — radio cards */}
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium leading-6 text-[#101828]">
                Invoice behaviour
              </p>
              <div className="flex flex-col gap-2" role="radiogroup">
                <button
                  type="button"
                  role="radio"
                  aria-checked={invoiceBehaviour === "void"}
                  onClick={() => setInvoiceBehaviour("void")}
                  className={cn(
                    "flex items-start gap-2 rounded-[4px] border border-solid p-3 text-left transition-colors",
                    invoiceBehaviour === "void"
                      ? "border-[#155eef] bg-white"
                      : "border-[#d0d5dd] bg-white"
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-base font-normal leading-6 text-[#101828]">
                      Mark invoice as &ldquo;Void&rdquo;
                    </p>
                    <p className="text-sm font-normal leading-5 text-[#475467]">
                      Businesses are currently not offering services, no invoices
                      would be generated for this period.
                    </p>
                  </div>
                  <FigmaRadioIndicator checked={invoiceBehaviour === "void"} />
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={invoiceBehaviour === "draft"}
                  onClick={() => setInvoiceBehaviour("draft")}
                  className={cn(
                    "flex items-start gap-2 rounded-[4px] border border-solid p-3 text-left transition-colors",
                    invoiceBehaviour === "draft"
                      ? "border-[#155eef] bg-white"
                      : "border-[#d0d5dd] bg-white"
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-base font-normal leading-6 text-[#101828]">
                      Mark invoice as &ldquo;Draft&rdquo;
                    </p>
                    <p className="text-sm font-normal leading-5 text-[#475467]">
                      Businesses are currently not offering services and keeping
                      invoices in a draft from where they can be later sent to the
                      customers.
                    </p>
                  </div>
                  <FigmaRadioIndicator checked={invoiceBehaviour === "draft"} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section footer — divider + actions */}
        <div className="flex flex-col pb-3">
          <div className="h-px w-full bg-[#e4e7ec]" />
          <div className="h-3" />
          <div className="flex w-full items-start justify-end gap-3 px-4">
            <DialogClose asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-[4px] border border-solid border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold leading-6 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-[4px] border border-solid border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold leading-6 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-[#155eef]/90 focus-visible:ring-2 focus-visible:ring-[#155eef]/40"
              onClick={() => {
                const payload: PauseConfirmPayload =
                  duration === "indefinite"
                    ? { duration: "indefinite" }
                    : { duration: "custom", resumeDate };
                void onConfirm?.(payload);
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
