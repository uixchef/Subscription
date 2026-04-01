"use client";

import { AlertCircle, Check, ChevronDown, Mail, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HUB_TOAST_DURATION_MS,
  HubAlertToast,
  MODAL_OVERLAY_TOAST_TOP_PX,
} from "@/components/payment-hub/hub-toast";
import {
  COUNTRIES,
  countryFlagEmoji,
  normalizeCountryName,
  statesForCountry,
} from "@/components/subscriptions/country-state-data";
import {
  figmaFieldFocusVisible,
  figmaFieldFocusWithin,
  figmaFieldInnerInput,
} from "@/components/subscriptions/figma-field-focus";
import { validatePostalForLocation } from "@/components/subscriptions/postal-validation";
import {
  POSTAL_MSG_FORMAT,
  POSTAL_MSG_NOT_FOUND,
  POSTAL_MSG_REGION_MISMATCH,
  POSTAL_MSG_REQUIRED,
} from "@/components/subscriptions/postal-validation-messages";
import {
  inferLocationFromZip,
  zipLooksCompleteForInference,
} from "@/components/subscriptions/zip-to-location";
import {
  PHONE_DIAL_OPTIONS,
  parsePhoneToDialAndNational,
  resolvePhoneDialOption,
  type PhoneDialOption,
} from "@/components/subscriptions/phone-field";
import { cn } from "@/lib/utils";

export type CustomerFormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  zip: string;
};

/** Default form for “Add customer” — all fields empty. */
export const EMPTY_CUSTOMER_FORM_VALUES: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  state: "",
  city: "",
  zip: "",
};

const inputShell = cn(
  "h-9 w-full rounded border border-[#d0d5dd] bg-white px-2 text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] placeholder:text-[#667085]",
  figmaFieldFocusVisible
);

const labelClass = "flex gap-1 text-base font-medium leading-6 text-[#101828]";

/** Country/state searchable pickers; Popover sets `--radix-popover-trigger-width`. */
const searchablePopoverSurfaceClass = cn(
  "z-[250] flex max-h-[min(60vh,420px)] min-h-0 w-[min(360px,calc(100vw-1.5rem))] min-w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden p-0",
  "rounded border border-[#d0d5dd] bg-white shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]"
);

type EditCustomerInformationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `add` — title “Add customer”, empty-field placeholders; `edit` — existing copy. */
  variant?: "edit" | "add";
  initialValues: CustomerFormValues;
  onSave: (values: CustomerFormValues) => void;
};

