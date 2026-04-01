import type { Metadata } from "next";

type Props = { params: Promise<{ subscriptionId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subscriptionId } = await params;
  return {
    title: `Subscription ${subscriptionId} | Payments`,
  };
}

export default async function SubscriptionDetailPage({ params }: Props) {
  const { subscriptionId } = await params;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-[12px] border border-white bg-white p-6 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]">
      <div className="mx-auto flex w-full min-w-0 max-w-[1160px] flex-col gap-4">
        <h1 className="text-lg font-semibold text-[#101828]">
          Subscription {subscriptionId}
        </h1>
        <p className="text-sm text-[#475467]">Detail view placeholder.</p>
      </div>
    </div>
  );
}
