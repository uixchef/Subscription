"use client";

import {
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  MoreVertical,
  Pencil,
  Plus,
  Repeat2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  HUB_TOAST_DURATION_MS,
  HubAlertToast,
  MODAL_OVERLAY_TOAST_TOP_PX,
  useHubToast,
} from "@/components/payment-hub/hub-toast";
import {
  CustomerAvatar,
  CustomerSelect,
  findCustomerById,
} from "@/components/subscriptions/customer-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FigmaDatePickerField } from "@/components/subscriptions/figma-date-picker";
import {
  figmaFieldFocusVisible,
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { FigmaRadioIndicator } from "@/components/subscriptions/figma-radio-indicator";
import type { CustomerFormValues } from "@/components/subscriptions/edit-customer-information-modal";
import { cn } from "@/lib/utils";

type PaymentMode = "live" | "test";

function startOfToday() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

type CreateSubscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerEditFields: CustomerFormValues | null;
  onCustomerEditFieldsChange: (values: CustomerFormValues | null) => void;
  /** Success toast on Create overlay (52px) after Edit/Add customer save — parent-owned. */
  customerSaveToast: { name: string; mode: "add" | "edit" } | null;
  onCustomerSaveToastDismiss: () => void;
  /** Close create and open edit customer — parent owns the edit modal. */
  onRequestEditCustomer: (initialValues: CustomerFormValues) => void;
  /** Close create and open add-customer form (empty fields). */
  onRequestAddCustomer: () => void;
};

function customerSaveSuccessMessage(t: { name: string; mode: "add" | "edit" }) {
  const quoted = `"${t.name.replace(/"/g, "")}"`;
  if (t.mode === "add") {
    return `New customer ${quoted} has been added to your contacts.`;
  }
  return `Customer info for ${quoted} has been saved successfully.`;
}

type ProductLineItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  /** When set, show percent + info; otherwise show “Add tax”. */
  taxPercent: number | null;
};

const PRODUCT_TABLE_HDR_ICON = "size-4 shrink-0 object-contain";

