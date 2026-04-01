import { CreditCard, EyeOff, FileText, Mail, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";

import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import { cn } from "@/lib/utils";

const cardShell =
  "flex min-h-0 min-w-0 flex-col overflow-x-clip rounded-[4px] border border-[#d0d5dd] bg-white shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]";

const tagMaxClass = "max-w-[188px]";

/** HighLevel Table/share-04 — fill follows parent `color`. */
function Share04Icon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-inherit", className)}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.16669 1.75008C8.16669 1.42792 8.42786 1.16675 8.75002 1.16675H12.25C12.5722 1.16675 12.8334 1.42791 12.8334 1.75008L12.8334 5.25008C12.8334 5.57225 12.5722 5.83341 12.25 5.83342C11.9279 5.83342 11.6667 5.57225 11.6667 5.25008L11.6667 3.15837L7.99583 6.82923C7.76803 7.05703 7.39868 7.05703 7.17088 6.82923C6.94307 6.60142 6.94307 6.23208 7.17088 6.00427L10.8417 2.33341H8.75002C8.42786 2.33341 8.16669 2.07225 8.16669 1.75008ZM4.52593 2.33341L5.83335 2.33341C6.15552 2.33341 6.41669 2.59458 6.41669 2.91675C6.41669 3.23891 6.15552 3.50008 5.83335 3.50008H4.55002C4.05035 3.50008 3.71068 3.50054 3.44813 3.52199C3.19238 3.54288 3.0616 3.58076 2.97037 3.62724C2.75084 3.73909 2.57237 3.91757 2.46051 4.13709C2.41403 4.22833 2.37615 4.35911 2.35526 4.61485C2.33381 4.87741 2.33335 5.21708 2.33335 5.71675V9.45008C2.33335 9.94975 2.33381 10.2894 2.35526 10.552C2.37615 10.8077 2.41403 10.9385 2.46051 11.0297C2.57237 11.2493 2.75084 11.4277 2.97037 11.5396C3.0616 11.5861 3.19238 11.6239 3.44813 11.6448C3.71068 11.6663 4.05035 11.6667 4.55002 11.6667H8.28335C8.78303 11.6667 9.1227 11.6663 9.38525 11.6448C9.64099 11.6239 9.77178 11.5861 9.86301 11.5396C10.0825 11.4277 10.261 11.2493 10.3729 11.0297C10.4193 10.9385 10.4572 10.8077 10.4781 10.552C10.4996 10.2894 10.5 9.94975 10.5 9.45008V8.16675C10.5 7.84458 10.7612 7.58342 11.0834 7.58342C11.4055 7.58342 11.6667 7.84458 11.6667 8.16675V9.47419C11.6667 9.94375 11.6667 10.3313 11.6409 10.647C11.6141 10.9749 11.5566 11.2763 11.4124 11.5594C11.1887 11.9984 10.8317 12.3554 10.3927 12.5791C10.1096 12.7234 9.80814 12.7808 9.48025 12.8076C9.16456 12.8334 8.77702 12.8334 8.30746 12.8334H4.52592C4.05636 12.8334 3.66882 12.8334 3.35312 12.8076C3.02523 12.7808 2.72382 12.7234 2.44071 12.5791C2.00167 12.3554 1.64471 11.9984 1.42101 11.5594C1.27675 11.2763 1.21926 10.9749 1.19247 10.647C1.16667 10.3313 1.16668 9.94374 1.16669 9.47417V5.69266C1.16668 5.22309 1.16667 4.83555 1.19247 4.51985C1.21926 4.19196 1.27675 3.89055 1.42101 3.60744C1.64471 3.16839 2.00166 2.81144 2.44071 2.58773C2.72382 2.44348 3.02523 2.38598 3.35312 2.35919C3.66882 2.3334 4.05636 2.33341 4.52593 2.33341Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TagTrailingShare({ className }: { className?: string }) {
  return <Share04Icon className={cn("size-4", className)} />;
}

function PaymentSummaryDivider() {
  return <div className="h-px w-full shrink-0 bg-[#eaecf0]" role="presentation" />;
}

/** Label + plain value (Type, subtype, Who paid, Name, …) */
function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-4">
      <span className="shrink-0 text-base font-normal leading-6 text-[#475467]">{label}</span>
      <span className="min-w-0 text-right text-base font-medium leading-6 text-[#101828]">
        {value}
      </span>
    </div>
  );
}

