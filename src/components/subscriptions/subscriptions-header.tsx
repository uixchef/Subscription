"use client";

import { Download, Plus } from "lucide-react";
import { useCallback, useState } from "react";

import {
  AddLineItemTaxModal,
  type TaxMode,
} from "@/components/subscriptions/add-line-item-tax-modal";
import { useHubToast } from "@/components/payment-hub/hub-toast";
import { CreateSubscriptionModal } from "@/components/subscriptions/create-subscription-modal";
import {
  EditCustomerInformationModal,
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
} from "@/components/subscriptions/edit-customer-information-modal";
import { Button } from "@/components/ui/button";
import { hubFeatureUnavailableMessage } from "@/lib/hub-feature-unavailable-message";

export function SubscriptionsHeader() {
  const { showError } = useHubToast();
  const [createOpen, setCreateOpen] = useState(false);
  /** New instance each open so the form always starts from defaults (avoids stale state). */
  const [createModalKey, setCreateModalKey] = useState(0);
  const [customerEditFields, setCustomerEditFields] =
    useState<CustomerFormValues | null>(null);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [customerFormKey, setCustomerFormKey] = useState(0);
  const [customerFormVariant, setCustomerFormVariant] = useState<"edit" | "add">(
    "edit"
  );
  const [editCustomerInitial, setEditCustomerInitial] =
    useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM_VALUES);
  /** Shown on Create subscription overlay at 52px after save/add from Edit customer (parent clears on dismiss). */
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
    | { kind: "subscription"; intent: "add" | "edit" }
    | null
  >(null);
  /** Last saved subscription-scope tax UI state (for Edit tax). */
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

  return (
    <div className="flex h-fit w-full min-w-0 shrink-0 items-center border-b border-[#d0d5dd] bg-white px-4 pb-2 pt-2">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-6 text-[#101828]">
            Subscriptions
          </h1>
          <p className="mt-0 text-sm leading-5 text-[#475467]">
            Keep track of customer subscriptions created via order forms.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto gap-2 rounded border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-slate-50"
            onClick={() =>
              showError(hubFeatureUnavailableMessage("CSV import"))
            }
          >
            <Download className="size-4 shrink-0" strokeWidth={2} />
            Import as CSV
          </Button>
          <Button
            type="button"
            className="h-auto gap-2 rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[#155eef]/90"
            onClick={() => {
              setCreateModalKey((k) => k + 1);
              setCustomerEditFields(null);
              setCustomerSaveToast(null);
              setSubscriptionTaxSelection(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4 shrink-0" strokeWidth={2} />
            Create subscription
          </Button>
        </div>
      </div>
      <CreateSubscriptionModal
        key={`create-${createModalKey}`}
        open={createOpen}
        onOpenChange={(next) => {
          setCreateOpen(next);
          if (!next) setCustomerSaveToast(null);
        }}
        customerEditFields={customerEditFields}
        onCustomerEditFieldsChange={setCustomerEditFields}
        customerSaveToast={customerSaveToast}
        onCustomerSaveToastDismiss={() => setCustomerSaveToast(null)}
        onRequestEditCustomer={(initialValues) => {
          setCustomerFormVariant("edit");
          setEditCustomerInitial(initialValues);
          setCustomerFormKey((k) => k + 1);
          setCreateOpen(false);
          setEditCustomerOpen(true);
        }}
        onRequestAddCustomer={() => {
          setCustomerFormVariant("add");
          setEditCustomerInitial(EMPTY_CUSTOMER_FORM_VALUES);
          setCustomerFormKey((k) => k + 1);
          setCreateOpen(false);
          setEditCustomerOpen(true);
        }}
        onRequestAddLineItemTax={(payload) => {
          setLineItemTaxContext(
            payload.kind === "subscription"
              ? { kind: "subscription", intent: payload.intent ?? "add" }
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
          setCreateOpen(false);
          setAddLineItemTaxOpen(true);
        }}
        lineTaxPatch={lineTaxPatch}
        onLineTaxPatchConsumed={onLineTaxPatchConsumed}
      />
      <EditCustomerInformationModal
        key={`edit-customer-${customerFormKey}`}
        open={editCustomerOpen}
        variant={customerFormVariant}
        onOpenChange={(next) => {
          if (!next) {
            setEditCustomerOpen(false);
            setEditCustomerInitial(EMPTY_CUSTOMER_FORM_VALUES);
            setCreateOpen(true);
          }
        }}
        initialValues={editCustomerInitial}
        onSave={(values) => {
          setCustomerEditFields(values);
          setCustomerSaveToast({
            name: values.name.trim() || "Customer",
            mode: customerFormVariant,
          });
          setEditCustomerOpen(false);
          setEditCustomerInitial(EMPTY_CUSTOMER_FORM_VALUES);
          setCreateOpen(true);
        }}
      />
      <AddLineItemTaxModal
        key={`line-tax-${lineItemTaxKey}`}
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
              ? subscriptionTaxSelection?.mode
              : undefined
        }
        initialSelectedTaxIds={
          lineItemTaxContext?.kind === "line" &&
          lineItemTaxContext.intent === "edit" &&
          (lineItemTaxContext.initialMode ?? "manual") === "manual"
            ? lineItemTaxContext.initialSelectedTaxIds
            : lineItemTaxContext?.kind === "subscription" &&
                lineItemTaxContext.intent === "edit" &&
                subscriptionTaxSelection?.mode === "manual"
              ? subscriptionTaxSelection.selectedTaxIds
              : undefined
        }
        onOpenChange={(next) => {
          if (!next) {
            setAddLineItemTaxOpen(false);
            setLineItemTaxContext(null);
            setCreateOpen(true);
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
          setCreateOpen(true);
        }}
      />
    </div>
  );
}