export function EditCustomerInformationModal({
  open,
  onOpenChange,
  variant = "edit",
  initialValues,
  onSave,
}: EditCustomerInformationModalProps) {
  const isAdd = variant === "add";
  const formId = useId();
  const zipFieldErrorId = useId();
  const [form, setForm] = useState<CustomerFormValues>(initialValues);
  const [zipFieldError, setZipFieldError] = useState<string | null>(null);
  const [errorToastMessage, setErrorToastMessage] = useState<string | null>(
    null
  );
  const [postalCheckPending, setPostalCheckPending] = useState(false);
  const [toastPortalReady, setToastPortalReady] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryCmdKey, setCountryCmdKey] = useState(0);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [stateCmdKey, setStateCmdKey] = useState(0);
  const [phoneDialIso2, setPhoneDialIso2] = useState<string | null>(null);
  const [phoneDialPickerOpen, setPhoneDialPickerOpen] = useState(false);
  const [phoneDialCmdKey, setPhoneDialCmdKey] = useState(0);
  const errorToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const formRef = useRef(form);
  formRef.current = form;
  const zipInferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setPostalCheckPending(false);
      setErrorToastMessage(null);
      setCountryPickerOpen(false);
      setStatePickerOpen(false);
      setPhoneDialPickerOpen(false);
      setZipFieldError(null);
      if (errorToastTimerRef.current) {
        clearTimeout(errorToastTimerRef.current);
        errorToastTimerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    if (!form.country) setStatePickerOpen(false);
  }, [form.country]);

  useEffect(() => {
    setErrorToastMessage(null);
    setZipFieldError(null);
  }, [form.zip, form.country, form.state]);

  useEffect(() => {
    if (!errorToastMessage) return;
    errorToastTimerRef.current = setTimeout(() => {
      errorToastTimerRef.current = null;
      setErrorToastMessage(null);
    }, HUB_TOAST_DURATION_MS);
    return () => {
      if (errorToastTimerRef.current) {
        clearTimeout(errorToastTimerRef.current);
        errorToastTimerRef.current = null;
      }
    };
  }, [errorToastMessage]);

  useEffect(() => {
    setToastPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const country = normalizeCountryName(initialValues.country);
    const iso2 = COUNTRIES.find((c) => c.name === country)?.code;
    const states = statesForCountry(country, iso2);
    let state = initialValues.state;
    if (states.length > 0 && !states.includes(state)) {
      state = states[0] ?? "";
    }
    setForm({ ...initialValues, country, state });
  }, [open, initialValues]);

  /** Zip-first: when country is still empty, infer US/CA/territory from a complete postal code (debounced). */
  useEffect(() => {
    if (!open) return;
    if (form.country) {
      if (zipInferTimerRef.current) {
        clearTimeout(zipInferTimerRef.current);
        zipInferTimerRef.current = null;
      }
      return;
    }
    const raw = form.zip;
    if (!zipLooksCompleteForInference(raw)) {
      if (zipInferTimerRef.current) {
        clearTimeout(zipInferTimerRef.current);
        zipInferTimerRef.current = null;
      }
      return;
    }
    if (zipInferTimerRef.current) clearTimeout(zipInferTimerRef.current);
    zipInferTimerRef.current = setTimeout(() => {
      zipInferTimerRef.current = null;
      const f = formRef.current;
      if (f.country) return;
      const trimmed = f.zip.trim();
      if (!zipLooksCompleteForInference(f.zip)) return;
      const inferred = inferLocationFromZip(trimmed);
      if (inferred.kind === "match") {
        setForm((prev) => ({
          ...prev,
          country: inferred.countryName,
          state: inferred.state,
          zip: inferred.normalizedZip,
        }));
        setZipFieldError(null);
      } else if (inferred.kind === "bad_format" || inferred.kind === "not_found") {
        setZipFieldError(
          inferred.kind === "bad_format"
            ? POSTAL_MSG_FORMAT
            : POSTAL_MSG_NOT_FOUND
        );
      }
    }, 420);
    return () => {
      if (zipInferTimerRef.current) {
        clearTimeout(zipInferTimerRef.current);
        zipInferTimerRef.current = null;
      }
    };
  }, [open, form.zip, form.country]);

  const update = <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const phoneParts = useMemo(
    () => parsePhoneToDialAndNational(form.phone),
    [form.phone]
  );

  useEffect(() => {
    const parts = parsePhoneToDialAndNational(form.phone);
    const candidates = PHONE_DIAL_OPTIONS.filter((o) => o.dial === parts.dial);
    if (candidates.length === 0) {
      setPhoneDialIso2(null);
      return;
    }
    if (candidates.length === 1) {
      setPhoneDialIso2(candidates[0].iso2);
      return;
    }
    setPhoneDialIso2((prev) => {
      if (prev && candidates.some((c) => c.iso2 === prev)) return prev;
      if (parts.dial === "+1") {
        const us = candidates.find((c) => c.iso2 === "US");
        if (us) return "US";
      }
      return candidates[0].iso2;
    });
  }, [form.phone]);

  const phoneDialOption = useMemo(
    () => resolvePhoneDialOption(phoneParts.dial, phoneDialIso2),
    [phoneParts.dial, phoneDialIso2]
  );

  const applyPhoneDialOption = (opt: PhoneDialOption) => {
    setPhoneDialIso2(opt.iso2);
    update("phone", opt.dial + phoneParts.national);
  };

  const setPhoneNational = (nationalDigits: string) => {
    const digits = nationalDigits.replace(/\D/g, "");
    update("phone", phoneParts.dial + digits);
  };

  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.name === form.country),
    [form.country]
  );

  const stateOptions = useMemo(
    () => statesForCountry(form.country, selectedCountry?.code),
    [form.country, selectedCountry?.code]
  );

  /** Name, country, zip (required *); state when the country has regions. */
  const mandatoryFieldsComplete = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!selectedCountry) return false;
    if (!form.zip.trim()) return false;
    if (stateOptions.length > 0 && !form.state.trim()) return false;
    return true;
  }, [
    form.name,
    form.zip,
    form.state,
    selectedCountry,
    stateOptions.length,
  ]);

  /** Allow Save when country/state can be filled from a US/CA postal before country is chosen. */
  const zipFirstCanSubmit = useMemo(() => {
    if (!form.name.trim() || !form.zip.trim() || form.country) return false;
    return inferLocationFromZip(form.zip.trim()).kind === "match";
  }, [form.name, form.zip, form.country]);

  const canSubmitForm = mandatoryFieldsComplete || zipFirstCanSubmit;

  const applyCountry = (countryName: string) => {
    setForm((f) => {
      const iso2 = COUNTRIES.find((c) => c.name === countryName)?.code;
      const nextStates = statesForCountry(countryName, iso2);
      const nextState =
        nextStates.length > 0
          ? nextStates.includes(f.state)
            ? f.state
            : (nextStates[0] ?? "")
          : "";
      return { ...f, country: countryName, state: nextState };
    });
  };

  const handleZipBlur = async () => {
    const trimmed = form.zip.trim();
    if (!trimmed) {
      setZipFieldError(null);
      return;
    }

    const inferred = inferLocationFromZip(trimmed);

    if (inferred.kind === "bad_format") {
      setZipFieldError(POSTAL_MSG_FORMAT);
      return;
    }

    if (inferred.kind === "not_found") {
      setZipFieldError(POSTAL_MSG_NOT_FOUND);
      return;
    }

    if (inferred.kind === "match") {
      const current = selectedCountry;
      if (!current) {
        setForm((f) => ({
          ...f,
          country: inferred.countryName,
          state: inferred.state,
          zip: inferred.normalizedZip,
        }));
        setZipFieldError(null);
        return;
      }
      if (current.code !== inferred.iso2) {
        setZipFieldError(POSTAL_MSG_REGION_MISMATCH);
        return;
      }
      setForm((f) => ({
        ...f,
        state: inferred.state,
        zip: inferred.normalizedZip,
      }));
      setZipFieldError(null);
      return;
    }

    if (!selectedCountry) {
      setZipFieldError(null);
      return;
    }

    setPostalCheckPending(true);
    try {
      const postal = await validatePostalForLocation({
        countryCode: selectedCountry.code,
        state: form.state,
        zip: trimmed,
      });
      setZipFieldError(postal.ok ? null : postal.message);
    } finally {
      setPostalCheckPending(false);
    }
  };

  const showModalOverlayToast =
    toastPortalReady && open && Boolean(errorToastMessage);

  return (
    <>
      {showModalOverlayToast
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-x-0 z-[250] flex justify-center px-4"
              style={{ top: MODAL_OVERLAY_TOAST_TOP_PX }}
              aria-live="assertive"
            >
              <div className="pointer-events-auto w-full max-w-[min(478px,calc(100vw-2rem))]">
                <HubAlertToast
                  variant="error"
                  message={errorToastMessage ?? ""}
                  className="w-full max-w-none"
                  onDismiss={() => {
                    setErrorToastMessage(null);
                    if (errorToastTimerRef.current) {
                      clearTimeout(errorToastTimerRef.current);
                      errorToastTimerRef.current = null;
                    }
                  }}
                />
              </div>
            </div>,
            document.body
          )
        : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[200] flex max-h-[min(90vh,calc(100vh-2rem))] w-full max-w-[min(576px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden border border-[#f2f4f7] bg-white p-0 shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)] sm:max-w-[min(576px,calc(100vw-2rem))] sm:rounded-lg">
        <div className="flex shrink-0 flex-col px-4 pt-4">
          <div className="flex w-full items-start gap-2">
            <div className="flex min-w-0 flex-1 items-center">
              <DialogTitle className="text-base font-semibold leading-6 text-[#101828]">
                {isAdd ? "Add customer" : "Edit customer information"}
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
          onSubmit={async (e) => {
            e.preventDefault();
            if (postalCheckPending) return;
            if (!canSubmitForm) return;
            if (!form.name.trim()) return;

            const trimmedZip = form.zip.trim();
            if (!trimmedZip) {
              setZipFieldError(POSTAL_MSG_REQUIRED);
              return;
            }

            let workingCountry = form.country;
            let workingState = form.state;
            let workingZip = trimmedZip;

            if (!workingCountry) {
              const inferred = inferLocationFromZip(trimmedZip);
              if (inferred.kind === "match") {
                workingCountry = inferred.countryName;
                workingState = inferred.state;
                workingZip = inferred.normalizedZip;
                setForm((prev) => ({
                  ...prev,
                  country: workingCountry,
                  state: workingState,
                  zip: workingZip,
                }));
              } else if (
                inferred.kind === "bad_format" ||
                inferred.kind === "not_found"
              ) {
                setZipFieldError(
                  inferred.kind === "bad_format"
                    ? POSTAL_MSG_FORMAT
                    : POSTAL_MSG_NOT_FOUND
                );
                return;
              } else {
                return;
              }
            }

            const sel = COUNTRIES.find((c) => c.name === workingCountry);
            if (!sel) return;
            const regions = statesForCountry(workingCountry, sel.code);
            if (regions.length > 0 && !workingState.trim()) return;

            setPostalCheckPending(true);
            try {
              const postal = await validatePostalForLocation({
                countryCode: sel.code,
                state: workingState,
                zip: workingZip,
              });
              if (!postal.ok) {
                setZipFieldError(postal.message);
                return;
              }
              setZipFieldError(null);
              onSave({
                ...form,
                country: workingCountry,
                state: workingState,
                zip: workingZip,
              });
            } finally {
              setPostalCheckPending(false);
            }
          }}
        >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-col gap-1">
              <div className={labelClass}>
                <span>Customer name</span>
                <span className="text-[#d92d20]">*</span>
              </div>
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputShell}
                autoComplete="name"
                placeholder={isAdd ? "Full name" : undefined}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>Email</span>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-full min-w-0 items-center gap-2 rounded border border-[#d0d5dd] bg-white px-2 text-base leading-6 text-[#101828] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                    figmaFieldFocusWithin
                  )}
                >
                  <Mail
                    className="size-4 shrink-0 text-[#344054]"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className={cn(
                      "min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-6 text-[#101828] placeholder:text-[#667085]",
                      figmaFieldInnerInput
                    )}
                    autoComplete="email"
                    placeholder={isAdd ? "name@company.com" : undefined}
                  />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>Phone number</span>
                </div>
                <div
                  className={cn(
                    "flex h-9 min-w-0 items-stretch overflow-hidden rounded border border-[#d0d5dd] bg-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                    figmaFieldFocusWithin
                  )}
                >
                  <Popover
                    modal={false}
                    open={phoneDialPickerOpen}
                    onOpenChange={(next) => {
                      setPhoneDialPickerOpen(next);
                      if (next) {
                        setCountryPickerOpen(false);
                        setStatePickerOpen(false);
                        setPhoneDialCmdKey((k) => k + 1);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "group flex h-full w-[120px] shrink-0 items-center gap-1.5 border-r border-[#d0d5dd] py-2 pl-2.5 pr-1.5 text-[#101828] outline-none",
                          figmaFieldInnerInput
                        )}
                        aria-label={`Country calling code, ${phoneDialOption.label}`}
                        aria-expanded={phoneDialPickerOpen}
                        aria-haspopup="listbox"
                      >
                        <span
                          className="flex size-5 shrink-0 items-center justify-center text-[15px] leading-none"
                          aria-hidden
                        >
                          {phoneDialOption.flag}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-left text-base font-normal leading-6">
                          {phoneDialOption.label}
                        </span>
                        <ChevronDown
                          className="size-4 shrink-0 text-[#344054] transition-transform duration-200 group-data-[state=open]:rotate-180"
                          strokeWidth={2}
                          aria-hidden
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={4}
                      collisionPadding={12}
                      className={cn(searchablePopoverSurfaceClass, "p-0")}
                    >
                      <Command
                        key={phoneDialCmdKey}
                        shouldFilter
                        className="flex max-h-[min(60vh,420px)] min-h-0 flex-col overflow-hidden rounded-none bg-transparent shadow-none [&_[cmdk-input-wrapper]]:shrink-0"
                      >
                        <CommandInput
                          placeholder="Search country or code…"
                          aria-label="Search country calling codes"
                        />
                        <CommandList>
                          <CommandEmpty>No country code found.</CommandEmpty>
                          {PHONE_DIAL_OPTIONS.map((opt) => (
                            <CommandItem
                              key={`${opt.iso2}-${opt.dial}`}
                              value={`${opt.name} ${opt.label} ${opt.iso2} ${opt.dial}`}
                              onSelect={() => {
                                applyPhoneDialOption(opt);
                                setPhoneDialPickerOpen(false);
                              }}
                            >
                              <span
                                className="flex size-8 shrink-0 items-center justify-center text-lg leading-none"
                                aria-hidden
                              >
                                {opt.flag}
                              </span>
                              <span className="min-w-0 flex-1">{opt.label}</span>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <input
                    value={phoneParts.national}
                    onChange={(e) => setPhoneNational(e.target.value)}
                    className={cn(
                      "min-h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-base leading-6 text-[#101828] placeholder:text-[#667085]",
                      figmaFieldInnerInput
                    )}
                    inputMode="tel"
                    autoComplete="tel-national"
                    aria-label="Phone number"
                    placeholder={isAdd ? "Phone number" : undefined}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className={labelClass}>
                <span>Address</span>
              </div>
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className={inputShell}
                autoComplete="street-address"
                placeholder={isAdd ? "Street address, apt, suite, unit" : undefined}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>Country</span>
                  <span className="text-[#d92d20]">*</span>
                </div>
                <Popover
                  modal={false}
                  open={countryPickerOpen}
                  onOpenChange={(next) => {
                    setCountryPickerOpen(next);
                    if (next) {
                      setStatePickerOpen(false);
                      setPhoneDialPickerOpen(false);
                      setCountryCmdKey((k) => k + 1);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "group flex h-9 w-full min-h-9 items-center justify-between gap-2 rounded border border-[#d0d5dd] bg-white p-2 text-left text-base leading-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                        figmaFieldFocusVisible,
                        "data-[state=open]:border-[#84adff] data-[state=open]:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_#d1e0ff]",
                        selectedCountry ? "text-[#101828]" : "text-[#475467]"
                      )}
                      aria-label="Country"
                      aria-expanded={countryPickerOpen}
                      aria-haspopup="listbox"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        {selectedCountry ? (
                          <span
                            className="flex size-8 shrink-0 items-center justify-center text-lg leading-none"
                            aria-hidden
                          >
                            {countryFlagEmoji(selectedCountry.code)}
                          </span>
                        ) : null}
                        <span className="min-w-0 truncate">
                          {selectedCountry?.name ?? "Select country"}
                        </span>
                      </span>
                      <ChevronDown
                        className="size-4 shrink-0 text-[#344054] transition-transform duration-200 group-data-[state=open]:rotate-180"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    collisionPadding={12}
                    className={cn(searchablePopoverSurfaceClass, "p-0")}
                  >
                    <Command
                      key={countryCmdKey}
                      shouldFilter
                      className="flex max-h-[min(60vh,420px)] min-h-0 flex-col overflow-hidden rounded-none bg-transparent shadow-none [&_[cmdk-input-wrapper]]:shrink-0"
                    >
                      <CommandInput
                        placeholder="Search country or code…"
                        aria-label="Search countries"
                      />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        {COUNTRIES.map((c) => {
                          const isCountrySelected =
                            selectedCountry?.code === c.code;
                          return (
                            <CommandItem
                              key={c.code}
                              value={`${c.name} ${c.code}`}
                              isActiveChoice={isCountrySelected}
                              onSelect={() => {
                                applyCountry(c.name);
                                setCountryPickerOpen(false);
                              }}
                            >
                              <span
                                className="flex size-8 shrink-0 items-center justify-center text-lg leading-none"
                                aria-hidden
                              >
                                {countryFlagEmoji(c.code)}
                              </span>
                              <span
                                className={cn(
                                  "min-w-0 flex-1",
                                  isCountrySelected && "font-medium"
                                )}
                              >
                                {c.name}
                              </span>
                              {isCountrySelected ? (
                                <Check
                                  className="size-4 shrink-0 text-[#155eef]"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                              ) : null}
                            </CommandItem>
                          );
                        })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>State</span>
                </div>
                <Popover
                  modal={false}
                  open={Boolean(selectedCountry) && statePickerOpen}
                  onOpenChange={(next) => {
                    if (!selectedCountry) return;
                    setStatePickerOpen(next);
                    if (next) {
                      setCountryPickerOpen(false);
                      setPhoneDialPickerOpen(false);
                      setStateCmdKey((k) => k + 1);
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!selectedCountry}
                      className={cn(
                        "group flex h-9 w-full min-h-9 items-center justify-between gap-2 rounded border border-[#d0d5dd] bg-white p-2 text-left text-base leading-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]",
                        figmaFieldFocusVisible,
                        "data-[state=open]:border-[#84adff] data-[state=open]:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_#d1e0ff]",
                        form.state ? "text-[#101828]" : "text-[#475467]",
                        !selectedCountry && "cursor-not-allowed opacity-60"
                      )}
                      aria-label="State or region"
                      aria-expanded={Boolean(selectedCountry) && statePickerOpen}
                      aria-haspopup="listbox"
                    >
                      <span className="min-w-0 truncate">
                        {!selectedCountry
                          ? "Select country first"
                          : form.state || "Select state"}
                      </span>
                      <ChevronDown
                        className="size-4 shrink-0 text-[#344054] transition-transform duration-200 group-data-[state=open]:rotate-180"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </button>
                  </PopoverTrigger>
                  {selectedCountry ? (
                    <PopoverContent
                      align="start"
                      sideOffset={4}
                      collisionPadding={12}
                      className={cn(searchablePopoverSurfaceClass, "p-0")}
                    >
                      <Command
                        key={stateCmdKey}
                        shouldFilter
                        className="flex max-h-[min(60vh,420px)] min-h-0 flex-col overflow-hidden rounded-none bg-transparent shadow-none [&_[cmdk-input-wrapper]]:shrink-0"
                      >
                        <CommandInput
                          placeholder="Search state or region…"
                          aria-label="Search states"
                        />
                        <CommandList>
                          <CommandEmpty>No state found.</CommandEmpty>
                          {stateOptions.map((s) => {
                            const isStateSelected = s === form.state;
                            return (
                              <CommandItem
                                key={s}
                                value={s}
                                isActiveChoice={isStateSelected}
                                onSelect={() => {
                                  update("state", s);
                                  setStatePickerOpen(false);
                                }}
                              >
                                <span
                                  className={cn(
                                    "min-w-0 flex-1",
                                    isStateSelected && "font-medium"
                                  )}
                                >
                                  {s}
                                </span>
                                {isStateSelected ? (
                                  <Check
                                    className="size-4 shrink-0 text-[#155eef]"
                                    strokeWidth={2}
                                    aria-hidden
                                  />
                                ) : null}
                              </CommandItem>
                            );
                          })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  ) : null}
                </Popover>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>City</span>
                </div>
                <input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className={inputShell}
                  autoComplete="address-level2"
                  placeholder={isAdd ? "City or town" : undefined}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className={labelClass}>
                  <span>Zip code</span>
                  <span className="text-[#d92d20]">*</span>
                </div>
                <input
                  required
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  onBlur={() => {
                    void handleZipBlur();
                  }}
                  className={cn(
                    inputShell,
                    zipFieldError &&
                      "border-[#fda29b] focus-visible:border-[#f04438] focus-visible:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_rgba(240,68,56,0.15)]"
                  )}
                  autoComplete="postal-code"
                  aria-invalid={Boolean(zipFieldError)}
                  aria-describedby={
                    zipFieldError ? zipFieldErrorId : undefined
                  }
                  placeholder={isAdd ? "Postal or ZIP code" : undefined}
                />
                {zipFieldError ? (
                  <p
                    id={zipFieldErrorId}
                    role="alert"
                    className="flex items-start gap-1.5 text-sm font-normal leading-5 text-[#b42318]"
                  >
                    <AlertCircle
                      className="mt-0.5 size-4 shrink-0"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <span>{zipFieldError}</span>
                  </p>
                ) : null}
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
                disabled={postalCheckPending || !canSubmitForm}
                className="inline-flex items-center justify-center rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold leading-6 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-[#004eeb] focus-visible:ring-2 focus-visible:ring-[#004eeb]/30 disabled:pointer-events-none disabled:opacity-50"
              >
                {isAdd ? "Add customer" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
