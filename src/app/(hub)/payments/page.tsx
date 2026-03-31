import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments | Payment Hub",
  description: "Payment Hub shell — main column content area",
};

/**
 * Example hub page: only this column is app-specific; shell (sidebar + top bar) comes from the layout.
 */
export default function PaymentsPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-[12px] border border-white bg-white p-6 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
      <div className="mx-auto flex w-full min-w-0 max-w-[1160px] flex-col gap-4">
        <header>
          <h1 className="text-lg font-semibold text-[#101828]">
            Subscription overview
          </h1>
          <p className="mt-1 text-sm text-[#475467]">
            This route is wrapped by the Payment Hub shell. Replace this panel with
            product-specific UI.
          </p>
        </header>
        <div
          className="rounded-lg border border-dashed border-[#d0d5dd] bg-slate-50/80 p-8 text-center text-sm text-[#667085]"
          role="region"
          aria-label="Placeholder content"
        >
          Main column — app content goes here.
        </div>
      </div>
    </div>
  );
}