const COUPON_DISCOUNT = 21;
const CENTRAL_TAX = 3.5;
const CITY_TAX = 2.8;

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
      <FigmaRadioIndicator checked={selected} />
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
  customerEditFields,
  onCustomerEditFieldsChange,
  customerSaveToast,
  onCustomerSaveToastDismiss,
  onRequestEditCustomer,
  onRequestAddCustomer,
}: CreateSubscriptionModalProps) {
  const { showSuccess } = useHubToast();
  const customerSelectId = useId();
  const [createToastPortalReady] = useState(true);
  const customerSaveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [startDate, setStartDate] = useState(startOfToday);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("live");
  const [customer, setCustomer] = useState("");

  const selectedCustomer = useMemo(
    () => (customer ? findCustomerById(customer) : undefined),
    [customer]
  );

  /** Clear draft edits only when the user picks a different customer — not on mount (the old useEffect on `customer` wiped saves when returning from Edit customer). */
  const handleCustomerChange = useCallback(
    (nextId: string) => {
      if (nextId !== customer) {
        onCustomerEditFieldsChange(null);
      }
      setCustomer(nextId);
    },
    [customer, onCustomerEditFieldsChange]
  );

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setStartDate(startOfToday());
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (!customerSaveToast || !open) return;
    customerSaveToastTimerRef.current = setTimeout(() => {
      customerSaveToastTimerRef.current = null;
      onCustomerSaveToastDismiss();
    }, HUB_TOAST_DURATION_MS);
    return () => {
      if (customerSaveToastTimerRef.current) {
        clearTimeout(customerSaveToastTimerRef.current);
        customerSaveToastTimerRef.current = null;
      }
    };
  }, [customerSaveToast, open, onCustomerSaveToastDismiss]);

  const dismissCustomerSaveToast = useCallback(() => {
    if (customerSaveToastTimerRef.current) {
      clearTimeout(customerSaveToastTimerRef.current);
      customerSaveToastTimerRef.current = null;
    }
    onCustomerSaveToastDismiss();
  }, [onCustomerSaveToastDismiss]);

  const displayCustomer = useMemo(() => {
    if (!selectedCustomer) return undefined;
    if (!customerEditFields) return selectedCustomer;
    return {
      ...selectedCustomer,
      name: customerEditFields.name,
      email: customerEditFields.email,
    };
  }, [selectedCustomer, customerEditFields]);

  const editCustomerInitialValues = useMemo((): CustomerFormValues | null => {
    if (!selectedCustomer) return null;
    const fromProfile: CustomerFormValues = {
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
      address: selectedCustomer.address,
      country: selectedCustomer.country,
      state: selectedCustomer.state,
      city: selectedCustomer.city,
      zip: selectedCustomer.zip,
    };
    if (!customerEditFields) return fromProfile;
    return { ...fromProfile, ...customerEditFields };
  }, [selectedCustomer, customerEditFields]);

  const [subscriptionSettingsOpen, setSubscriptionSettingsOpen] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(true);
  const [paymentSectionOpen, setPaymentSectionOpen] = useState(true);

  const [setFrequency, setSetFrequency] = useState(false);
  const [taxId, setTaxId] = useState(false);
  const [giftCard, setGiftCard] = useState(true);

  const [productRows, setProductRows] = useState<ProductLineItem[]>([]);
  const [selectedPaymentCard, setSelectedPaymentCard] = useState<
    "visa" | "mastercard" | "apple"
  >("visa");
  const [giftCardCode, setGiftCardCode] = useState("ABCD123");

  const lineSubtotal = useMemo(
    () => productRows.reduce((s, r) => s + r.price * r.qty, 0),
    [productRows]
  );
  const taxableSubtotal = lineSubtotal - COUPON_DISCOUNT;
  const amountDue = taxableSubtotal + CENTRAL_TAX + CITY_TAX;

  const hasLineItems = productRows.length > 0;
  const canCreate = hasLineItems && Boolean(selectedCustomer);

  const updateProductRow = (id: string, patch: Partial<ProductLineItem>) => {
    setProductRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };
  const removeProductRow = (id: string) => {
    setProductRows((rows) => rows.filter((r) => r.id !== id));
  };
  /** New lines insert at the top (Subscription 2025 — Figma 1161:93520 / 1161:94547). */
  const prependProductRow = () => {
    setProductRows((rows) => {
      const n = rows.length + 1;
      return [
        {
          id: `p-${Date.now()}`,
          name: `Product ${n}`,
          price: 35,
          qty: 1,
          taxPercent: null,
        },
        ...rows,
      ];
    });
  };

  const showCreateOverlaySaveToast =
    createToastPortalReady &&
    open &&
    customerSaveToast !== null;

  return (
    <>
      {showCreateOverlaySaveToast
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 z-[250] flex justify-center px-4"
              style={{ top: MODAL_OVERLAY_TOAST_TOP_PX }}
              aria-live="polite"
            >
              <div className="pointer-events-auto w-full max-w-[min(478px,calc(100vw-2rem))]">
                <HubAlertToast
                  variant="success"
                  message={customerSaveSuccessMessage(customerSaveToast)}
                  className="w-full max-w-none"
                  onDismiss={dismissCustomerSaveToast}
                />
              </div>
            </div>,
            document.body
          )
        : null}
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(840px,calc(100vh-2rem))] w-full max-w-[min(768px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(768px,calc(100vw-2rem))]">
        <div className="flex shrink-0 flex-col px-4 pt-4">
          <div className="flex w-full items-start gap-2">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold leading-6 text-[#101828]">
                Create new subscription
              </DialogTitle>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DialogClose className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30">
                <X className="size-5" strokeWidth={2} />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-4">
          <div className="flex flex-col gap-6">
            {/* Customer information — Figma 1161:89490: Header Lite row + Avatar with Label + bordered action */}
            <div className="flex w-full min-w-0 flex-col justify-start gap-3 border-b border-[#d0d5dd] pb-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="shrink-0 text-base font-medium leading-6 text-[#101828]">
                Customer information
              </p>
              <div
                className={cn(
                  "w-full min-w-0",
                  !selectedCustomer
                    ? "sm:w-[320px] sm:shrink-0"
                    : "sm:w-auto sm:shrink-0"
                )}
              >
                {!selectedCustomer ? (
                  <CustomerSelect
                    id={customerSelectId}
                    value={customer}
                    onValueChange={handleCustomerChange}
                    onAddCustomer={onRequestAddCustomer}
                  />
                ) : (
                  <div className="flex w-full min-w-0 items-center justify-between gap-4 sm:w-auto sm:justify-end sm:gap-6">
                    <div className="flex min-w-0 items-center gap-2">
                      <CustomerAvatar
                        option={displayCustomer ?? selectedCustomer}
                        className="text-sm font-medium text-[#475467]"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium leading-6 text-[#101828]">
                          {(displayCustomer ?? selectedCustomer).name}
                        </p>
                        <p className="truncate text-sm font-normal leading-5 text-[#475467]">
                          {(displayCustomer ?? selectedCustomer).email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white p-2 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                          aria-label="Customer actions"
                        >
                          <MoreVertical className="size-4" strokeWidth={2} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="z-[200] min-w-[220px] overflow-hidden rounded border border-[#d0d5dd] bg-white p-0 py-1 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.1),0px_2px_4px_-2px_rgba(16,24,40,0.06)]"
                      >
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 rounded px-4 py-2 text-base font-medium leading-6 text-[#101828] data-[highlighted]:bg-[#f2f4f7]"
                          onSelect={() => {
                            if (editCustomerInitialValues) {
                              onRequestEditCustomer(editCustomerInitialValues);
                            }
                          }}
                        >
                          <Pencil
                            className="size-4 shrink-0 text-[#344054]"
                            strokeWidth={2}
                            aria-hidden
                          />
                          Edit customer info
                        </DropdownMenuItem>
                        <Separator className="bg-[#d0d5dd]" />
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 rounded px-4 py-2 text-base font-medium leading-6 text-[#d92d20] data-[highlighted]:bg-[#fef3f2] data-[highlighted]:text-[#d92d20]"
                          onSelect={() => {
                            setCustomer("");
                            onCustomerEditFieldsChange(null);
                          }}
                        >
                          <X
                            className="size-4 shrink-0 text-[#d92d20]"
                            strokeWidth={2}
                            aria-hidden
                          />
                          Remove customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
                    <FigmaDatePickerField
                      value={startDate}
                      onChange={setStartDate}
                      aria-label="Start date"
                    />
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

            {/* Add product + table + totals — Subscription 2025 Figma 1161:93520 (empty) / 1161:94547 (lines) */}
            <div className="flex flex-col gap-4 border-b border-[#d0d5dd] pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-base font-semibold leading-6 text-[#101828]">
                    Add product
                  </p>
                  <p className="text-sm font-normal leading-5 text-[#475467]">
                    Choose items from your catalog or create new ones to include in this
                    subscription.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    prependProductRow();
                    showSuccess("Product picker would open here.");
                  }}
                  className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 self-stretch rounded border border-[#84adff] bg-white px-2.5 py-1.5 text-base font-semibold text-[#004eeb] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 sm:w-auto sm:justify-start sm:self-start"
                >
                  <Plus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                  Add product
                </button>
              </div>

              <div className="overflow-hidden rounded border border-[#d0d5dd] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div className="flex min-h-9 w-full min-w-0 border-b border-[#d0d5dd] bg-[#f2f4f7] text-base font-semibold leading-6 text-[#101828]">
                      <div className="flex min-h-9 min-w-0 flex-1 items-center gap-1 border-r border-[#d0d5dd] px-3">
                        <img
                          src="/icons/subscriptions/inventory-2.svg"
                          alt=""
                          width={16}
                          height={16}
                          className={PRODUCT_TABLE_HDR_ICON}
                          aria-hidden
                        />
                        <span className="truncate">Item</span>
                      </div>
                      <div className="flex min-h-9 w-[160px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
                        <img
                          src="/icons/subscriptions/bank-note-03.svg"
                          alt=""
                          width={16}
                          height={16}
                          className={PRODUCT_TABLE_HDR_ICON}
                          aria-hidden
                        />
                        Price
                      </div>
                      <div className="flex min-h-9 w-[100px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
                        <img
                          src="/icons/subscriptions/numbers.svg"
                          alt=""
                          width={16}
                          height={16}
                          className={PRODUCT_TABLE_HDR_ICON}
                          aria-hidden
                        />
                        <span className="tabular-nums">Qty</span>
                      </div>
                      <div className="flex min-h-9 w-[87px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
                        <img
                          src="/icons/subscriptions/sell.svg"
                          alt=""
                          width={16}
                          height={16}
                          className={PRODUCT_TABLE_HDR_ICON}
                          aria-hidden
                        />
                        Tax
                      </div>
                      <div className="flex min-h-9 w-[130px] shrink-0 items-center justify-end gap-1 border-r border-[#d0d5dd] px-3">
                        <img
                          src="/icons/subscriptions/paid.svg"
                          alt=""
                          width={16}
                          height={16}
                          className={PRODUCT_TABLE_HDR_ICON}
                          aria-hidden
                        />
                        Subtotal
                      </div>
                      <div className="flex min-h-9 w-12 shrink-0 items-center justify-center border-[#d0d5dd] px-2">
                        <img
                          src="/icons/subscriptions/highlight-mouse-cursor.svg"
                          alt=""
                          className="size-5 shrink-0"
                          width={20}
                          height={20}
                          aria-hidden
                        />
                      </div>
                    </div>

                    {productRows.length === 0 ? (
                      <div className="flex flex-col items-center px-6 py-10 sm:px-16">
                        <div className="mb-3 flex size-[88px] items-center justify-center">
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
                        <p className="mt-1 max-w-[320px] text-center text-sm leading-5 text-[#475467]">
                          Start by adding products or services to calculate totals.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {productRows.map((row) => {
                          const rowSub = row.price * row.qty;
                          return (
                            <div
                              key={row.id}
                              className="flex min-h-9 w-full border-b border-[#d0d5dd] bg-white last:border-b-0"
                            >
                              <div className="flex min-h-9 min-w-0 flex-1 items-center gap-1 border-r border-[#d0d5dd] px-3">
                                <Repeat2
                                  className="size-4 shrink-0 text-[#475467]"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="min-w-0 flex-1 truncate text-base font-medium text-[#475467]">
                                  {row.name}
                                </span>
                                <ChevronDown
                                  className="size-4 shrink-0 text-[#667085]"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              </div>
                              <div className="flex w-[160px] shrink-0 items-center border-r border-[#d0d5dd] px-3 opacity-90">
                                <div
                                  className={cn(
                                    "flex h-7 w-full items-center gap-1 rounded border border-[#d0d5dd] bg-white px-1.5 text-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                                    figmaFieldFocusWithin
                                  )}
                                >
                                  <span className="text-[#475467]">$</span>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={row.price}
                                    onChange={(e) =>
                                      updateProductRow(row.id, {
                                        price: Number(e.target.value) || 0,
                                      })
                                    }
                                    className={cn(
                                      "min-w-0 flex-1 bg-transparent text-[#101828]",
                                      figmaFieldInnerInput
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="flex w-[100px] shrink-0 items-center border-r border-[#d0d5dd] px-3 opacity-90">
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  value={row.qty}
                                  onChange={(e) =>
                                    updateProductRow(row.id, {
                                      qty: Math.max(1, Number(e.target.value) || 1),
                                    })
                                  }
                                  className={cn(
                                    "flex h-7 w-full rounded border border-[#d0d5dd] bg-white px-1.5 text-sm text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                                    figmaFieldFocusVisible
                                  )}
                                />
                              </div>
                              <div className="flex w-[87px] shrink-0 items-center border-r border-[#d0d5dd] px-3">
                                {row.taxPercent != null ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-base font-medium text-[#475467]">
                                      {row.taxPercent}%
                                    </span>
                                    <Info className="size-4 text-[#667085]" aria-hidden />
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="text-base font-medium text-[#004eeb] hover:underline"
                                    onClick={() => showSuccess("Add tax for this line.")}
                                  >
                                    Add tax
                                  </button>
                                )}
                              </div>
                              <div className="flex w-[130px] shrink-0 items-center justify-end border-r border-[#d0d5dd] px-3">
                                <span className="text-base font-medium tabular-nums text-[#475467]">
                                  ${rowSub.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex w-12 shrink-0 items-center justify-center px-1">
                                <DropdownMenu modal={false}>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex size-6 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                                      aria-label={`Actions for ${row.name}`}
                                    >
                                      <MoreVertical className="size-4" strokeWidth={2} />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="z-[200]">
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onSelect={() => removeProductRow(row.id)}
                                    >
                                      Remove line
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {hasLineItems ? (
                <div className="space-y-2 pr-0 sm:pr-10">
                  <div className="flex items-start justify-between gap-4 px-3 py-1">
                    <span className="text-base font-semibold leading-6 text-[#101828]">
                      Subtotal
                    </span>
                    <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                      ${lineSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2 px-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <Repeat2 className="size-4 shrink-0 text-[#101828]" aria-hidden />
                        <span className="truncate text-base text-[#101828]">
                          Discount (SUMMER20)
                        </span>
                      </div>
                      <span className="shrink-0 text-base font-medium tabular-nums text-[#101828]">
                        -${COUPON_DISCOUNT.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="text-base font-medium text-[#004eeb] hover:underline"
                        onClick={() => showSuccess("Coupon flow would open here.")}
                      >
                        Change coupon
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-4 px-3 py-1">
                    <span className="text-base font-semibold leading-6 text-[#101828]">
                      Taxable subtotal
                    </span>
                    <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                      ${taxableSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1 px-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <Repeat2 className="size-4 shrink-0 text-[#101828]" aria-hidden />
                        <span className="text-base text-[#101828]">
                          Central tax (10% on $35.00)
                        </span>
                      </div>
                      <span className="text-base font-medium tabular-nums text-[#101828]">
                        ${CENTRAL_TAX.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <Repeat2 className="size-4 shrink-0 text-[#101828]" aria-hidden />
                        <span className="text-base text-[#101828]">
                          City tax (8% on $35.00)
                        </span>
                      </div>
                      <span className="text-base font-medium tabular-nums text-[#101828]">
                        ${CITY_TAX.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-base font-medium text-[#004eeb] hover:underline"
                      onClick={() => showSuccess("Tax editor would open here.")}
                    >
                      Edit tax
                    </button>
                  </div>
                  <Separator className="my-1 bg-[#eaecf0]" />
                  <div className="flex items-start justify-between gap-4 px-3 py-1">
                    <span className="text-base font-semibold leading-6 text-[#101828]">
                      Amount due (in USD)
                    </span>
                    <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                      ${amountDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 space-y-1 px-3 sm:pr-12">
                  <div className="flex items-start justify-between gap-4 py-1">
                    <span className="text-base font-semibold leading-6 text-[#101828]">
                      Subtotal
                    </span>
                    <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                      $0.00
                    </span>
                  </div>
                  <div className="space-y-1">
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
                  <div className="flex items-start justify-between gap-4 py-1">
                    <span className="text-base font-semibold leading-6 text-[#101828]">
                      Amount due (in USD)
                    </span>
                    <span className="text-base font-semibold tabular-nums leading-6 text-[#101828]">
                      $0.00
                    </span>
                  </div>
                </div>
              )}
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
                <div className="space-y-3">
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
                  {hasLineItems && giftCard ? (
                    <div className="space-y-2">
                      <div
                        className={cn(
                          "flex h-9 w-full max-w-full overflow-hidden rounded-md border border-[#d0d5dd] bg-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] sm:max-w-md",
                          figmaFieldFocusWithin
                        )}
                      >
                        <input
                          type="text"
                          value={giftCardCode}
                          onChange={(e) => setGiftCardCode(e.target.value)}
                          className={cn(
                            "min-w-0 flex-1 border-r border-[#d0d5dd] px-2 text-base text-[#101828]",
                            figmaFieldInnerInput
                          )}
                          placeholder="Gift card code"
                          aria-label="Gift card code"
                        />
                        <button
                          type="button"
                          onClick={() => showSuccess("Gift card applied.")}
                          className="shrink-0 px-3.5 py-2 text-base font-semibold text-[#344054] hover:bg-slate-50"
                        >
                          Apply
                        </button>
                      </div>
                      <p className="text-sm leading-5 text-[#475467]">
                        <span className="inline-flex size-3.5 items-center justify-center align-middle">
                          <Banknote className="size-3.5 text-[#475467]" aria-hidden />
                        </span>{" "}
                        Gift card applied:{" "}
                        <span className="font-medium text-[#101828]">$80</span> (Initial
                        balance is $100)
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[#475467]">
                        <span>Amount left to pay:</span>
                        <span className="font-medium text-[#101828]">$150</span>
                        <Info className="size-3 text-[#667085]" aria-hidden />
                      </div>
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-medium leading-6 text-[#101828]">
                      Pay via cards
                    </p>
                    {hasLineItems ? (
                      <button
                        type="button"
                        onClick={() => showSuccess("Add new card flow.")}
                        className="inline-flex items-center gap-2 text-base font-semibold text-[#004eeb] hover:underline"
                      >
                        <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                        Add new card
                      </button>
                    ) : null}
                  </div>
                  {hasLineItems ? (
                    <div className="flex flex-col gap-2">
                      {(
                        [
                          {
                            id: "visa" as const,
                            title: "Visa ending in 1234",
                            sub: "Saved with Paypal",
                            brand: "Visa",
                          },
                          {
                            id: "mastercard" as const,
                            title: "Mastercard credit ending in 1234",
                            sub: "Saved with Stripe",
                            brand: "MC",
                          },
                          {
                            id: "apple" as const,
                            title: "Applepay ending in 1234",
                            sub: "Saved with Authorize.net",
                            brand: "Apple Pay",
                          },
                        ] as const
                      ).map((card) => (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => setSelectedPaymentCard(card.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded border px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
                            selectedPaymentCard === card.id
                              ? "border-[#155eef] bg-white"
                              : "border-[#eaecf0] bg-white"
                          )}
                        >
                          <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded border border-[#eaecf0] bg-white text-xs font-semibold text-[#344054]">
                            {card.brand}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-medium leading-6 text-[#101828]">
                              {card.title}
                            </p>
                            <p className="text-sm leading-5 text-[#475467]">{card.sub}</p>
                          </div>
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-[8px] border",
                              selectedPaymentCard === card.id
                                ? "border-[#155eef] bg-[#155eef]"
                                : "border-[#98a2b3] bg-white"
                            )}
                            aria-hidden
                          >
                            {selectedPaymentCard === card.id ? (
                              <Check className="size-3 text-white" strokeWidth={3} />
                            ) : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 border-t border-[#d0d5dd] pb-3 pt-3">
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
    </>
  );
}