function TagGray({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-h-6 max-h-6 min-w-0 items-center gap-1 rounded-[4px] bg-[#f2f4f7] px-2 text-sm font-medium leading-5 text-[#344054]",
        tagMaxClass
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </span>
  );
}

function TagSuccess({
  children,
  showShare,
}: {
  children: ReactNode;
  showShare?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-h-6 max-h-6 min-w-0 items-center gap-1 rounded-[4px] bg-[#ecfdf3] px-2 text-sm font-medium leading-5 text-[#027a48]",
        tagMaxClass
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {showShare ? <TagTrailingShare /> : null}
    </span>
  );
}

function TagPrimary({
  children,
  showShare,
}: {
  children: ReactNode;
  showShare?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-h-6 max-h-6 min-w-0 items-center gap-1 rounded-[4px] bg-[#eff4ff] px-2 text-sm font-medium leading-5 text-[#004eeb]",
        tagMaxClass
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {showShare ? <TagTrailingShare /> : null}
    </span>
  );
}

function FieldWithTag({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-9">
      <span className="shrink-0 text-base font-normal leading-6 text-[#475467]">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );
}

export function PaymentSummarySection({
  row,
  accountId,
  subscriptionPaymentId,
  internalOrderId,
  sourceId,
  email,
  phone,
  address,
  cardBrand,
  cardLast4,
  cardExpiry,
  sourceLinkName,
}: {
  row: SubscriptionRow;
  accountId: string;
  subscriptionPaymentId: string;
  internalOrderId: string;
  sourceId: string;
  email: string;
  phone: string;
  address: string;
  cardBrand: string;
  cardLast4: string;
  cardExpiry: string;
  sourceLinkName: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1080px] flex-col items-start gap-6 min-[1100px]:flex-row min-[1100px]:items-stretch min-[1100px]:gap-6">
      {/* Payment details — Figma 1193:64195 */}
      <div className={cn(cardShell, "w-full min-[1100px]:min-w-0 min-[1100px]:flex-1")}>
        <div className="flex w-full flex-col items-start px-4 pt-4">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 shrink-0 text-[#475467]" strokeWidth={2} aria-hidden />
            <h3 className="text-base font-semibold leading-6 text-[#101828]">Payment details</h3>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 p-4">
          <FieldRow label="Type" value={row.provider} />
          <PaymentSummaryDivider />
          <FieldWithTag label="Account ID">
            <TagGray>{accountId}</TagGray>
          </FieldWithTag>
          <PaymentSummaryDivider />
          <FieldWithTag label="Subscription ID">
            <TagSuccess showShare>{subscriptionPaymentId}</TagSuccess>
          </FieldWithTag>
          <PaymentSummaryDivider />
          <div className="flex w-full min-w-0 items-center justify-between gap-4">
            <span className="shrink-0 text-base font-normal leading-6 text-[#475467]">Mode</span>
            <div className="flex min-w-0 items-center gap-2">
              <span className="whitespace-nowrap text-base font-medium leading-6 text-[#101828]">
                {cardBrand} ending with {cardLast4}
              </span>
              <span className="h-3 w-px shrink-0 bg-[#eaecf0]" aria-hidden />
              <span className="whitespace-nowrap text-base font-medium leading-6 text-[#101828]">
                {cardExpiry}
              </span>
              <button
                type="button"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded text-[#004EEB] hover:bg-[#eff4ff]"
                aria-label="Hide card details"
              >
                <EyeOff className="size-4" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
          <PaymentSummaryDivider />
          <FieldRow label="Who paid" value={`Recorded by ${row.customer.name}`} />
        </div>
      </div>

      {/* Source information — Figma 1193:64237 */}
      <div className={cn(cardShell, "w-full min-[1100px]:min-w-0 min-[1100px]:flex-1")}>
        <div className="flex w-full flex-col items-start px-4 pt-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 shrink-0 text-[#475467]" strokeWidth={2} aria-hidden />
            <h3 className="text-base font-semibold leading-6 text-[#101828]">Source information</h3>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 p-4">
          <FieldRow label="Type" value="Payment link" />
          <PaymentSummaryDivider />
          <FieldRow label="Subtype" value="payments_dashboard" />
          <PaymentSummaryDivider />
          <FieldWithTag label="Internal order ID">
            <TagPrimary showShare>{internalOrderId}</TagPrimary>
          </FieldWithTag>
          <PaymentSummaryDivider />
          <FieldWithTag label="ID">
            <TagPrimary showShare>{sourceId}</TagPrimary>
          </FieldWithTag>
          <PaymentSummaryDivider />
          <FieldRow label="Name" value={sourceLinkName} />
        </div>
      </div>

      {/* Customer profile — Figma 1193:65214, 280px */}
      <div className={cn(cardShell, "w-full shrink-0 min-[1100px]:w-[280px]")}>
        <div className="flex w-full flex-col px-4 pt-4">
          <div className="flex w-full items-center gap-6">
            <h3 className="min-w-0 flex-1 text-base font-semibold leading-6 text-[#101828]">
              Customer profile
            </h3>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded text-[#475467] hover:bg-[#f9fafb]"
              aria-label="Share"
            >
              <Share04Icon className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex w-full flex-col border-b border-[#eaecf0] p-4">
          <div className="flex w-full items-center gap-2">
            <CustomerAvatar name={row.customer.name} bg={row.customer.avatarBg} />
            <p className="min-w-0 flex-1 text-base font-medium leading-6 text-[#101828]">
              {row.customer.name}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-4 p-4">
          <CustomerContactBlock
            icon={<Mail className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
            label="Email"
            value={email}
          />
          <CustomerContactBlock
            icon={<Phone className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
            label="Phone"
            value={phone}
          />
          <CustomerContactBlock
            icon={<MapPin className="size-4 shrink-0" strokeWidth={2} aria-hidden />}
            label="Address"
            value={address}
            multiline
          />
        </div>
      </div>
    </div>
  );
}

function CustomerAvatar({ name, bg }: { name: string; bg?: string }) {
  const initials = name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-[#344054]"
      style={{ backgroundColor: bg ?? "#e4e7ec" }}
    >
      {initials}
    </span>
  );
}

function CustomerContactBlock({
  icon,
  label,
  value,
  multiline,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex w-full flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <span className="text-[#475467]">{icon}</span>
        <span className="text-sm font-normal leading-5 text-[#475467]">{label}</span>
      </div>
      <p
        className={cn(
          "pl-6 text-sm font-medium leading-5 text-[#101828]",
          multiline && "whitespace-normal"
        )}
      >
        {value}
      </p>
    </div>
  );
}
