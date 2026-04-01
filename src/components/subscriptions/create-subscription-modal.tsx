"use client";

import {
  Banknote,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Hash,
  HelpCircle,
  Info,
  Package,
  Plus,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import { CustomerSelect } from "@/components/subscriptions/customer-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type PaymentMode = "live" | "test";

const DEFAULT_START_DATE = () => new Date(2025, 11, 1);

type CreateSubscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDisplayDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return { dd, mm, yyyy };
}

function SectionHeader({
  title,
  expanded,
  onToggle,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
    >
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-6 text-[#101828]">{title}</p>
      </div>
      {expanded ? (
        <ChevronUp className="size-5 shrink-0 text-[#344054]" strokeWidth={2} aria-hidden />
      ) : (
        <ChevronDown className="size-5 shrink-0 text-[#344054]" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

function RadioCard({
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
      onClick={onSelect}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded border px-3 py-2 text-base font-medium leading-6 text-[#344054] outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
        selected ? "border-[#155eef] bg-white" : "border-[#d0d5dd] bg-white"
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[8px] border",
          selected
            ? "border-[#155eef] bg-[#155eef]"
            : "border-[#98a2b3] bg-white"
        )}
        aria-hidden
      >
        {selected ? (
          <Check className="size-3 text-white" strokeWidth={3} />
        ) : null}
      </span>
    </button>
  );
}

function SwitchToggle({
  pressed,
  onPressedChange,
  size = "md",
  id,
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
  size?: "sm" | "md";
  id?: string;
}) {
  const sm = size === "sm";
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "flex shrink-0 items-center rounded-[12px] p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
        pressed ? "justify-end bg-[#155eef]" : "justify-start bg-[#f2f4f7]",
        sm ? "h-4 w-7" : "h-5 w-9"
      )}
    >
      <span
        className={cn(
          "rounded-full bg-white shadow-sm",
          sm ? "size-3" : "size-4"
        )}
      />
    </button>
  );
}

export function CreateSubscriptionModal({
  open,
  onOpenChange,
}: CreateSubscriptionModalProps) {
  const { showSuccess } = useHubToast();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const customerSelectId = useId();

  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("live");
  const [customer, setCustomer] = useState("");

  const [subscriptionSettingsOpen, setSubscriptionSettingsOpen] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(true);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(true);

  const [setFrequency, setSetFrequency] = useState(false);
  const [taxId, setTaxId] = useState(false);
  const [giftCard, setGiftCard] = useState(false);

  const [productRows, setProductRows] = useState<{ id: string }[]>([]);
  const canCreate = productRows.length > 0;

  const displayDate = useMemo(() => formatDisplayDate(startDate), [startDate]);
  const isoDate = useMemo(() => {
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, "0");
    const d = String(startDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [startDate]);

  const subtotal = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(840px,calc(100vh-2rem))] w-full max-w-[min(768px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(768px,calc(100vw-2rem))]">
        <div className="flex shrink-0 flex-col px-4 pt-3">
          <div className="flex w-full items-start gap-2">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold leading-6 text-[#101828]">
                Create new subscription
              </DialogTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="https://highrise.gohighlevel.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-2 rounded px-2.5 py-1.5 text-sm font-semibold text-[#344054] hover:bg-slate-50"
              >
                <HelpCircle className="size-4" strokeWidth={2} aria-hidden />
                View documentation
              </Link>
              <DialogClose className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30">
                <X className="size-5" strokeWidth={2} />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-4">
          <div className="flex flex-col gap-6">
            {/* Customer information — single row: label left, 320px select right (Figma Header Lite) */}
            <div className="flex w-full min-w-0 flex-col gap-3 border-b border-[#d0d5dd] pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <p className="shrink-0 text-base font-medium leading-6 text-[#101828]">
                Customer information
              </p>
              <div className="w-full shrink-0 sm:w-[320px]">
                <label htmlFor={customerSelectId} className="sr-only">
                  Select customer
                </label>
                <CustomerSelect
                  id={customerSelectId}
                  value={customer}
                  onValueChange={setCustomer}
                />
              </div>
            </div>

            {/* Subscription settings */}
            <div className="flex flex-col gap-4 border-b border-[#d0d5dd] pb-6">
              <SectionHeader
                title="Subscription settings"
                expanded={subscriptionSettingsOpen}
                onToggle={() => setSubscriptionSettingsOpen((v) => !v)}
              />
              {subscriptionSettingsOpen ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="w-full shrink-0 space-y-1 sm:w-[172px]">
                    <div className="flex gap-1 text-base font-medium leading-6 text-[#101828]">
                      <span>Start date</span>
                      <span className="text-[#d92d20]">*</span>
                    </div>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={isoDate}
                      onChange={(e) => {
                        const v = e.target.valueAsDate;
                        if (v) setStartDate(v);
                      }}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <button
                      type="button"
                      onClick={() => dateInputRef.current?.showPicker?.()}
                      className="flex h-9 w-full min-h-9 items-center gap-1 rounded border border-[#d0d5dd] bg-white px-2 text-left text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                    >
                      <Calendar className="size-4 shrink-0 text-[#344054]" strokeWidth={2} aria-hidden />
                      <span>{displayDate.dd}</span>
                      <span>/</span>
                      <span>{displayDate.mm}</span>
                      <span>/</span>
                      <span>{displayDate.yyyy}</span>
                    </button>
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-base font-medium leading-6 text-[#101828]">
                      Payment mode
                    </p>
                    <div
                      className="flex flex-wrap gap-2"
                      role="radiogroup"
                      aria-label="Payment mode"
                    >
                      <RadioCard
                        label="Live"
                        selected={paymentMode === "live"}
                        onSelect={() => setPaymentMode("live")}
                      />
                      <RadioCard
                        label="Test"
                        selected={paymentMode === "test"}
                        onSelect={() => setPaymentMode("test")}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Add product + table + totals */}
            <div className="flex flex-col gap-4 border-b border-[#d0d5dd] pb-6">
              <div className="flex flex-col gap-1">
                <p className="text-base font-semibold leading-6 text-[#101828]">
                  Add product
                </p>
                <p className="text-sm font-normal leading-5 text-[#475467]">
                  Choose items from your catalog or create new ones to include in this
                  subscription.
                </p>
              </div>

              <div className="overflow-hidden rounded border border-[#d0d5dd] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                <div className="flex w-full min-w-0 min-h-9 border-b border-[#d0d5dd] bg-[#f2f4f7] text-base font-semibold leading-6 text-[#101828]">
                  <div className="flex min-h-9 min-w-0 flex-1 items-center gap-1 border-r border-[#d0d5dd] px-3">
                    <Package className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                    <span className="truncate">Item</span>
                  </div>
                  <div className="flex min-h-9 w-[160px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
                    <Banknote className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                    Price
                  </div>
                  <div className="flex min-h-9 w-[100px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
                    <Hash className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                    <span className="tabular-nums">Qty</span>
                  </div>
                  <div className="flex min-h-9 w-[87px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
                    <Tag className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                    Tax
                  </div>
                  <div className="flex min-h-9 w-[130px] shrink-0 items-center justify-end gap-1 px-3">
                    <span className="inline-flex size-4 items-center justify-center" aria-hidden>
                      $
                    </span>
                    Subtotal
                  </div>
                </div>

              {productRows.length === 0 ? (
                <div className="flex flex-col items-center px-8 py-8 sm:px-48">
                  <div className="mb-2 flex size-[88px] items-center justify-center">
                    <img
                      src="/icons/empty-state-add-product.svg"
                      alt=""
                      width={88}
                      height={88}
                      className="size-[88px] shrink-0"
                      aria-hidden
                    />
                  </div>
                  <p className="text-center text-base font-semibold leading-6 text-[#101828]">
                    No products added yet
                  </p>
                  <p className="mt-1 text-center text-sm leading-5 text-[#475467]">
                    Start by adding products or services to calculate totals.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      setProductRows([{ id: "1" }]);
                      showSuccess("Product picker would open here.");
                    }}
                    className="mt-2 h-auto gap-2 rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#155eef]/90"
                  >
                    <Plus className="size-4" strokeWidth={2} aria-hidden />
                    Add product
                  </Button>
                </div>
              ) : (
                <div className="border-t border-[#d0d5dd] px-3 py-3 text-sm text-[#475467]">
                  Line items would appear here after you select products from the catalog.
                </div>
              )}
            </div>

            <div className="mt-4 pr-0 sm:pr-12">
              <div className="flex items-start justify-between gap-4 px-3 py-1">
                <span className="text-base font-semibold leading-6 text-[#101828]">
                  Subtotal
                </span>
                <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 space-y-1 px-3">
                <button
                  type="button"
                  className="text-base font-medium text-[#004eeb] hover:underline"
                  onClick={() => showSuccess("Coupon flow would open here.")}
                >
                  Apply coupon
                </button>
                <div>
                  <button
                    type="button"
                    className="text-base font-medium text-[#004eeb] hover:underline"
                    onClick={() => showSuccess("Tax configuration would open here.")}
                  >
                    Add tax
                  </button>
                </div>
              </div>
              <Separator className="my-3 bg-[#eaecf0]" />
              <div className="flex items-start justify-between gap-4 px-3 py-1">
                <span className="text-base font-semibold leading-6 text-[#101828]">
                  Amount due (in USD)
                </span>
                <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-b border-[#d0d5dd] py-6">
            <SectionHeader
              title="Additional options"
              expanded={additionalOpen}
              onToggle={() => setAdditionalOpen((v) => !v)}
            />
            {additionalOpen ? (
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-1">
                  <SwitchToggle
                    pressed={setFrequency}
                    onPressedChange={setSetFrequency}
                  />
                  <span className="text-base leading-6 text-[#101828]">Set frequency</span>
                </div>
                <div className="flex items-center gap-1">
                  <SwitchToggle pressed={taxId} onPressedChange={setTaxId} />
                  <span className="text-base leading-6 text-[#101828]">
                    Business identification number or tax id
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="py-6">
            <SectionHeader
              title="Select a payment method"
              expanded={paymentSectionOpen}
              onToggle={() => setPaymentSectionOpen((v) => !v)}
            />
            {paymentSectionOpen ? (
              <div className="mt-6 space-y-6">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-base font-medium leading-6 text-[#101828]">
                        Redeem a gift card
                      </span>
                      <Info
                        className="size-3 text-[#667085]"
                        aria-label="More about gift cards"
                      />
                    </div>
                    <SwitchToggle
                      pressed={giftCard}
                      onPressedChange={setGiftCard}
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-base font-medium leading-6 text-[#101828]">
                    Pay via cards
                  </p>
                  <div className="flex flex-col items-center rounded border border-[#d0d5dd] p-4">
                    <div className="mb-2 flex size-[120px] items-center justify-center">
                      <img
                        src="/icons/empty-state-payment-cards.svg"
                        alt=""
                        width={120}
                        height={120}
                        className="size-[120px] shrink-0 object-contain"
                        aria-hidden
                      />
                    </div>
                    <p className="text-center text-base font-semibold leading-6 text-[#101828]">
                      No cards found
                    </p>
                    <p className="mt-1 max-w-[404px] text-center text-sm leading-5 text-[#475467]">
                      Save your first payment card here for quicker payments later.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => showSuccess("Add card flow would open here.")}
                      className="mt-2 h-auto gap-2 rounded-lg border-[#d0d5dd] bg-white px-3.5 py-2 text-base font-semibold text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
                    >
                      <Plus className="size-5" strokeWidth={2} aria-hidden />
                      Add customer&apos;s card
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-[#e4e7ec] pb-3 pt-3">
          <div className="flex justify-end gap-3 px-4">
              <DialogClose asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold leading-6 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                >
                  Cancel
                </button>
              </DialogClose>
              <button
                type="button"
                disabled={!canCreate}
                onClick={() => {
                  showSuccess("Subscription created.");
                  onOpenChange(false);
                }}
                className={cn(
                  "inline-flex items-center justify-center rounded border px-2.5 py-1.5 text-base font-semibold leading-6 text-white outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
                  canCreate
                    ? "border-[#155eef] bg-[#155eef] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-[#155eef]/90"
                    : "cursor-not-allowed border-[#b2ccff] bg-[#b2ccff] text-white opacity-100"
                )}
              >
                Create
              </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
