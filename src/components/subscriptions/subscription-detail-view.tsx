import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Banknote,
  Calendar,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileText,
  Flag,
  Hash,
  Package,
  PauseCircle,
  Percent,
  Receipt,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { PaymentSummarySection } from "@/components/subscriptions/payment-summary";
import {
  billingCyclesBetweenLabel,
  buildProductLineItems,
  buildSummaryAdjustmentAmount,
  invoiceServiceLabel,
  paymentCardBrand,
  paymentCardExpiry,
  paymentCardLast4,
  sourceLinkLabel,
  totalPaymentsDueCount,
} from "@/components/subscriptions/subscription-detail-derived-data";
import type {
  SubscriptionRow,
  SubscriptionStatus,
} from "@/components/subscriptions/subscription-row-model";
import { parseSubscriptionRowIndexFromId } from "@/components/subscriptions/subscription-row-model";
import { DataTableCard, DataTableCell } from "@/components/subscriptions/subscription-detail-tables";
import { SubscriptionDetailTransactionsTable } from "@/components/subscriptions/subscription-detail-transactions-table";
import { TransactionSummarySection } from "@/components/subscriptions/transaction-summary";
import { formatDateMMDDYYYY, parseMMDDYYYY } from "@/lib/date-format";
import { cn } from "@/lib/utils";

function pseudoHex(seed: string, len: number): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const chars = "0123456789abcdef";
  let out = "";
  for (let i = 0; i < len; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    out += chars[Math.abs(h) % 16];
  }
  return out;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function formatDetailDateTime(createdOn: string): string {
  const base = parseMMDDYYYY(createdOn);
  base.setHours(13, 48, 0, 0);
  const datePart = formatDateMMDDYYYY(base);
  const timePart = base
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/\u202f/g, " ")
    .toLowerCase();
  return `${datePart} at ${timePart}`;
}

function slugifyNamePart(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function emailLocalFromCustomerName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return `user${pseudoHex(name, 6)}`;
  const first = slugifyNamePart(parts[0]);
  const last = slugifyNamePart(parts[parts.length - 1]);
  if (parts.length >= 2 && first && last) return `${first}.${last}`;
  return first || last || `user${pseudoHex(name, 4)}`;
}

/** Gmail-style address: unique per subscription row; Chris Glasser uses product copy. */
function profileEmailForRow(row: SubscriptionRow): string {
  if (row.customer.name === "Chris Glasser") {
    return "chris.glasser@gmail.com";
  }
  const local = emailLocalFromCustomerName(row.customer.name);
  const n = parseSubscriptionRowIndexFromId(row.id);
  const suffix = n !== null ? n + 1 : 1;
  return `${local}.${suffix}@gmail.com`;
}

function profilePhoneForRow(row: SubscriptionRow): string {
  const h = pseudoHex(row.id + "tel", 8);
  const mid = 200 + (parseInt(h.slice(0, 2), 16) % 56);
  const last4 = String(1000 + (parseInt(h.slice(2, 6), 16) % 9000)).padStart(4, "0");
  return `+1 (555) ${mid}-${last4}`;
}

function profileAddressForRow(row: SubscriptionRow): string {
  const idx = parseSubscriptionRowIndexFromId(row.id) ?? 0;
  const streetNum = 800 + idx * 37 + (parseInt(pseudoHex(row.id + "a", 4), 16) % 200);
  const lines: string[] = [
    `${streetNum} Elm Street, Suite ${100 + (idx % 90)}, Springfield, IL 62704, USA`,
    `${streetNum} Maple Ave, Apt ${20 + (idx % 40)}, Austin, TX 78701, USA`,
    `${streetNum} Harbor Way, Floor ${1 + (idx % 8)}, Boston, MA 02110, USA`,
    `${streetNum} Market Street, Unit ${idx + 1}, Philadelphia, PA 19103, USA`,
    `${streetNum} Pine Road, Building ${idx + 1}, Seattle, WA 98101, USA`,
    `${streetNum} Congress Ave, Suite ${400 + idx}, Austin, TX 78704, USA`,
    `${streetNum} Vesey Street, New York, NY 10281, USA`,
    `${streetNum} Mission Street, San Francisco, CA 94105, USA`,
    `${streetNum} Lakeside Drive, Chicago, IL 60601, USA`,
    `${streetNum} Network Circle, Santa Clara, CA 95054, USA`,
    `${streetNum} Morton Street, Denver, CO 80203, USA`,
    `${streetNum} Cypress Creek Road, Fort Lauderdale, FL 33309, USA`,
  ];
  return lines[idx % lines.length];
}

