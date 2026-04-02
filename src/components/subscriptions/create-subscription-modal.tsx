"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  HUB_TOAST_DURATION_MS,
  HubAlertToast,
  MODAL_OVERLAY_TOAST_TOP_PX,
  useHubToast,
} from "@/components/payment-hub/hub-toast";
import { subscriptionCreatedSuccessMessage } from "@/components/subscriptions/subscription-created-messages";
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
import {
  DropdownMenuSearchField,
  DropdownMenuSearchFooter,
  DropdownMenuSearchScrollArea,
  SEARCHABLE_DROPDOWN_MENU_CONTENT_CLASS,
} from "@/components/ui/dropdown-menu-search-panel";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  invoiceDarkTooltipClassName,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FigmaDatePickerField } from "@/components/subscriptions/figma-date-picker";
import {
  figmaFieldFocusTransition,
  figmaFieldFocusVisible,
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { FigmaRadioIndicator } from "@/components/subscriptions/figma-radio-indicator";
import type { CustomerDemoProfile } from "@/components/subscriptions/customer-demo-data";
import type { CustomerFormValues } from "@/components/subscriptions/edit-customer-information-modal";
import {
  brandBadgeLabel,
  type SubscriptionPaymentCard,
} from "@/components/subscriptions/subscription-payment-card";
import { buildSubscriptionRowFromCreateModal } from "@/components/subscriptions/subscription-row-from-create";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import {
  aggregateLineItemTaxesForSummary,
  getLineTaxBreakdown,
  sumTaxLineAmounts,
  type TaxMode,
} from "@/components/subscriptions/tax-catalog";
import { cn } from "@/lib/utils";

/** Match subscriptions table row actions — Figma ghost icon + menu items. */
const lineProductRowMenuItemClass =
  "cursor-pointer gap-2 rounded px-4 py-2 text-base font-medium leading-6 text-[#101828] data-[highlighted]:bg-[#f2f4f7] data-[highlighted]:text-[#101828]";

type PaymentMode = "live" | "test";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfToday() {
  return startOfDay(new Date());
}

type CreateSubscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Customer directory (seed + any added in-session). */
  customers: CustomerDemoProfile[];
  /**
   * When reopening Create after Add customer save, select this directory id once.
   * Parent clears after the modal reads it (onInitialCustomerIdConsumed).
   */
  initialCustomerId?: string | null;
  onInitialCustomerIdConsumed?: () => void;
  customerEditFields: CustomerFormValues | null;
  onCustomerEditFieldsChange: (values: CustomerFormValues | null) => void;
  /** Success toast on Create overlay (52px) after Edit/Add customer save — parent-owned. */
  customerSaveToast: { name: string; mode: "add" | "edit" } | null;
  onCustomerSaveToastDismiss: () => void;
  /** Close create and open edit customer — parent owns the edit modal. */
  onRequestEditCustomer: (
    initialValues: CustomerFormValues,
    customerId: string
  ) => void;
  /** Close create and open add-customer form (empty fields). */
  onRequestAddCustomer: () => void;
  /** Close create and open add payment card modal (parent-owned). */
  onRequestAddPaymentCard?: () => void;
  /** Close create and open tax modal — line row or subscription-wide (parent-owned). */
  onRequestAddLineItemTax: (
    payload:
      | {
          kind: "line";
          rowId: string;
          productName: string;
          intent?: "add" | "edit";
          /** Restore multi-select tax rows when opening Edit (manual mode). */
          initialMode?: TaxMode;
          initialSelectedTaxIds?: string[];
        }
      | { kind: "subscription"; intent?: "add" | "edit" }
  ) => void;
  /** Parent applies saved tax after tax modal closes (one line or all lines). */
  lineTaxPatch:
    | {
        kind: "line";
        rowId: string;
        taxPercent: number;
        mode: TaxMode;
        selectedTaxIds: string[];
      }
    | {
        kind: "subscription";
        taxPercent: number;
        mode: TaxMode;
        selectedTaxIds: string[];
      }
    | null;
  onLineTaxPatchConsumed: () => void;
  /** Cards added via Add payment card (parent); drives Pay via cards list (Figma 1164:198467). */
  savedPaymentCards: SubscriptionPaymentCard[];
  /** Parent sets briefly after save — highlight row + scroll into view. */
  lastAddedPaymentCardId?: string | null;
  /** Persist to dashboard table + detail route (sessionStorage until API exists). */
  onSubscriptionCreated?: (row: SubscriptionRow) => void;
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
  /** Mirrors last save from Add tax modal (line scope). */
  taxMode?: TaxMode | null;
  taxSelectedIds?: string[] | null;
};

/**
 * Catalog options — Figma 1161:94547 (dropdown list).
 * Each item carries the default unit price from the catalog; selecting a row fills
 * the price field (user can still edit afterward).
 */
const CATALOG_PRODUCTS = [
  { name: "Organic matcha powder", price: 100 },
  { name: "Electric kettle", price: 79.99 },
  { name: "French press coffee maker", price: 42.5 },
  { name: "Reusable water bottle", price: 24 },
  { name: "AeroPress coffee maker", price: 39.95 },
  { name: "Pour over coffee set", price: 55 },
  { name: "Coffee grinder", price: 89 },
  { name: "Espresso machine", price: 449 },
  { name: "Tea sampler set", price: 32 },
] as const;

const CATALOG_PRODUCT_DEFAULT_PRICE: Record<string, number> =
  Object.fromEntries(CATALOG_PRODUCTS.map((p) => [p.name, p.price]));

const CATALOG_PRODUCT_NAMES = CATALOG_PRODUCTS.map((p) => p.name);

const PRODUCT_TABLE_HDR_ICON = "size-4 shrink-0 object-contain";

/** Figma 1164:180573 — Trial days beside frequency date range. */
const TRIAL_DAYS_MIN = 1;
const TRIAL_DAYS_MAX = 365;

function clampTrialDays(n: number): number {
  const f = Math.floor(Number(n));
  if (!Number.isFinite(f)) return TRIAL_DAYS_MIN;
  return Math.min(TRIAL_DAYS_MAX, Math.max(TRIAL_DAYS_MIN, f));
}

/** Line quantity: natural numbers (integers ≥ 1) only. */
function naturalQty(n: number): number {
  const f = Math.floor(Number(n));
  return Number.isFinite(f) && f >= 1 ? f : 1;
}

