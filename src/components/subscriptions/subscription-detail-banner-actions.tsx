"use client";

import { ChevronDown, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  AddLineItemTaxModal,
  type TaxMode,
} from "@/components/subscriptions/add-line-item-tax-modal";
import { CreateSubscriptionModal } from "@/components/subscriptions/create-subscription-modal";
import {
  buildCustomerProfileFromForm,
  CUSTOMER_DEMO_PROFILES,
  type CustomerDemoProfile,
} from "@/components/subscriptions/customer-demo-data";
import {
  loadCustomerDirectoryFromStorage,
  saveCustomerDirectoryToStorage,
} from "@/components/subscriptions/customer-directory-storage";
import {
  EditCustomerInformationModal,
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
} from "@/components/subscriptions/edit-customer-information-modal";
import { CancelSubscriptionModal } from "@/components/subscriptions/cancel-subscription-modal";
import { PauseNotificationModal } from "@/components/subscriptions/pause-notification-modal";
import {
  PAUSE_SUBSCRIPTION_ERROR_MESSAGE,
  type PauseConfirmPayload,
  pauseSubscriptionRequest,
  pauseSubscriptionSuccessMessage,
} from "@/components/subscriptions/pause-subscription-messages";
import { ResumeSubscriptionModal } from "@/components/subscriptions/resume-subscription-modal";
import { useHubToast } from "@/components/payment-hub/hub-toast";
import type {
  SubscriptionRow,
  SubscriptionStatus,
} from "@/components/subscriptions/subscription-row-model";
import {
  applyCancelSubscription,
  applyPauseSubscription,
  applyResumeSubscription,
} from "@/components/subscriptions/subscription-ui-overrides";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { hubFeatureUnavailableMessage } from "@/lib/hub-feature-unavailable-message";
import { cn } from "@/lib/utils";

const actionBtnClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[4px] border border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold leading-6 text-[#344054] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none transition-colors hover:bg-[#f9fafb] focus-visible:ring-2 focus-visible:ring-[#f2f4f7]";

const menuItemClass =
  "cursor-pointer rounded px-4 py-2 text-base font-medium leading-6 text-[#101828] data-[highlighted]:bg-[#f2f4f7]";

/**
 * Same eligibility as `SubscriptionRowActions` (minus View). Pause / cancel / resume
 * open the same modals as the dashboard and persist via `subscription-ui-overrides`.
 */
export function SubscriptionDetailBannerActions({
  subscriptionId,
  displayStatus,
  baseStatus,
  subscriptionRow,
}: {
  subscriptionId: string;
  /** Effective status (paused/canceled overlays). */
  displayStatus: SubscriptionStatus;
  /** Status from subscription data (never Paused). */
  baseStatus: SubscriptionStatus;
  /** Current row snapshot for Update subscription modal. */
  subscriptionRow: SubscriptionRow;
}) {
  const { showError, showSuccess } = useHubToast();
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerDemoProfile[]>(() => [
    ...CUSTOMER_DEMO_PROFILES,
  ]);
  const [customerDirectoryReady, setCustomerDirectoryReady] = useState(false);
  const [customerEditFields, setCustomerEditFields] =
    useState<CustomerFormValues | null>(null);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [customerFormKey, setCustomerFormKey] = useState(0);
  const [customerFormVariant, setCustomerFormVariant] = useState<"edit" | "add">(
    "edit"
  );
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null
  );
  const [editCustomerInitial, setEditCustomerInitial] =
    useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM_VALUES);
  const [lastAddedCustomerId, setLastAddedCustomerId] = useState<string | null>(
    null
  );
  const [customerSaveToast, setCustomerSaveToast] = useState<{
    name: string;
    mode: "edit" | "add";
  } | null>(null);

  const [addLineItemTaxOpen, setAddLineItemTaxOpen] = useState(false);
  const [lineItemTaxKey, setLineItemTaxKey] = useState(0);
  const [lineItemTaxContext, setLineItemTaxContext] = useState<
    | {
        kind: "line";
        rowId: string;
        productName: string;
        intent: "add" | "edit";
        initialMode?: TaxMode;
        initialSelectedTaxIds?: string[];
      }
    | {
        kind: "subscription";
        intent: "add" | "edit";
        initialMode?: TaxMode;
        initialSelectedTaxIds?: string[];
      }
    | null
  >(null);
  const [subscriptionTaxSelection, setSubscriptionTaxSelection] = useState<{
    mode: TaxMode;
    selectedTaxIds: string[];
  } | null>(null);
  const [lineTaxPatch, setLineTaxPatch] = useState<
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
    | null
  >(null);

  const onLineTaxPatchConsumed = useCallback(() => setLineTaxPatch(null), []);

  useEffect(() => {
    const stored = loadCustomerDirectoryFromStorage();
    queueMicrotask(() => {
      if (stored) setCustomers(stored);
      setCustomerDirectoryReady(true);
    });
  }, []);

  useEffect(() => {
    if (!customerDirectoryReady) return;
    saveCustomerDirectoryToStorage(customers);
  }, [customers, customerDirectoryReady]);

  if (displayStatus === "Canceled") {
    return null;
  }

  const onPauseConfirmed = async (payload: PauseConfirmPayload) => {
    try {
      await pauseSubscriptionRequest(payload);
      applyPauseSubscription(subscriptionId, baseStatus);
      setPauseModalOpen(false);
      showSuccess(pauseSubscriptionSuccessMessage(payload));
    } catch {
      showError(PAUSE_SUBSCRIPTION_ERROR_MESSAGE);
    }
  };

  const onCancelConfirmed = () => {
    applyCancelSubscription(subscriptionId);
    setCancelModalOpen(false);
    showSuccess("Subscription canceled");
  };

  const onResumeConfirmed = () => {
    applyResumeSubscription(subscriptionId);
    setResumeModalOpen(false);
    showSuccess("Subscription resumed");
  };

  const modals = (
    <>
      <CreateSubscriptionModal
        key={`update-sub-${subscriptionRow.id}`}
        open={updateModalOpen}
        onOpenChange={(next) => {
          setUpdateModalOpen(next);
          if (!next) setCustomerSaveToast(null);
        }}
        mode="update"
        initialSubscriptionRow={subscriptionRow}
        customers={customers}
        initialCustomerId={lastAddedCustomerId}
        onInitialCustomerIdConsumed={() => setLastAddedCustomerId(null)}
        customerEditFields={customerEditFields}
        onCustomerEditFieldsChange={setCustomerEditFields}
        customerSaveToast={customerSaveToast}
        onCustomerSaveToastDismiss={() => setCustomerSaveToast(null)}
        onRequestEditCustomer={(initialValues, customerId) => {
          setEditingCustomerId(customerId);
          setCustomerFormVariant("edit");
          setEditCustomerInitial(initialValues);
          setCustomerFormKey((k) => k + 1);
          setUpdateModalOpen(false);
          setEditCustomerOpen(true);
        }}
        onRequestAddCustomer={() => {
          setEditingCustomerId(null);
          setCustomerFormVariant("add");
          setEditCustomerInitial(EMPTY_CUSTOMER_FORM_VALUES);
          setCustomerFormKey((k) => k + 1);
          setUpdateModalOpen(false);
          setEditCustomerOpen(true);
        }}
        onRequestAddLineItemTax={(payload) => {
          setLineItemTaxContext(
            payload.kind === "subscription"
              ? {
                  kind: "subscription",
                  intent: payload.intent ?? "add",
                  initialMode: payload.initialMode,
                  initialSelectedTaxIds: payload.initialSelectedTaxIds,
                }
              : {
                  kind: "line",
                  rowId: payload.rowId,
                  productName: payload.productName,
                  intent: payload.intent ?? "add",
                  initialMode: payload.initialMode,
                  initialSelectedTaxIds: payload.initialSelectedTaxIds,
                }
          );
          setLineItemTaxKey((k) => k + 1);
          setUpdateModalOpen(false);
          setAddLineItemTaxOpen(true);
        }}
        lineTaxPatch={lineTaxPatch}
        onLineTaxPatchConsumed={onLineTaxPatchConsumed}
        savedPaymentCards={[]}
        onSubscriptionUpdated={() => {}}
      />
      <EditCustomerInformationModal
        key={`detail-edit-customer-${customerFormKey}`}
        open={editCustomerOpen}
        variant={customerFormVariant}
        onOpenChange={(next) => {
          if (!next) {
            setEditCustomerOpen(false);
            setEditCustomerInitial(EMPTY_CUSTOMER_FORM_VALUES);
            setEditingCustomerId(null);
            setUpdateModalOpen(true);
          }
        }}
        initialValues={editCustomerInitial}
        customerRecordId={editingCustomerId}
        onSave={(values, meta) => {
          setCustomerSaveToast({
            name: values.name.trim() || "Customer",
            mode: customerFormVariant,
          });
          if (customerFormVariant === "add") {
            const id =
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : `cust-${Date.now()}`;
            setCustomers((prev) => [
              ...prev,
              buildCustomerProfileFromForm(values, id),
            ]);
            setLastAddedCustomerId(id);
          } else {
            const targetId = meta?.customerId ?? editingCustomerId;
            if (targetId) {
              setCustomers((prev) =>
                prev.map((c) =>
                  c.id === targetId
                    ? buildCustomerProfileFromForm(values, targetId)
                    : c
                )
              );
            }
          }
          setCustomerEditFields(null);
          setEditCustomerOpen(false);
          setEditCustomerInitial(EMPTY_CUSTOMER_FORM_VALUES);
          setEditingCustomerId(null);
          setUpdateModalOpen(true);
        }}
      />
      <AddLineItemTaxModal
        key={`detail-line-tax-${lineItemTaxKey}`}
        open={addLineItemTaxOpen}
        variant={
          lineItemTaxContext?.kind === "subscription" ? "subscription" : "line"
        }
        productName={
          lineItemTaxContext?.kind === "line"
            ? lineItemTaxContext.productName
            : ""
        }
        intent={lineItemTaxContext?.intent ?? "add"}
        initialMode={
          lineItemTaxContext?.kind === "line" &&
          lineItemTaxContext.intent === "edit"
            ? lineItemTaxContext.initialMode
            : lineItemTaxContext?.kind === "subscription" &&
                lineItemTaxContext.intent === "edit"
              ? lineItemTaxContext.initialMode ?? subscriptionTaxSelection?.mode
              : undefined
        }
        initialSelectedTaxIds={
          lineItemTaxContext?.kind === "line" &&
          lineItemTaxContext.intent === "edit" &&
          (lineItemTaxContext.initialMode ?? "manual") === "manual"
            ? lineItemTaxContext.initialSelectedTaxIds
            : lineItemTaxContext?.kind === "subscription" &&
                lineItemTaxContext.intent === "edit" &&
                (lineItemTaxContext.initialMode ??
                  subscriptionTaxSelection?.mode ??
                  "manual") === "manual"
              ? lineItemTaxContext.initialSelectedTaxIds ??
                subscriptionTaxSelection?.selectedTaxIds
              : undefined
        }
        onOpenChange={(next) => {
          if (!next) {
            setAddLineItemTaxOpen(false);
            setLineItemTaxContext(null);
            setUpdateModalOpen(true);
          }
        }}
        onSave={({ taxPercent, mode, selectedTaxIds }) => {
          const ctx = lineItemTaxContext;
          if (!ctx) return;
          const ids = mode === "manual" ? selectedTaxIds : [];
          if (ctx.kind === "subscription") {
            setSubscriptionTaxSelection({
              mode,
              selectedTaxIds: ids,
            });
          }
          setLineTaxPatch(
            ctx.kind === "subscription"
              ? { kind: "subscription", taxPercent, mode, selectedTaxIds: ids }
              : {
                  kind: "line",
                  rowId: ctx.rowId,
                  taxPercent,
                  mode,
                  selectedTaxIds: ids,
                }
          );
          setAddLineItemTaxOpen(false);
          setLineItemTaxContext(null);
          setUpdateModalOpen(true);
        }}
      />
      <PauseNotificationModal
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        onConfirm={onPauseConfirmed}
      />
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onConfirmCancel={onCancelConfirmed}
      />
      <ResumeSubscriptionModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        onConfirmResume={onResumeConfirmed}
      />
    </>
  );

  /** Incomplete: dashboard shows only Cancel. */
  if (displayStatus === "Incomplete") {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={actionBtnClass}
            onClick={() => setCancelModalOpen(true)}
          >
            Cancel subscription
          </button>
        </div>
        {modals}
      </>
    );
  }

  type MenuItem = {
    key: string;
    label: string;
    onSelect: () => void;
  };
  const moreItems: MenuItem[] = [];

  moreItems.push({
    key: "share",
    label: "Share payment update link",
    onSelect: () => {
      showError(hubFeatureUnavailableMessage("Share payment update link"));
    },
  });

  if (displayStatus === "Active" || displayStatus === "Trailing") {
    moreItems.push({
      key: "pause",
      label: "Pause",
      onSelect: () => setPauseModalOpen(true),
    });
  }

  if (displayStatus === "Paused") {
    moreItems.push({
      key: "resume",
      label: "Resume",
      onSelect: () => setResumeModalOpen(true),
    });
  }

  moreItems.push({
    key: "cancel",
    label: "Cancel subscription",
    onSelect: () => setCancelModalOpen(true),
  });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={actionBtnClass}
          onClick={() => setUpdateModalOpen(true)}
        >
          <RefreshCw className="size-4 shrink-0 text-[#344054]" strokeWidth={2} aria-hidden />
          Update subscription
        </button>
        {moreItems.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className={cn(actionBtnClass, "gap-2")}>
                More actions
                <ChevronDown className="size-4 shrink-0 text-[#344054]" strokeWidth={2} aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={4}
              className="w-max min-w-[200px] rounded-[4px] border border-[#d0d5dd] bg-white p-1 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.1),0px_2px_4px_-2px_rgba(16,24,40,0.06)]"
            >
              {moreItems.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  className={menuItemClass}
                  onSelect={() => item.onSelect()}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      {modals}
    </>
  );
}
