import Link from "next/link";
import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SubscriptionsHeader() {
  return (
    <div className="flex h-fit w-full min-w-0 shrink-0 items-center border-b border-[#d0d5dd] bg-white px-4 pb-2 pt-2">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-6 text-[#101828]">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm leading-5 text-[#475467]">
            Keep track of customer subscriptions created via order forms.{" "}
            <Link
              href="https://highrise.gohighlevel.com"
              className="font-medium text-[#004eeb] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              View documentation
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-auto gap-2 rounded border-[#d0d5dd] bg-white px-2.5 py-1.5 text-base font-semibold text-[#344054] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-slate-50"
          >
            <Download className="size-4 shrink-0" strokeWidth={2} />
            Import as CSV
          </Button>
          <Button
            type="button"
            className="h-auto gap-2 rounded border border-[#155eef] bg-[#155eef] px-2.5 py-1.5 text-base font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[#155eef]/90"
          >
            <Plus className="size-4 shrink-0" strokeWidth={2} />
            Create subscription
          </Button>
        </div>
      </div>
    </div>
  );
}
