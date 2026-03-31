"use client";

import { X } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type CancelSubscriptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires when the user confirms cancellation; does not close the modal — close via X or footer Cancel. */
  onConfirmCancel?: () => void;
};

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  onConfirmCancel,
}: CancelSubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[min(483px,calc(100vw-2rem))] gap-0 overflow-hidden p-0 sm:max-w-[min(483px,calc(100vw-2rem))]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col px-4 pt-3 pb-0">
          <div className="flex w-full items-start gap-2">
            <DialogTitle className="min-w-0 flex-1 text-base font-semibold leading-6 text-[#101828]">
              Cancel subscription
            </DialogTitle>
            <DialogClose className="inline-flex size-5 shrink-0 items-center justify-center rounded text-[#667085] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#004eeb]/30">
              <X className="size-5" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </div>

        <div className="p-4">
          <DialogDescription className="text-base font-normal leading-6 text-[#475467]">
            This will cancel this subscription immediately and will prevent any
            future payment attempts. Are you sure you want to cancel this
            subscription?
          </DialogDescription>
        </div>

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
              className="inline-flex items-center justify-center rounded-[4px] border border-solid border-[#d92d20] bg-[#d92d20] px-2.5 py-1.5 text-base font-semibold leading-6 text-white shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] outline-none hover:bg-[#d92d20]/90 focus-visible:ring-2 focus-visible:ring-[#d92d20]/40"
              onClick={() => onConfirmCancel?.()}
            >
              Yes, cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