function ProductFrequencyCell({ freq }: { freq: "weekly" | "monthly" | "once" }) {
  const label =
    freq === "weekly" ? "Weekly" : freq === "monthly" ? "Monthly" : "One-time";
  return (
    <span className="whitespace-nowrap text-base font-medium leading-6 text-[#475467]">
      {label}
    </span>
  );
}

function invoiceStatusPill(row: SubscriptionRow): { label: string; className: string } {
  switch (row.status) {
    case "Active":
    case "Trailing":
      return {
        label: "Paid",
        className: "bg-[#ecfdf3] text-[#027a48]",
      };
    case "Paused":
      return {
        label: "Paused",
        className: "bg-[#f2f4f7] text-[#344054]",
      };
    case "Scheduled":
      return {
        label: "Scheduled",
        className: "bg-[#eff4ff] text-[#004eeb]",
      };
    case "Canceled":
      return {
        label: "Void",
        className: "bg-[#f2f4f7] text-[#344054]",
      };
    case "Incomplete":
      return {
        label: "Draft",
        className: "bg-[#fffaeb] text-[#b54708]",
      };
    default:
      return {
        label: "Open",
        className: "bg-[#fef3f2] text-[#b42318]",
      };
  }
}

type SummaryLine = {
  text: string;
  weight: "medium" | "regular";
  singleLine?: boolean;
};

type SummaryStepConfig = {
  icon: LucideIcon;
  title: string;
  lines: SummaryLine[];
  showConnectorAfter: boolean;
};

function daysFromCreated(created: Date, days: number): Date {
  const out = new Date(created);
  out.setDate(out.getDate() + days);
  return out;
}