/** Truncated product name — tooltip with full label only when overflow (table column). */
function LineItemProductNameTruncatingTooltip({
  text,
  className,
  /** Re-run overflow check when row layout changes (e.g. catalog dropdown open). */
  measureKey,
}: {
  text: string;
  className?: string;
  measureKey?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setOverflow(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [text, measureKey, measure]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const span = (
    <span
      ref={ref}
      onMouseEnter={measure}
      className={cn("min-w-0 flex-1 truncate text-base", className)}
    >
      {text}
    </span>
  );

  if (!overflow) return span;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{span}</TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={4}
        className={cn(
          "z-[210] max-w-[min(280px,calc(100vw-2rem))] text-left",
          invoiceDarkTooltipClassName
        )}
      >
        <span className="block break-words">{text}</span>
        <TooltipArrow />
      </TooltipContent>
    </Tooltip>
  );
}

/** Mock catalog — amounts drive taxable subtotal when a coupon is applied. */
const COUPON_OPTIONS = [
  { code: "SUMMER20", amount: 21 },
  { code: "WELCOME10", amount: 10 },
  { code: "FIRST15", amount: 15 },
] as const;

/** Figma 1164:166076 — amount column fixed 102px, px-3. */
function CalcCurrencySemibold({ amount }: { amount: string }) {
  return (
    <div className="flex w-[102px] shrink-0 items-center justify-end px-3">
      <div className="flex min-w-0 items-center justify-end gap-1 tabular-nums text-base font-semibold leading-6 text-[#101828]">
        <span>$</span>
        <span>{amount}</span>
      </div>
    </div>
  );
}

function CalcCurrencyMedium({ amount }: { amount: string }) {
  return (
    <div className="flex w-[102px] shrink-0 items-center justify-end px-3">
      <div className="flex min-w-0 items-center justify-end gap-1 tabular-nums text-base font-medium leading-6 text-[#101828]">
        <span>$</span>
        <span>{amount}</span>
      </div>
    </div>
  );
}

function CalcCurrencyDiscount({ amount }: { amount: number }) {
  return (
    <div className="flex w-[102px] shrink-0 items-center justify-end px-3">
      <div className="flex min-w-0 items-center justify-end gap-1 tabular-nums text-base font-medium leading-6 text-[#101828]">
        <span>-</span>
        <span>$</span>
        <span>{amount.toFixed(2)}</span>
      </div>
    </div>
  );
}

function CalcSummaryRow({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex min-h-6 w-full items-center">
      <div className="min-w-0 flex-1 px-3">
        <span className="text-base font-semibold leading-6 text-[#101828]">
          {label}
        </span>
      </div>
      <CalcCurrencySemibold amount={amount} />
    </div>
  );
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
  customers,
  initialCustomerId = null,
  onInitialCustomerIdConsumed,
  customerEditFields,
  onCustomerEditFieldsChange,
  customerSaveToast,
  onCustomerSaveToastDismiss,
  onRequestEditCustomer,
  onRequestAddCustomer,
  onRequestAddPaymentCard,
  onRequestAddLineItemTax,
  lineTaxPatch,
  onLineTaxPatchConsumed,
  savedPaymentCards,
  lastAddedPaymentCardId = null,
  onSubscriptionCreated,
}: CreateSubscriptionModalProps) {
  const { showSuccess, showError } = useHubToast();
  const customerSelectId = useId();
  const frequencyStartDateId = useId();
  const frequencyEndDateId = useId();
  const businessTaxIdInputId = useId();
  const trialDaysLabelId = useId();
  const trialDaysInputId = useId();
  const [createToastPortalReady] = useState(true);
  const customerSaveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [startDate, setStartDate] = useState(startOfToday);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("live");
  const [customer, setCustomer] = useState("");
  /** Subscription-level tax breakdown hidden until user adds tax. */
  const [subscriptionTaxAdded, setSubscriptionTaxAdded] = useState(false);
  /** Line-item discount (coupon) hidden until user applies a coupon. */
  const [subscriptionDiscountAdded, setSubscriptionDiscountAdded] =
    useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState("SUMMER20");
  const [appliedDiscountAmount, setAppliedDiscountAmount] = useState(21);
  /** Figma 1164:102142 — Apply coupon row: select + confirm / dismiss. */
  const [couponBarOpen, setCouponBarOpen] = useState(false);
  const [couponDropdownOpen, setCouponDropdownOpen] = useState(false);
  /** Draft selection before clicking the check control. */
  const [couponDraft, setCouponDraft] = useState<string | null>(null);

  const [subscriptionSettingsOpen, setSubscriptionSettingsOpen] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(true);

  const [setFrequency, setSetFrequency] = useState(false);
  const [taxId, setTaxId] = useState(false);
  /** Additional options — Figma 1164:180573 (frequency row + tax ID field). */
  const [frequencyStartDate, setFrequencyStartDate] = useState(startOfToday);
  const [frequencyEndDate, setFrequencyEndDate] = useState(startOfToday);
  const [trialDays, setTrialDays] = useState(12);
  const [businessTaxId, setBusinessTaxId] = useState("");

  const selectedCustomer = useMemo(
    () => (customer ? findCustomerById(customer, customers) : undefined),
    [customer, customers]
  );

  const appliedInitialCustomerIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      appliedInitialCustomerIdRef.current = null;
      return;
    }
    if (!initialCustomerId) return;
    if (appliedInitialCustomerIdRef.current === initialCustomerId) return;
    appliedInitialCustomerIdRef.current = initialCustomerId;
    // Parent passes id once after add-customer save; local selection must match directory.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional one-way sync from parent
    setCustomer(initialCustomerId);
    onInitialCustomerIdConsumed?.();
  }, [open, initialCustomerId, onInitialCustomerIdConsumed]);

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
        const today = startOfToday();
        setStartDate(today);
        setFrequencyStartDate(today);
        setFrequencyEndDate(today);
        setTrialDays(12);
        setBusinessTaxId("");
        setSetFrequency(false);
        setTaxId(false);
        setSubscriptionTaxAdded(false);
        setSubscriptionDiscountAdded(false);
        setAppliedCouponCode("SUMMER20");
        setAppliedDiscountAmount(21);
        setCouponBarOpen(false);
        setCouponDropdownOpen(false);
        setCouponDraft(null);
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

  const [productRows, setProductRows] = useState<ProductLineItem[]>([]);
  /** Which row’s catalog dropdown is open — Figma 1161:94547; new rows open on add (1161:93520). */
  const [productPickerRowId, setProductPickerRowId] = useState<string | null>(
    null
  );
  const [productPickerSearch, setProductPickerSearch] = useState("");
  const productCatalogSearchId = useId();
  const [selectedPaymentCardId, setSelectedPaymentCardId] = useState<
    string | null
  >(null);
  const savedCardsLenRef = useRef(0);

  useEffect(() => {
    const n = savedPaymentCards.length;
    if (n === 0) {
      setSelectedPaymentCardId(null);
      savedCardsLenRef.current = 0;
      return;
    }
    if (n > savedCardsLenRef.current) {
      setSelectedPaymentCardId(savedPaymentCards[n - 1]!.id);
      savedCardsLenRef.current = n;
      return;
    }
    savedCardsLenRef.current = n;
    setSelectedPaymentCardId((prev) =>
      prev != null && savedPaymentCards.some((c) => c.id === prev)
        ? prev
        : savedPaymentCards[0]!.id
    );
  }, [savedPaymentCards]);

  useEffect(() => {
    if (!open || !lastAddedPaymentCardId) return;
    const t = window.setTimeout(() => {
      document
        .querySelector(`[data-payment-card-id="${lastAddedPaymentCardId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
    return () => clearTimeout(t);
  }, [open, lastAddedPaymentCardId, savedPaymentCards.length]);

  const filteredCatalogProducts = useMemo(() => {
    const q = productPickerSearch.trim().toLowerCase();
    if (!q) return [...CATALOG_PRODUCT_NAMES];
    return CATALOG_PRODUCT_NAMES.filter((name) =>
      name.toLowerCase().includes(q)
    );
  }, [productPickerSearch]);

  const lineSubtotal = useMemo(
    () =>
      productRows.reduce(
        (s, r) => s + r.price * naturalQty(r.qty),
        0
      ),
    [productRows]
  );
  const taxableSubtotal = useMemo(() => {
    if (!subscriptionDiscountAdded) return lineSubtotal;
    return lineSubtotal - appliedDiscountAmount;
  }, [lineSubtotal, subscriptionDiscountAdded, appliedDiscountAmount]);

  const hasLineItemTax = useMemo(
    () => productRows.some((r) => r.taxPercent != null),
    [productRows]
  );
  const taxSummaryLines = useMemo(
    () => aggregateLineItemTaxesForSummary(productRows),
    [productRows]
  );
  const totalRolledUpTax = useMemo(
    () => sumTaxLineAmounts(taxSummaryLines),
    [taxSummaryLines]
  );
  const amountDue = useMemo(() => {
    if (!hasLineItemTax) return taxableSubtotal;
    return taxableSubtotal + totalRolledUpTax;
  }, [taxableSubtotal, hasLineItemTax, totalRolledUpTax]);

  const hasLineItems = productRows.length > 0;
  /** First row must have a catalog / item name before adding another line (empty state still allows the first row). */
  const canPrependProductRow =
    productRows.length === 0 || productRows[0].name.trim().length > 0;

  const frequencyDateRangeInvalid = useMemo(() => {
    if (!setFrequency) return false;
    return (
      startOfDay(frequencyStartDate).getTime() >
      startOfDay(frequencyEndDate).getTime()
    );
  }, [setFrequency, frequencyStartDate, frequencyEndDate]);

  const baseCanCreate =
    hasLineItems &&
    Boolean(selectedCustomer) &&
    productRows.every((r) => r.name.trim().length > 0);

  const canCreate =
    baseCanCreate &&
    (!setFrequency || !frequencyDateRangeInvalid) &&
    (!taxId || businessTaxId.trim().length > 0) &&
    (!hasLineItems ||
      (savedPaymentCards.length > 0 && selectedPaymentCardId != null));

  const openCouponMenu = useCallback(() => {
    setCouponBarOpen(true);
    // Open the select after this pointer gesture completes so Radix doesn’t treat
    // the opening click as an outside dismiss (Dialog + portaled dropdown).
    window.setTimeout(() => setCouponDropdownOpen(true), 0);
  }, []);

  const confirmCouponSelection = useCallback(() => {
    if (!couponDraft) {
      showError("Select a coupon from the list.");
      return;
    }
    const opt = COUPON_OPTIONS.find((o) => o.code === couponDraft);
    setAppliedCouponCode(couponDraft);
    setAppliedDiscountAmount(opt?.amount ?? 0);
    setSubscriptionDiscountAdded(true);
    setCouponBarOpen(false);
    setCouponDropdownOpen(false);
  }, [couponDraft, showError]);

  const dismissCouponBar = useCallback(() => {
    setCouponDropdownOpen(false);
    setCouponBarOpen(false);
    if (!subscriptionDiscountAdded) {
      setCouponDraft(null);
    } else {
      setCouponDraft(appliedCouponCode);
    }
  }, [subscriptionDiscountAdded, appliedCouponCode]);

  const clearSubscriptionCoupon = useCallback(() => {
    setSubscriptionDiscountAdded(false);
    setCouponBarOpen(false);
    setCouponDropdownOpen(false);
    setCouponDraft(null);
    setAppliedCouponCode("SUMMER20");
    setAppliedDiscountAmount(21);
  }, []);

  const clearSubscriptionTax = useCallback(() => {
    setSubscriptionTaxAdded(false);
    setProductRows((rows) =>
      rows.map((r) => ({
        ...r,
        taxPercent: null,
        taxMode: null,
        taxSelectedIds: null,
      }))
    );
  }, []);

  const updateProductRow = (id: string, patch: Partial<ProductLineItem>) => {
    setProductRows((rows) =>
      rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  useEffect(() => {
    if (!lineTaxPatch) return;
    if (lineTaxPatch.kind === "subscription") {
      setProductRows((rows) =>
        rows.map((r) => ({
          ...r,
          taxPercent: lineTaxPatch.taxPercent,
          taxMode: lineTaxPatch.mode,
          taxSelectedIds: lineTaxPatch.selectedTaxIds,
        }))
      );
      setSubscriptionTaxAdded(true);
    } else {
      setProductRows((rows) =>
        rows.map((r) =>
          r.id === lineTaxPatch.rowId
            ? {
                ...r,
                taxPercent: lineTaxPatch.taxPercent,
                taxMode: lineTaxPatch.mode,
                taxSelectedIds: lineTaxPatch.selectedTaxIds,
              }
            : r
        )
      );
    }
    onLineTaxPatchConsumed();
  }, [lineTaxPatch, onLineTaxPatchConsumed]);

  const removeProductRow = (id: string) => {
    setProductPickerRowId((cur) => (cur === id ? null : cur));
    setProductRows((rows) => rows.filter((r) => r.id !== id));
  };
  /** New lines insert at the top; catalog opens for the new line (Figma 1161:93520 + 1161:94547). */
  const prependProductRow = () => {
    if (!canPrependProductRow) return;
    const id = `p-${Date.now()}`;
    setProductPickerRowId(id);
    setProductRows((rows) => [
      {
        id,
        name: "",
        price: 0,
        qty: 1,
        taxPercent: null,
        taxMode: null,
        taxSelectedIds: null,
      },
      ...rows,
    ]);
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

        <TooltipProvider delayDuration={200}>
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
                    customers={customers}
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
                              onRequestEditCustomer(
                                editCustomerInitialValues,
                                customer
                              );
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

            {/* Add product + table — item select Figma 1161:93520; catalog menu 1161:94547 */}
            <div className="flex flex-col gap-4 border-b border-[#d0d5dd] pb-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 w-full flex-1 space-y-1">
                  <p className="text-base font-semibold leading-6 text-[#101828]">
                    Add product
                  </p>
                  <p className="text-sm font-normal leading-5 text-[#475467]">
                    Choose items from your catalog or create new ones to include in this
                    subscription.
                  </p>
                </div>
                {productRows.length > 0 ? (
                  <button
                    type="button"
                    disabled={!canPrependProductRow}
                    title={
                      !canPrependProductRow
                        ? "Select a product for the first row before adding another"
                        : undefined
                    }
                    onClick={() => prependProductRow()}
                    className={cn(
                      /* Figma 1164:100593 — disabled: border + label + icon primary/200 #b2ccff; enabled: #84adff / #004eeb */
                      "inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded border bg-white px-2.5 py-1.5 text-base font-semibold outline-none sm:w-auto sm:self-center",
                      canPrependProductRow
                        ? "border-[#84adff] text-[#004eeb] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                        : "cursor-not-allowed border-[#b2ccff] text-[#b2ccff] shadow-none disabled:opacity-100"
                    )}
                  >
                    <Plus
                      className="size-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                    Add product
                  </button>
                ) : null}
              </div>

              <div className="overflow-hidden rounded border border-[#d0d5dd] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                <div className="overflow-x-auto">
                  <div
                    className={
                      productRows.length === 0 ? "min-w-[712px]" : "min-w-[760px]"
                    }
                  >
                    <div className="flex h-9 w-full min-w-0 shrink-0 border-b border-[#d0d5dd] bg-[#f2f4f7] text-base font-semibold leading-6 text-[#101828]">
                      <div className="flex h-9 min-w-0 flex-1 items-center gap-1 border-r border-[#d0d5dd] px-3">
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
                      <div className="flex h-9 w-[160px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
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
                      <div className="flex h-9 w-[100px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
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
                      <div className="flex h-9 w-[127px] shrink-0 items-center gap-1 border-r border-[#d0d5dd] px-3">
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
                      <div
                        className={cn(
                          "flex h-9 w-[130px] shrink-0 items-center justify-end gap-1 px-3",
                          productRows.length > 0 && "border-r border-[#d0d5dd]"
                        )}
                      >
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
                      {productRows.length > 0 ? (
                        <div className="flex h-9 w-12 shrink-0 items-center justify-center border-[#d0d5dd] px-2">
                          <img
                            src="/icons/subscriptions/highlight-mouse-cursor.svg"
                            alt=""
                            className="size-5 shrink-0"
                            width={20}
                            height={20}
                            aria-hidden
                          />
                        </div>
                      ) : null}
                    </div>

                    {productRows.length === 0 ? (
                      <div
                        role="status"
                        aria-label="No products in this subscription yet"
                        className="flex h-[252px] flex-col items-center justify-center bg-[#FFFFFF] px-4 py-8 sm:px-8"
                      >
                        <div className="flex w-full max-w-[400px] flex-col items-center gap-1">
                          <div className="flex size-[112px] shrink-0 items-center justify-center rounded-full">
                            <img
                              src="/icons/empty-state-add-product.svg"
                              alt=""
                              width={88}
                              height={88}
                              className="size-[88px] shrink-0"
                              aria-hidden
                            />
                          </div>
                          <div className="flex w-full flex-col items-center gap-4">
                            <div className="flex flex-col gap-1 text-center">
                              <p className="text-sm font-semibold leading-5 text-[#101828] sm:text-base sm:leading-6">
                                No products added yet
                              </p>
                              <p className="text-sm font-normal leading-5 text-[#475467]">
                                Start by adding products or services to calculate totals.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => prependProductRow()}
                              className={cn(
                                "inline-flex h-9 w-full max-w-[200px] shrink-0 items-center justify-center gap-2 rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none",
                                "hover:bg-[#155eef]/90 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 sm:max-w-none sm:w-auto"
                              )}
                            >
                              <Plus
                                className="size-4 shrink-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                              Add product
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {productRows.map((row) => {
                          const rowSub = row.price * naturalQty(row.qty);
                          const itemLabel =
                            row.name.trim() || "Unnamed item";
                          const hasItemName = Boolean(row.name.trim());
                          const isProductPickerOpen =
                            productPickerRowId === row.id;
                          return (
                            <div
                              key={row.id}
                              className="flex h-9 w-full shrink-0 border-b border-[#d0d5dd] bg-white last:border-b-0"
                            >
                              <div className="flex h-9 min-w-0 flex-1 items-center gap-1 border-r border-[#d0d5dd] px-3">
                                <DropdownMenu
                                  modal={false}
                                  open={isProductPickerOpen}
                                  onOpenChange={(nextOpen) => {
                                    if (nextOpen) {
                                      setProductPickerRowId(row.id);
                                      setProductPickerSearch("");
                                    } else {
                                      setProductPickerRowId((cur) =>
                                        cur === row.id ? null : cur
                                      );
                                      setProductPickerSearch("");
                                    }
                                  }}
                                >
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      id={`subscription-item-trigger-${row.id}`}
                                      type="button"
                                      aria-label="Item"
                                      className={cn(
                                        "flex min-h-0 min-w-0 flex-1 items-center gap-1 rounded text-left text-base outline-none transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
                                        hasItemName && !isProductPickerOpen
                                          ? "h-9 border-0 bg-transparent px-0 shadow-none"
                                          : "h-7 border border-[#84adff] bg-white px-2 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_#d1e0ff]",
                                        !hasItemName && "py-1.5"
                                      )}
                                    >
                                      {hasItemName ? (
                                        <LineItemProductNameTruncatingTooltip
                                          text={row.name}
                                          measureKey={isProductPickerOpen}
                                          className={
                                            !isProductPickerOpen
                                              ? "font-medium text-[#475467]"
                                              : "font-medium text-[#101828]"
                                          }
                                        />
                                      ) : (
                                        <span className="min-w-0 flex-1 truncate text-base font-medium text-[#667085]">
                                          Select product
                                        </span>
                                      )}
                                      <ChevronDown
                                        className="size-4 shrink-0 text-[#667085]"
                                        strokeWidth={2}
                                        aria-hidden
                                      />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="start"
                                    sideOffset={4}
                                    className={SEARCHABLE_DROPDOWN_MENU_CONTENT_CLASS}
                                  >
                                    <DropdownMenuSearchField
                                      inputId={`${productCatalogSearchId}-catalog`}
                                      value={productPickerSearch}
                                      onChange={setProductPickerSearch}
                                      placeholder="Search"
                                    />
                                    <DropdownMenuSearchScrollArea>
                                      {filteredCatalogProducts.length === 0 ? (
                                        <div className="px-4 py-3 text-sm leading-5 text-[#667085]">
                                          No products match your search.
                                        </div>
                                      ) : (
                                        filteredCatalogProducts.map((label) => {
                                          const isSelected = row.name === label;
                                          return (
                                            <DropdownMenuItem
                                              key={label}
                                              selected={isSelected}
                                              className="cursor-pointer rounded-none border-0 px-4 py-2 text-left text-base font-medium shadow-none"
                                              onSelect={() => {
                                                updateProductRow(row.id, {
                                                  name: label,
                                                  price:
                                                    CATALOG_PRODUCT_DEFAULT_PRICE[
                                                      label
                                                    ] ?? 0,
                                                });
                                                setProductPickerRowId(null);
                                              }}
                                            >
                                              <div className="flex w-full min-w-0 items-center gap-2">
                                                <p className="min-w-0 flex-1 truncate text-base font-medium leading-6 text-[#101828]">
                                                  {label}
                                                </p>
                                                {isSelected ? (
                                                  <Check
                                                    className="size-4 shrink-0 text-[#155eef]"
                                                    strokeWidth={2}
                                                    aria-hidden
                                                  />
                                                ) : null}
                                              </div>
                                            </DropdownMenuItem>
                                          );
                                        })
                                      )}
                                    </DropdownMenuSearchScrollArea>
                                    <DropdownMenuSearchFooter>
                                      <DropdownMenuItem
                                        className="cursor-pointer justify-start gap-2 rounded-none px-4 py-2 text-base font-semibold leading-6 text-[#004eeb] data-[highlighted]:bg-[#f9fafb] data-[highlighted]:text-[#004eeb]"
                                        onSelect={() => {
                                          showSuccess(
                                            "Create product would open here."
                                          );
                                          setProductPickerRowId(null);
                                        }}
                                      >
                                        <Plus
                                          className="size-5 shrink-0"
                                          strokeWidth={2}
                                          aria-hidden
                                        />
                                        Create product
                                      </DropdownMenuItem>
                                    </DropdownMenuSearchFooter>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="flex h-9 w-[160px] shrink-0 items-center border-r border-[#d0d5dd] px-3 opacity-90">
                                <div
                                  className={cn(
                                    "flex h-7 w-full items-center gap-1 rounded border border-[#d0d5dd] bg-white px-1.5 text-base font-normal leading-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
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
                                      "input-number-no-spin min-w-0 flex-1 bg-transparent text-base font-normal leading-6 text-[#101828]",
                                      figmaFieldInnerInput
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="flex h-9 w-[100px] shrink-0 items-center border-r border-[#d0d5dd] px-3 opacity-90">
                                <input
                                  type="number"
                                  min={1}
                                  step={1}
                                  inputMode="numeric"
                                  value={naturalQty(row.qty)}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "e" ||
                                      e.key === "E" ||
                                      e.key === "+" ||
                                      e.key === "-" ||
                                      e.key === "." ||
                                      e.key === ","
                                    ) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === "") {
                                      updateProductRow(row.id, { qty: 1 });
                                      return;
                                    }
                                    updateProductRow(row.id, {
                                      qty: naturalQty(Number(raw)),
                                    });
                                  }}
                                  className={cn(
                                    "flex h-7 w-full rounded border border-[#d0d5dd] bg-white px-1.5 text-base font-normal leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                                    figmaFieldFocusVisible
                                  )}
                                />
                              </div>
                              <div className="flex h-9 w-[127px] shrink-0 items-center border-r border-[#d0d5dd] px-3">
                                {row.taxPercent != null ? (
                                  <div className="flex min-w-0 flex-1 items-center gap-0.5">
                                    <button
                                      type="button"
                                      className="min-w-0 flex-1 truncate rounded text-left outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                                      onClick={() =>
                                        onRequestAddLineItemTax({
                                          kind: "line",
                                          rowId: row.id,
                                          productName:
                                            row.name.trim() || "Product",
                                          intent: "edit",
                                          initialMode: row.taxMode ?? "manual",
                                          initialSelectedTaxIds:
                                            row.taxSelectedIds ?? [],
                                        })
                                      }
                                    >
                                      <span className="text-base font-medium text-[#475467]">
                                        {row.taxPercent}%
                                      </span>
                                    </button>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="inline-flex size-6 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                                          aria-label="Tax breakdown"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Info
                                            className="size-4 shrink-0"
                                            strokeWidth={2}
                                            aria-hidden
                                          />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        align="end"
                                        sideOffset={4}
                                        className={cn(
                                          "z-[210] w-[min(280px,calc(100vw-2rem))] max-w-none text-left",
                                          invoiceDarkTooltipClassName
                                        )}
                                      >
                                        <div className="flex flex-col gap-0.5">
                                          {getLineTaxBreakdown(row).map(
                                            (line, i) => (
                                              <div
                                                key={`${line.name}-${i}`}
                                                className="flex items-start justify-between gap-3 text-sm font-medium leading-5 text-white"
                                              >
                                                <span className="min-w-0 text-white">
                                                  {line.name}: {line.ratePercent}%
                                                </span>
                                                <span className="shrink-0 tabular-nums text-white">
                                                  ${line.amount.toFixed(2)}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                        <TooltipArrow />
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={!hasItemName}
                                    title={
                                      !hasItemName
                                        ? "Select a product before adding tax for this line"
                                        : undefined
                                    }
                                    className={cn(
                                      "text-base font-medium transition-opacity",
                                      hasItemName
                                        ? "text-[#004eeb] hover:opacity-90"
                                        : "cursor-not-allowed text-[#98a2b3]"
                                    )}
                                    onClick={() =>
                                      onRequestAddLineItemTax({
                                        kind: "line",
                                        rowId: row.id,
                                        productName:
                                          row.name.trim() || "Product",
                                        intent: "add",
                                      })
                                    }
                                  >
                                    Add tax
                                  </button>
                                )}
                              </div>
                              <div className="flex h-9 w-[130px] shrink-0 items-center justify-end border-r border-[#d0d5dd] px-3">
                                <span className="text-base font-medium tabular-nums text-[#475467]">
                                  ${rowSub.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex h-9 w-12 shrink-0 items-center justify-center px-1">
                                <DropdownMenu modal={false}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          className={cn(
                                            "box-border inline-flex size-6 items-center justify-center overflow-hidden rounded-[4px] p-1 text-[#667085] outline-none",
                                            "hover:bg-[#f9fafb]",
                                            "focus-visible:bg-[#f9fafb] focus-visible:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_#f2f4f7]",
                                            "data-[state=open]:bg-[#f2f4f7] data-[state=open]:shadow-none"
                                          )}
                                          aria-label={`Actions for ${itemLabel}`}
                                        >
                                          <MoreVertical
                                            className="size-4 shrink-0"
                                            strokeWidth={2}
                                            aria-hidden
                                          />
                                        </button>
                                      </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      sideOffset={4}
                                      className={cn(
                                        "max-w-none text-left",
                                        invoiceDarkTooltipClassName
                                      )}
                                    >
                                      More actions
                                      <TooltipArrow />
                                    </TooltipContent>
                                  </Tooltip>
                                  <DropdownMenuContent
                                    align="end"
                                    sideOffset={4}
                                    className="z-[200] w-max min-w-[240px] max-w-[min(calc(100vw-2rem),320px)] rounded-[4px] border border-[#d0d5dd] bg-white p-1 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.1),0px_2px_4px_-2px_rgba(16,24,40,0.06)]"
                                  >
                                    {row.taxPercent != null ? (
                                      <>
                                        <DropdownMenuItem
                                          className={lineProductRowMenuItemClass}
                                          onSelect={() =>
                                            onRequestAddLineItemTax({
                                              kind: "line",
                                              rowId: row.id,
                                              productName:
                                                row.name.trim() || "Product",
                                              intent: "edit",
                                              initialMode:
                                                row.taxMode ?? "manual",
                                              initialSelectedTaxIds:
                                                row.taxSelectedIds ?? [],
                                            })
                                          }
                                        >
                                          <Pencil
                                            className="size-4 shrink-0 text-[#344054]"
                                            strokeWidth={2}
                                            aria-hidden
                                          />
                                          Edit tax
                                        </DropdownMenuItem>
                                        <div
                                          className="my-1 h-px bg-[#e4e7ec]"
                                          aria-hidden
                                        />
                                      </>
                                    ) : null}
                                    <DropdownMenuItem
                                      className="cursor-pointer gap-2 rounded px-4 py-2 text-base font-medium leading-6 text-[#d92d20] data-[highlighted]:bg-[#f2f4f7] data-[highlighted]:text-[#d92d20]"
                                      onSelect={() => removeProductRow(row.id)}
                                    >
                                      <img
                                        src="/icons/subscriptions/close.svg"
                                        alt=""
                                        width={16}
                                        height={16}
                                        className="size-4 shrink-0"
                                      />
                                      Remove product
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
                <div className="flex flex-col gap-2 overflow-hidden pr-0 sm:pr-12">
                  <CalcSummaryRow
                    label="Subtotal"
                    amount={lineSubtotal.toFixed(2)}
                  />
                  {subscriptionDiscountAdded && !couponBarOpen ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex min-h-6 w-full items-start">
                        <div className="flex min-w-0 flex-1 items-center px-3">
                          <span className="min-w-0 truncate text-base font-normal leading-6 text-[#101828]">
                            Discount ({appliedCouponCode})
                          </span>
                        </div>
                        <CalcCurrencyDiscount amount={appliedDiscountAmount} />
                      </div>
                      <div className="flex min-h-6 w-full items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-1 px-3">
                          <button
                            type="button"
                            className="text-base font-medium text-[#004eeb] transition-opacity hover:opacity-90"
                            onClick={() => {
                              setCouponDraft(appliedCouponCode);
                              setCouponBarOpen(true);
                              window.setTimeout(
                                () => setCouponDropdownOpen(true),
                                0
                              );
                            }}
                          >
                            Change coupon
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded p-1 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#155eef]/30"
                            aria-label="Remove coupon"
                            onClick={clearSubscriptionCoupon}
                          >
                            <img
                              src="/icons/subscriptions/close.svg"
                              alt=""
                              width={20}
                              height={20}
                              className="size-5 shrink-0"
                            />
                          </button>
                        </div>
                        <div
                          className="w-[102px] shrink-0 px-3"
                          aria-hidden
                        />
                      </div>
                    </div>
                  ) : couponBarOpen ? (
                    <div className="flex min-h-6 flex-wrap items-start gap-x-2 gap-y-2 px-3 sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center">
                        <button
                          type="button"
                          className="text-base font-medium leading-6 text-[#00359e] transition-opacity hover:opacity-90"
                          onClick={openCouponMenu}
                        >
                          Apply coupon
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-0.5 sm:justify-end">
                        <DropdownMenu
                          modal={false}
                          open={couponDropdownOpen}
                          onOpenChange={setCouponDropdownOpen}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "inline-flex h-6 w-[200px] shrink-0 items-center justify-between gap-2 rounded border border-[#84adff] bg-white px-2 py-1.5 text-left text-sm font-normal leading-5 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none",
                                figmaFieldFocusTransition,
                                "focus-visible:border-[#84adff] focus-visible:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_0_0_4px_#d1e0ff]",
                                "data-[state=open]:border-[#84adff] data-[state=open]:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_0_0_4px_#d1e0ff]"
                              )}
                              aria-label="Select coupon"
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {couponDraft ?? "Select coupon"}
                              </span>
                              <ChevronDown
                                className="size-3 shrink-0 text-[#667085]"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="z-[200] w-[200px] p-1"
                          >
                            {COUPON_OPTIONS.map((o) => (
                              <DropdownMenuItem
                                key={o.code}
                                className="cursor-pointer text-sm"
                                onSelect={() => setCouponDraft(o.code)}
                              >
                                {o.code}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <button
                          type="button"
                          disabled={!couponDraft}
                          title={
                            !couponDraft
                              ? "Select a coupon from the list first"
                              : undefined
                          }
                          className={cn(
                            "inline-flex size-6 shrink-0 items-center justify-center rounded border bg-white p-1 outline-none transition-[border-color,box-shadow] duration-150",
                            couponDraft
                              ? "border-[#84adff] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] hover:bg-slate-50 focus-visible:border-[#84adff] focus-visible:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_0_0_4px_#d1e0ff]"
                              : "cursor-not-allowed border-[#b2ccff] shadow-none disabled:opacity-100"
                          )}
                          aria-label="Apply selected coupon"
                          onClick={confirmCouponSelection}
                        >
                          <Check
                            className={cn(
                              "size-3.5",
                              couponDraft ? "text-[#155eef]" : "text-[#b2ccff]"
                            )}
                            strokeWidth={2}
                          />
                        </button>
                        <button
                          type="button"
                          className="inline-flex size-6 shrink-0 items-center justify-center rounded border border-[#fda29b] bg-white p-1 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none transition-[border-color,box-shadow] duration-150 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-[#fda29b]/40"
                          aria-label="Dismiss coupon selection"
                          onClick={dismissCouponBar}
                        >
                          <X
                            className="size-3.5 text-[#d92d20]"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-6 w-full items-center">
                      <div className="min-w-0 flex-1 px-3">
                        <button
                          type="button"
                          className="text-base font-medium leading-6 text-[#004eeb] transition-opacity hover:opacity-90 active:text-[#00359e]"
                          onClick={openCouponMenu}
                        >
                          Apply coupon
                        </button>
                      </div>
                      <div
                        className="w-[102px] shrink-0 px-3"
                        aria-hidden
                      />
                    </div>
                  )}
                  {hasLineItemTax ? (
                    <div className="flex flex-col gap-0.5">
                      <CalcSummaryRow
                        label="Taxable subtotal"
                        amount={taxableSubtotal.toFixed(2)}
                      />
                      {taxSummaryLines.map((line) => (
                        <div
                          key={line.key}
                          className="flex min-h-6 w-full items-start"
                        >
                          <div className="flex min-w-0 flex-1 items-center px-3">
                            <span className="min-w-0 text-base font-normal leading-6 text-[#101828]">
                              {line.label}
                            </span>
                          </div>
                          <CalcCurrencyMedium
                            amount={line.amount.toFixed(2)}
                          />
                        </div>
                      ))}
                      <div className="flex min-h-6 w-full items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-0.5 px-3">
                          <button
                            type="button"
                            className="text-base font-medium text-[#004eeb] transition-opacity hover:opacity-90"
                            onClick={() => {
                              if (subscriptionTaxAdded) {
                                onRequestAddLineItemTax({
                                  kind: "subscription",
                                  intent: "edit",
                                });
                              } else {
                                const row = productRows.find(
                                  (r) => r.taxPercent != null
                                );
                                if (!row) return;
                                onRequestAddLineItemTax({
                                  kind: "line",
                                  rowId: row.id,
                                  productName: row.name.trim() || "Product",
                                  intent: "edit",
                                  initialMode: row.taxMode ?? "manual",
                                  initialSelectedTaxIds:
                                    row.taxSelectedIds ?? [],
                                });
                              }
                            }}
                          >
                            Edit tax
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-8 shrink-0 items-center justify-center rounded p-1 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#155eef]/30"
                            aria-label="Remove tax"
                            onClick={clearSubscriptionTax}
                          >
                            <img
                              src="/icons/subscriptions/close.svg"
                              alt=""
                              width={20}
                              height={20}
                              className="size-5 shrink-0"
                            />
                          </button>
                        </div>
                        <div
                          className="w-[102px] shrink-0 px-3"
                          aria-hidden
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-6 w-full items-center">
                      <div className="min-w-0 flex-1 px-3">
                        <button
                          type="button"
                          className="text-base font-medium leading-6 text-[#004eeb] transition-opacity hover:opacity-90"
                          onClick={() =>
                            onRequestAddLineItemTax({
                              kind: "subscription",
                              intent: "add",
                            })
                          }
                        >
                          Add tax
                        </button>
                      </div>
                      <div
                        className="w-[102px] shrink-0 px-3"
                        aria-hidden
                      />
                    </div>
                  )}
                  <div className="px-3 py-1">
                    <Separator className="h-px bg-[#eaecf0]" />
                  </div>
                  <CalcSummaryRow
                    label="Amount due (in USD)"
                    amount={amountDue.toFixed(2)}
                  />
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-2 pr-0 sm:pr-12">
                  <CalcSummaryRow label="Subtotal" amount="0.00" />
                  <div className="flex min-h-6 w-full items-center">
                    <div className="min-w-0 flex-1 px-3">
                      <button
                        type="button"
                        disabled
                        title="Add at least one product before applying a coupon"
                        className="cursor-not-allowed text-base font-medium leading-6 text-[#98a2b3]"
                      >
                        Apply coupon
                      </button>
                    </div>
                    <div
                      className="w-[102px] shrink-0 px-3"
                      aria-hidden
                    />
                  </div>
                  <div className="flex min-h-6 w-full items-center">
                    <div className="min-w-0 flex-1 px-3">
                      <button
                        type="button"
                        disabled
                        title="Add at least one product before adding tax"
                        className="cursor-not-allowed text-base font-medium leading-6 text-[#98a2b3]"
                      >
                        Add tax
                      </button>
                    </div>
                    <div
                      className="w-[102px] shrink-0 px-3"
                      aria-hidden
                    />
                  </div>
                  <div className="px-3 py-1">
                    <Separator className="h-px bg-[#eaecf0]" />
                  </div>
                  <CalcSummaryRow
                    label="Amount due (in USD)"
                    amount="0.00"
                  />
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
              <div className="mt-6 flex flex-col gap-6">
                <div className="flex items-start gap-1">
                  <SwitchToggle
                    pressed={setFrequency}
                    onPressedChange={(next) => {
                      setSetFrequency(next);
                      if (!next) {
                        const t = startOfToday();
                        setFrequencyStartDate(t);
                        setFrequencyEndDate(t);
                        setTrialDays(12);
                      }
                    }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <span className="text-base leading-6 text-[#101828]">
                      Set frequency
                    </span>
                    {setFrequency ? (
                      <div className="flex w-full min-w-0 flex-col gap-2">
                        <div className="flex flex-wrap items-end gap-4">
                        <div className="w-full min-w-[180px] flex-1 space-y-1 sm:w-[180px] sm:flex-none">
                          <label
                            htmlFor={frequencyStartDateId}
                            className="flex gap-1 text-base font-medium leading-6 text-[#101828]"
                          >
                            <span>Start date</span>
                            <span className="text-[#d92d20]">*</span>
                          </label>
                          <FigmaDatePickerField
                            value={frequencyStartDate}
                            onChange={setFrequencyStartDate}
                            id={frequencyStartDateId}
                            aria-label="Frequency start date"
                            invalid={frequencyDateRangeInvalid}
                          />
                        </div>
                        <div className="w-full min-w-[180px] flex-1 space-y-1 sm:w-[180px] sm:flex-none">
                          <label
                            htmlFor={frequencyEndDateId}
                            className="flex gap-1 text-base font-medium leading-6 text-[#101828]"
                          >
                            <span>End date</span>
                            <span className="text-[#d92d20]">*</span>
                          </label>
                          <FigmaDatePickerField
                            value={frequencyEndDate}
                            onChange={setFrequencyEndDate}
                            id={frequencyEndDateId}
                            aria-label="Frequency end date"
                            invalid={frequencyDateRangeInvalid}
                          />
                        </div>
                        <div className="flex w-full min-w-[200px] flex-col gap-1 sm:w-[200px]">
                          <label
                            id={trialDaysLabelId}
                            htmlFor={trialDaysInputId}
                            className="flex gap-1 text-base font-medium leading-6 text-[#101828]"
                          >
                            <span>Trial days</span>
                            <span className="text-[#d92d20]">*</span>
                          </label>
                          {/* Stepper: − / value / + inside field shell. */}
                          <div
                            role="group"
                            aria-labelledby={trialDaysLabelId}
                            className={cn(
                              "flex h-9 w-full min-w-0 items-center gap-1 rounded border border-[#d0d5dd] bg-white px-1.5 text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                              figmaFieldFocusWithin
                            )}
                          >
                            <button
                              type="button"
                              aria-label="Decrease trial days"
                              disabled={trialDays <= TRIAL_DAYS_MIN}
                              onClick={() =>
                                setTrialDays((d) =>
                                  clampTrialDays(d - 1)
                                )
                              }
                              className="inline-flex size-7 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                              <Minus
                                className="size-4 shrink-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </button>
                            <input
                              id={trialDaysInputId}
                              type="number"
                              min={TRIAL_DAYS_MIN}
                              max={TRIAL_DAYS_MAX}
                              step={1}
                              inputMode="numeric"
                              autoComplete="off"
                              className={cn(
                                "min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-base font-normal leading-6 text-[#101828] tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                                figmaFieldInnerInput
                              )}
                              value={trialDays}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                  setTrialDays(TRIAL_DAYS_MIN);
                                  return;
                                }
                                const n = parseInt(raw, 10);
                                if (Number.isNaN(n)) return;
                                setTrialDays(clampTrialDays(n));
                              }}
                            />
                            <button
                              type="button"
                              aria-label="Increase trial days"
                              disabled={trialDays >= TRIAL_DAYS_MAX}
                              onClick={() =>
                                setTrialDays((d) =>
                                  clampTrialDays(d + 1)
                                )
                              }
                              className="inline-flex size-7 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-[#f2f4f7] focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                              <Plus
                                className="size-4 shrink-0"
                                strokeWidth={2}
                                aria-hidden
                              />
                            </button>
                          </div>
                        </div>
                        </div>
                      {frequencyDateRangeInvalid ? (
                        <p
                          role="alert"
                          className="text-sm font-medium leading-5 text-[#d92d20]"
                        >
                          End date must be on or after the start date.
                        </p>
                      ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                  <SwitchToggle
                    pressed={taxId}
                    onPressedChange={(next) => {
                      setTaxId(next);
                      if (!next) setBusinessTaxId("");
                    }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-base leading-6 text-[#101828]">
                      Business identification number or tax ID
                    </span>
                    {taxId ? (
                      <input
                        id={businessTaxIdInputId}
                        type="text"
                        value={businessTaxId}
                        onChange={(e) => setBusinessTaxId(e.target.value)}
                        placeholder="Enter identification number"
                        autoComplete="off"
                        className={cn(
                          "h-9 w-full max-w-[280px] rounded border border-[#d0d5dd] bg-white px-2 text-base font-normal leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] placeholder:text-[#667085]",
                          figmaFieldFocusVisible
                        )}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Payment — Pay via cards only; 24px top spacing only */}
          <div className="pt-6">
            <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="text-base font-semibold leading-6 text-[#101828]">
                        Pay via cards
                      </p>
                      {savedPaymentCards.length > 0 ? (
                        <span
                          className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center align-middle rounded-[4px] bg-[#f2f4f7] px-2 text-sm font-medium leading-5 text-[#344054] tabular-nums"
                          aria-label={`${savedPaymentCards.length} saved ${savedPaymentCards.length === 1 ? "card" : "cards"}`}
                          aria-live="polite"
                        >
                          {savedPaymentCards.length}
                        </span>
                      ) : null}
                    </div>
                    {hasLineItems || savedPaymentCards.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onRequestAddPaymentCard?.()}
                        className="inline-flex items-center gap-2 text-base font-medium leading-6 text-[#004eeb] outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                      >
                        <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                        Add new card
                      </button>
                    ) : null}
                  </div>

                  {savedPaymentCards.length > 0 ? (
                    <div
                      className="flex flex-col gap-2"
                      role="radiogroup"
                      aria-label="Saved payment cards"
                    >
                      {savedPaymentCards.map((card) => {
                        const isSelected = selectedPaymentCardId === card.id;
                        const isJustAdded = lastAddedPaymentCardId === card.id;
                        return (
                          <button
                            key={card.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            data-payment-card-id={card.id}
                            onClick={() => setSelectedPaymentCardId(card.id)}
                            className={cn(
                              "flex w-full items-center gap-2 rounded border border-solid px-3 py-2 text-left outline-none transition-[box-shadow,border-color] duration-200 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30",
                              isJustAdded &&
                                "animate-in fade-in zoom-in-95 duration-300",
                              isSelected
                                ? "border-[#155eef] bg-white"
                                : "border-[#eaecf0] bg-white",
                              isJustAdded &&
                                "ring-2 ring-[#155eef]/35 ring-offset-2 ring-offset-white"
                            )}
                          >
                            <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded border border-[#eaecf0] bg-white text-xs font-semibold text-[#344054]">
                              {brandBadgeLabel(card.brand)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-base font-medium leading-6 text-[#101828]">
                                {card.title}
                              </p>
                              <p className="text-sm leading-5 text-[#475467]">
                                {card.subtitle}
                              </p>
                            </div>
                            <span
                              className={cn(
                                "flex size-4 shrink-0 items-center justify-center rounded-[8px] border",
                                isSelected
                                  ? "border-[#155eef] bg-[#155eef]"
                                  : "border-[#98a2b3] bg-white"
                              )}
                              aria-hidden
                            >
                              {isSelected ? (
                                <Check className="size-3 text-white" strokeWidth={3} />
                              ) : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex w-full flex-col items-center rounded border-[0.5px] border-[#d0d5dd] bg-white p-4">
                      <div className="flex w-full flex-col items-center gap-2">
                        <div className="flex size-[120px] shrink-0 items-center justify-center">
                          <img
                            src="/icons/empty-state-payment-cards.svg"
                            alt=""
                            width={120}
                            height={120}
                            className="size-[120px] object-contain"
                            aria-hidden
                          />
                        </div>
                        <div className="flex w-full max-w-[404px] flex-col items-center gap-1 text-center">
                          <p className="text-base font-semibold leading-6 text-[#101828]">
                            No cards found
                          </p>
                          <p className="text-sm font-normal leading-5 text-[#475467]">
                            Save your first payment card here for quicker payments later.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRequestAddPaymentCard?.()}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#d0d5dd] bg-white px-3.5 py-2 text-base font-semibold leading-6 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30"
                        >
                          <Plus className="size-5 shrink-0" strokeWidth={2} aria-hidden />
                          Add customer&apos;s card
                        </button>
                      </div>
                    </div>
                  )}
            </div>
          </div>
        </div>
        </TooltipProvider>

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
                  if (!displayCustomer) return;
                  const id =
                    typeof crypto !== "undefined" && crypto.randomUUID
                      ? `sub-${crypto.randomUUID()}`
                      : `sub-${Date.now()}`;
                  const row = buildSubscriptionRowFromCreateModal({
                    id,
                    customerName: displayCustomer.name,
                    customerAvatarBg: displayCustomer.avatarBg,
                    productNames: productRows.map((r) => r.name),
                    amount: amountDue,
                    paymentMode,
                  });
                  onSubscriptionCreated?.(row);
                  showSuccess(
                    subscriptionCreatedSuccessMessage({
                      customerName: displayCustomer.name,
                      productNames: productRows.map((r) => r.name),
                    })
                  );
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
