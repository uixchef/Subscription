"use client";

import { ChevronDown, RefreshCw } from "lucide-react";
import { useState } from "react";

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
import type { SubscriptionStatus } from "@/components/subscriptions/subscription-row-model";
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
}: {
  subscriptionId: string;
  /** Effective status (paused/canceled overlays). */
  displayStatus: SubscriptionStatus;
  /** Status from subscription data (never Paused). */
  baseStatus: SubscriptionStatus;
}) {
  const { showError, showSuccess } = useHubToast();
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);

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
          onClick={() => {
            showError(hubFeatureUnavailableMessage("Update subscription"));
          }}
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