/** Summary rail copy follows subscription status (paused/canceled/etc.). */
function buildSummaryTimelineSteps(
  row: SubscriptionRow,
  created: Date,
  summaryAdj: string
): SummaryStepConfig[] {
  const fmt = (d: Date) => formatDateMMDDYYYY(d);

  const billingCyclesLine = billingCyclesBetweenLabel(row);

  const activeBillingSteps = (): SummaryStepConfig[] => [
    {
      icon: Calendar,
      title: fmt(daysFromCreated(created, 14)),
      lines: [
        {
          text: "Billed immediately for 1 month",
          weight: "medium",
          singleLine: true,
        },
      ],
      showConnectorAfter: true,
    },
    {
      icon: Receipt,
      title: "Next payment",
      lines: [
        {
          text: `Amount due ${row.amount}`,
          weight: "medium",
          singleLine: true,
        },
        {
          text: `Bills on ${fmt(daysFromCreated(created, 30))} for 1 month`,
          weight: "regular",
        },
      ],
      showConnectorAfter: true,
    },
    {
      icon: Check,
      title: "Billing cycles",
      lines: [{ text: billingCyclesLine, weight: "medium" }],
      showConnectorAfter: true,
    },
    {
      icon: Calendar,
      title: fmt(daysFromCreated(created, 21)),
      lines: [
        {
          text: `Amount due ${summaryAdj}`,
          weight: "medium",
          singleLine: true,
        },
        { text: "Subscription updates", weight: "regular" },
      ],
      showConnectorAfter: true,
    },
    {
      icon: RefreshCw,
      title: "Reset billing cycle",
      lines: [
        {
          text: `Bills ${fmt(daysFromCreated(created, 7))}`,
          weight: "medium",
        },
      ],
      showConnectorAfter: false,
    },
  ];

  switch (row.status) {
    case "Paused":
      return [
        {
          icon: PauseCircle,
          title: "Billing paused",
          lines: [
            {
              text: "Payment collection is on hold.",
              weight: "medium",
              singleLine: true,
            },
            {
              text: "Resume from actions to start billing again.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Receipt,
          title: "Next payment",
          lines: [
            {
              text: `Amount due ${row.amount} when you resume`,
              weight: "medium",
              singleLine: true,
            },
            {
              text: "No charges are scheduled while paused.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Check,
          title: "Billing cycles",
          lines: [
            {
              text: "Cycles paused — not advancing",
              weight: "medium",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Calendar,
          title: fmt(daysFromCreated(created, 21)),
          lines: [
            {
              text: `Amount due ${summaryAdj} after resume`,
              weight: "medium",
              singleLine: true,
            },
            {
              text: "Plan updates apply once billing restarts.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: RefreshCw,
          title: "Resume billing",
          lines: [
            {
              text: `Next cycle aligns to ${fmt(daysFromCreated(created, 30))} after you resume`,
              weight: "medium",
            },
          ],
          showConnectorAfter: false,
        },
      ];
    case "Canceled":
      return [
        {
          icon: XCircle,
          title: "Subscription canceled",
          lines: [
            {
              text: "No further payment attempts.",
              weight: "medium",
              singleLine: true,
            },
            {
              text: "This subscription will not bill again.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Calendar,
          title: fmt(created),
          lines: [
            {
              text: "Status closed on record",
              weight: "medium",
              singleLine: true,
            },
            {
              text: "Timeline reflects cancellation only.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Receipt,
          title: "Balance",
          lines: [
            { text: "No amount due", weight: "medium", singleLine: true },
            {
              text: "Outstanding items were cleared with cancellation.",
              weight: "regular",
            },
          ],
          showConnectorAfter: false,
        },
      ];
    case "Incomplete":
      return [
        {
          icon: AlertCircle,
          title: "Payment required",
          lines: [
            {
              text: "Complete checkout to activate billing.",
              weight: "medium",
              singleLine: true,
            },
            {
              text: "This subscription is not charging yet.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Receipt,
          title: "Amount due",
          lines: [
            {
              text: row.amount,
              weight: "medium",
              singleLine: true,
            },
            {
              text: "Due when payment succeeds",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        {
          icon: Calendar,
          title: fmt(daysFromCreated(created, 14)),
          lines: [
            {
              text: "Billing schedule starts after activation",
              weight: "medium",
            },
          ],
          showConnectorAfter: false,
        },
      ];
    case "Scheduled": {
      const rest = activeBillingSteps().slice(1);
      return [
        {
          icon: CalendarClock,
          title: fmt(daysFromCreated(created, 4)),
          lines: [
            {
              text: "Subscription scheduled",
              weight: "medium",
              singleLine: true,
            },
            {
              text: "No charges until the start date.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        ...rest,
      ];
    }
    case "Trailing": {
      const rest = activeBillingSteps().slice(1);
      return [
        {
          icon: Calendar,
          title: fmt(daysFromCreated(created, 44)),
          lines: [
            {
              text: "Trial in progress",
              weight: "medium",
              singleLine: true,
            },
            {
              text: "Billing begins after the trial ends unless you cancel.",
              weight: "regular",
            },
          ],
          showConnectorAfter: true,
        },
        ...rest,
      ];
    }
    default:
      return activeBillingSteps();
  }
}

/** Figma 1193:117414 — progress steps: 28px rail, #475467, 8px gap */
function SummaryTimelineStep({
  icon: Icon,
  title,
  lines,
  showConnectorAfter,
}: {
  icon: LucideIcon;
  title: string;
  lines: SummaryLine[];
  showConnectorAfter: boolean;
}) {
  return (
    <li className="flex w-full flex-col">
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex w-7 shrink-0 flex-col items-center",
            showConnectorAfter && "min-h-[1px] self-stretch"
          )}
        >
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-[14px] border border-[#475467] bg-white"
            aria-hidden
          >
            <Icon className="size-4 text-[#475467]" strokeWidth={2} />
          </div>
          {showConnectorAfter ? (
            <div className="mt-0 min-h-[1px] w-px flex-1 bg-[#475467]" aria-hidden />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold leading-6 tracking-normal text-[#101828]">
              {title}
            </p>
            {lines.map((line, i) => (
              <p
                key={i}
                className={cn(
                  "text-sm leading-5 tracking-normal text-[#475467]",
                  line.weight === "medium" ? "font-medium" : "font-normal",
                  line.singleLine && "min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                )}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>
      </div>
      {showConnectorAfter ? (
        <div className="flex h-4 w-7 shrink-0 justify-center">
          <div className="h-full w-px bg-[#475467]" aria-hidden />
        </div>
      ) : null}
    </li>
  );
}

function SubscriptionSummaryAside({
  row,
  created,
  summaryAdj,
}: {
  row: SubscriptionRow;
  created: Date;
  summaryAdj: string;
}) {
  const steps = buildSummaryTimelineSteps(row, created, summaryAdj);
  return (
    <aside className="flex w-full min-w-0 flex-col xl:w-[280px] xl:shrink-0">
      <div
        className="flex flex-col overflow-hidden rounded border border-[#d0d5dd] bg-white shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)]"
        data-name="Summary"
      >
        <div className="flex flex-col px-4 pt-4">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-[#101828]" strokeWidth={2} aria-hidden />
            <h3 className="text-base font-semibold leading-6 text-[#101828]">Summary</h3>
          </div>
        </div>
        <ol className="m-0 flex list-none flex-col px-3 py-4">
          {steps.map((step, i) => (
            <SummaryTimelineStep
              key={`${row.status}-${i}-${step.title}`}
              icon={step.icon}
              title={step.title}
              lines={step.lines}
              showConnectorAfter={step.showConnectorAfter}
            />
          ))}
        </ol>
      </div>
    </aside>
  );
}

export function SubscriptionDetailView({
  row,
  baseStatus,
}: {
  row: SubscriptionRow;
  /** Mock data status when `row` is merged with pause/cancel overlays. */
  baseStatus?: SubscriptionStatus;
}) {
  const resolvedBaseStatus = baseStatus ?? row.status;
  const subIdHex = pseudoHex(row.id, 24);
  const created = parseMMDDYYYY(row.createdOn);
  const upcoming = addDays(created, 4);
  const start = addDays(created, 2);
  const end = addDays(created, 1500);
  const upcomingPaymentStr = `${row.amount} on ${formatDateMMDDYYYY(upcoming)}`;
  const accountId = `acct_${pseudoHex(row.id + "a", 16)}`;
  const subscriptionPaymentId = `pi_${pseudoHex(row.id + "pi", 26)}`;
  const internalOrderId = pseudoHex(row.id + "o", 24);
  const sourceId = pseudoHex(row.id + "i", 24);
  const profileEmail = profileEmailForRow(row);
  const profilePhone = profilePhoneForRow(row);
  const profileAddress = profileAddressForRow(row);
  const productRows = buildProductLineItems(row);
  const totalDue = totalPaymentsDueCount(row);
  const summaryAdj = buildSummaryAdjustmentAmount(row);
  const invoicePill = invoiceStatusPill(row);

  return (
    <div className="mx-auto flex w-fit min-w-0 flex-col gap-6">
      {/** Figma 1193:62718 — inner stacks max 1080px wide inside 1160px canvas */}

      <TransactionSummarySection
        row={row}
        baseStatus={resolvedBaseStatus}
        subIdHex={subIdHex}
        createdDisplay={formatDetailDateTime(row.createdOn)}
        upcomingPaymentStr={upcomingPaymentStr}
        totalPaymentsDue={totalDue}
        startDateStr={formatDateMMDDYYYY(start)}
        endDateStr={formatDateMMDDYYYY(end)}
      />

      {/** Payment Summary — Figma 1193:64194 */}
      <PaymentSummarySection
        row={row}
        accountId={accountId}
        subscriptionPaymentId={subscriptionPaymentId}
        internalOrderId={internalOrderId}
        sourceId={sourceId}
        email={profileEmail}
        phone={profilePhone}
        address={profileAddress}
        cardBrand={paymentCardBrand(row.id)}
        cardLast4={paymentCardLast4(row.id)}
        cardExpiry={paymentCardExpiry(row.id)}
        sourceLinkName={sourceLinkLabel(row)}
      />

      {/** Lower region — Figma 1193:69367 (776 + gap + 280) */}
      <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-6 xl:flex-row xl:items-start xl:gap-6">
        <div className="flex min-w-0 w-full flex-col gap-6 xl:w-[776px] xl:max-w-[776px] xl:shrink-0">
          <DataTableCard
            title="Product(s)"
            rowCount={productRows.length}
            columns={[
              { key: "item", label: "Item", icon: Package, widthClass: "min-w-[200px]" },
              { key: "price", label: "Price", icon: Banknote, widthClass: "w-[120px]" },
              { key: "qty", label: "Qty", icon: Hash, widthClass: "w-[100px]" },
              { key: "freq", label: "Frequency", icon: Calendar, widthClass: "w-[128px]" },
              { key: "tax", label: "Tax", icon: Percent, widthClass: "w-[120px]" },
              {
                key: "sub",
                label: "Subtotal",
                icon: CircleDollarSign,
                widthClass: "w-[120px]",
                headerAlign: "right",
              },
            ]}
          >
            {productRows.map((p, i) => (
              <tr key={`${row.id}-product-${i}`}>
                <DataTableCell>
                  <span className="block truncate">{p.item}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className="tabular-nums">{p.price}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className="tabular-nums">{p.qty}</span>
                </DataTableCell>
                <DataTableCell>
                  <ProductFrequencyCell freq={p.freq} />
                </DataTableCell>
                <DataTableCell>
                  <span className="tabular-nums">{p.tax}</span>
                </DataTableCell>
                <DataTableCell alignRight>
                  <span className="tabular-nums">{p.sub}</span>
                </DataTableCell>
              </tr>
            ))}
          </DataTableCard>

          <SubscriptionDetailTransactionsTable row={row} />

          <DataTableCard
            title="Invoice(s)"
            rowCount={1}
            columns={[
              {
                key: "name",
                label: "Invoice name",
                icon: FileText,
                widthClass: "min-w-[160px]",
              },
              {
                key: "num",
                label: "Invoice number",
                icon: Hash,
                widthClass: "min-w-[140px]",
              },
              { key: "issue", label: "Issue date", icon: Calendar, widthClass: "w-[140px]" },
              { key: "due", label: "Due date", icon: Calendar, widthClass: "w-[140px]" },
              { key: "amount", label: "Amount", icon: CreditCard, widthClass: "w-[120px]" },
              { key: "status", label: "Status", icon: Flag, widthClass: "w-[120px]" },
            ]}
          >
            <tr>
              <DataTableCell>
                <span className="truncate">{invoiceServiceLabel(row)}</span>
              </DataTableCell>
              <DataTableCell>
                <span className="font-mono text-base font-medium leading-6 text-[#475467]">
                  inv_{pseudoHex(row.id + "v", 10)}
                </span>
              </DataTableCell>
              <DataTableCell>
                <span className="whitespace-nowrap">{formatDateMMDDYYYY(created)}</span>
              </DataTableCell>
              <DataTableCell>
                <span className="whitespace-nowrap">{formatDateMMDDYYYY(addDays(created, 14))}</span>
              </DataTableCell>
              <DataTableCell>
                <span className="tabular-nums">{row.amount}</span>
              </DataTableCell>
              <DataTableCell>
                <div className="flex min-h-9 items-center">
                  <span
                    className={cn(
                      "inline-flex h-6 max-h-6 items-center justify-center rounded-full px-2 text-sm font-medium",
                      invoicePill.className
                    )}
                  >
                    {invoicePill.label}
                  </span>
                </div>
              </DataTableCell>
            </tr>
          </DataTableCard>
        </div>

        <SubscriptionSummaryAside
          row={row}
          created={created}
          summaryAdj={summaryAdj}
        />
      </div>
    </div>
  );
}
