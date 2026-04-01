"use client";

import { Download, Plus } from "lucide-react";
import { useState } from "react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import { CreateSubscriptionModal } from "@/components/subscriptions/create-subscription-modal";
import {
  EditCustomerInformationModal,
  EMPTY_CUSTOMER_FORM_VALUES,
  type CustomerFormValues,
} from "@/components/subscriptions/edit-customer-information-modal";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex h-fit w-full min-w-0 shrink-0 items-center border-b border-[#d0d5dd] bg-white px-4 pb-2 pt-2">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-6 text-[#101828]">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm leading-5 text-[#475467]">
            Keep track of customer subscriptions created via order forms.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto gap-2 rounded border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-slate-50"
            onClick={() =>
              showError(
                "CSV import isn’t available yet. This flow is still in progress. Please try again in two to three days."
              )
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
    </div>
  );
}
