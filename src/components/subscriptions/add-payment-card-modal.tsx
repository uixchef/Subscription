"use client";

import { Calendar, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  figmaFieldFocusVisible,
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { cn } from "@/lib/utils";

export type PaymentCardFormValues = {
  nameOnCard: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
};

export const EMPTY_PAYMENT_CARD_FORM: PaymentCardFormValues = {
  nameOnCard: "",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvc: "",
};

const inputShell = cn(
  "h-9 w-full rounded border border-[#d0d5dd] bg-white px-2 text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] placeholder:text-[#667085]",
  figmaFieldFocusVisible
);

const labelClass = "flex gap-1 text-base font-medium leading-6 text-[#101828]";

type AddPaymentCardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PaymentCardFormValues) => void;
};

export function AddPaymentCardModal({
  open,
  onOpenChange,
  onSave,
}: AddPaymentCardModalProps) {
  const formId = useId();
  const nameId = useId();
  const [form, setForm] = useState<PaymentCardFormValues>(
    EMPTY_PAYMENT_CARD_FORM
  );

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_PAYMENT_CARD_FORM);
  }, [open]);

  const update = <K extends keyof PaymentCardFormValues>(
    key: K,
    value: PaymentCardFormValues[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit =
    form.nameOnCard.trim().length > 0 &&
    form.cardNumber.replace(/\s/g, "").length >= 12 &&
    form.expiryMonth.trim().length >= 1 &&
    form.expiryYear.trim().length >= 2 &&
    form.cvc.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[200] flex max-h-[min(90vh,calc(100vh-2rem))] w-full max-w-[min(448px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden border border-[#f2f4f7] bg-white p-0 shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)] sm:max-w-[min(448px,calc(100vw-2rem))] sm:rounded-lg">
        <div className="flex shrink-0 flex-col px-4 pt-4">
          <div className="flex w-full items-start gap-2">
            <div className="flex min-w-0 flex-1 items-center">
              <DialogTitle className="text-base font-semibold leading-6 text-[#101828]">
                Add new card
              </DialogTitle>
            </div>
            <DialogClose className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30">
              <X className="size-5" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        <form
          id={formId}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSave({
              ...form,
              nameOnCard: form.nameOnCard.trim(),
              cardNumber: form.cardNumber.trim(),
              expiryMonth: form.expiryMonth.trim(),
              expiryYear: form.expiryYear.trim(),
              cvc: form.cvc.trim(),
            });
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor={nameId} className={labelClass}>
                <span>Name on card</span>
              </label>
              <input
                id={nameId}
                value={form.nameOnCard}
                onChange={(e) => update("nameOnCard", e.target.value)}
                className={inputShell}
                autoComplete="cc-name"
                placeholder="Full name as shown on card"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className={labelClass}>
                <span>Card number</span>
              </div>
              <div
                className={cn(
                  "flex h-9 w-full min-w-0 items-center gap-2 rounded border border-[#d0d5dd] bg-white px-2 text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                  figmaFieldFocusWithin
                )}
              >
                <div className="flex h-6 w-[34px] shrink-0 items-center justify-center rounded border border-[#f2f4f7] bg-white">
                  <img
                    src="/icons/subscriptions/credit-card.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="size-4 shrink-0 object-contain"
                    aria-hidden
                  />
                </div>
                <input
                  value={form.cardNumber}
                  onChange={(e) => update("cardNumber", e.target.value)}
                  className={cn(
                    "min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-6 text-[#101828] placeholder:text-[#667085]",
                    figmaFieldInnerInput
                  )}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  aria-label="Card number"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>Expiry</span>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-full min-w-0 items-center gap-1 rounded border border-[#d0d5dd] bg-white px-2 text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                    figmaFieldFocusWithin
                  )}
                >
                  <Calendar
                    className="size-4 shrink-0 text-[#344054]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    value={form.expiryMonth}
                    onChange={(e) =>
                      update(
                        "expiryMonth",
                        e.target.value.replace(/\D/g, "").slice(0, 2)
                      )
                    }
                    className={cn(
                      "w-8 shrink-0 border-0 bg-transparent p-0 text-base leading-6 text-[#101828] placeholder:text-[#667085]",
                      figmaFieldInnerInput
                    )}
                    placeholder="MM"
                    inputMode="numeric"
                    maxLength={2}
                    autoComplete="cc-exp-month"
                    aria-label="Expiry month"
                  />
                  <span className="text-[#667085]" aria-hidden>
                    /
                  </span>
                  <input
                    value={form.expiryYear}
                    onChange={(e) =>
                      update(
                        "expiryYear",
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className={cn(
                      "min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-6 text-[#101828] placeholder:text-[#667085]",
                      figmaFieldInnerInput
                    )}
                    placeholder="YYYY"
                    inputMode="numeric"
                    maxLength={4}
                    autoComplete="cc-exp-year"
                    aria-label="Expiry year"
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>CVC</span>
                </div>
                <input
                  value={form.cvc}
                  onChange={(e) =>
                    update("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  className={inputShell}
                  placeholder="e.g. 123"
                  inputMode="numeric"
                  maxLength={4}
                  autoComplete="cc-csc"
                  aria-label="CVC"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col pb-3">
            <div className="h-px w-full bg-[#e4e7ec]" />
            <div className="h-3" />
            <div className="flex w-full items-center justify-end gap-4 px-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center justify-center rounded border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold leading-6 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold leading-6 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-[#004eeb] focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 disabled:pointer-events-none disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
