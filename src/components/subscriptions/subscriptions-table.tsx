"use client";

import {
  ArrowUpRight,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import { CancelSubscriptionModal } from "@/components/subscriptions/cancel-subscription-modal";
import { PauseNotificationModal } from "@/components/subscriptions/pause-notification-modal";
import { ResumeSubscriptionModal } from "@/components/subscriptions/resume-subscription-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const rowActionItemClass =
  "cursor-pointer gap-2 rounded px-4 py-2 text-base font-medium leading-6 text-[#101828] focus:bg-[#f9fafb] focus:text-[#101828] data-[highlighted]:bg-[#f9fafb] data-[highlighted]:text-[#101828]";

const rowActionIconClass = "size-4 shrink-0 text-[#344054]";

/** Fixed column widths so split header/body tables stay aligned. Sum = 1088px. */
function SubscriptionsTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: 160 }} />
      <col style={{ width: 280 }} />
      <col style={{ width: 220 }} />
      <col style={{ width: 140 }} />
      <col style={{ width: 100 }} />
      <col style={{ width: 140 }} />
      <col style={{ width: 48 }} />
    </colgroup>
  );
}

function SubscriptionRowActions({
  customerName,
  subscriptionId,
  baseStatus,
  displayStatus,
  onPauseConfirmed,
  onResume,
  onCancelConfirmed,
}: {
  customerName: string;
  subscriptionId: string;
  /** Status from data (never Paused). */
  baseStatus: SubscriptionStatus;
  /** Effective status for badge; Paused when paused. */
  displayStatus: SubscriptionStatus;
  onPauseConfirmed: (
    subscriptionId: string,
    previousStatus: SubscriptionStatus
  ) => void;
  onResume: (subscriptionId: string) => void;
  onCancelConfirmed: (subscriptionId: string) => void;
}) {
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const { showSuccess, showError } = useHubToast();

  const itemView = (
    <DropdownMenuItem
      key="view"
      className={rowActionItemClass}
      onSelect={() => {
        showSuccess("Opening subscription…");
      }}
    >
      <ArrowUpRight className={rowActionIconClass} strokeWidth={2} aria-hidden />
      View
    </DropdownMenuItem>
  );

  const itemCancel = (
    <DropdownMenuItem
      key="cancel"
      className={rowActionItemClass}
      onSelect={() => {
        setCancelModalOpen(true);
      }}
    >
      <XCircle className={rowActionIconClass} strokeWidth={2} aria-hidden />
      Cancel
    </DropdownMenuItem>
  );

  const itemShare = (
    <DropdownMenuItem
      key="share"
      className={rowActionItemClass}
      onSelect={() => {
        void (async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            showSuccess("Payment update link copied to clipboard");
          } catch {
            showError("Couldn’t copy link. Try again.");
          }
        })();
      }}
    >
      <img
        src="/icons/subscriptions/share-04.svg"
        alt=""
        className="size-4 shrink-0 object-contain"
        aria-hidden
      />
      Share payment update link
    </DropdownMenuItem>
  );

  const itemPause = (
    <DropdownMenuItem
      key="pause"
      className={rowActionItemClass}
      onSelect={() => {
        setPauseModalOpen(true);
      }}
    >
      <PauseCircle className={rowActionIconClass} strokeWidth={2} aria-hidden />
      Pause
    </DropdownMenuItem>
  );

  const itemResume = (
    <DropdownMenuItem
      key="resume"
      className={rowActionItemClass}
      onSelect={() => {
        setResumeModalOpen(true);
      }}
    >
      <PlayCircle className={rowActionIconClass} strokeWidth={2} aria-hidden />
      Resume
    </DropdownMenuItem>
  );

  const itemUpdate = (
    <DropdownMenuItem
      key="update"
      className={rowActionItemClass}
      onSelect={() => {
        showSuccess("Subscription update started");
      }}
    >
      <RefreshCw className={rowActionIconClass} strokeWidth={2} aria-hidden />
      Update
    </DropdownMenuItem>
  );

  let menuItems: React.ReactNode;
  switch (displayStatus) {
    case "Canceled":
      menuItems = itemView;
      break;
    case "Incomplete":
      menuItems = (
        <>
          {itemView}
          {itemCancel}
        </>
      );
      break;
    case "Scheduled":
      menuItems = (
        <>
          {itemView}
          {itemCancel}
          {itemShare}
          {itemUpdate}
        </>
      );
      break;
    case "Paused":
      menuItems = (
        <>
          {itemView}
          {itemCancel}
          {itemShare}
          {itemResume}
          {itemUpdate}
        </>
      );
      break;
    default:
      menuItems = (
        <>
          {itemView}
          {itemCancel}
          {itemShare}
          {itemPause}
          {itemUpdate}
        </>
      );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "box-border inline-flex size-6 items-center justify-center overflow-hidden rounded-[4px] p-1 text-[#667085] outline-none",
              /* Ghost icon-only 3xs Neutral — HighRise Button (Figma / node 1164-247516) */
              "hover:bg-[#f9fafb]",
              "focus-visible:bg-[#f9fafb] focus-visible:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05),0px_0px_0px_4px_#f2f4f7]",
              /* Active = menu open; must follow focus so open state wins when both apply */
              "data-[state=open]:bg-[#f2f4f7] data-[state=open]:shadow-none"
            )}
            aria-label={`Actions for ${customerName}`}
          >
            <MoreVertical className="size-4 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="w-max min-w-[240px] max-w-[min(calc(100vw-2rem),320px)] rounded-[4px] border border-[#d0d5dd] bg-white p-1 shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.1),0px_2px_4px_-2px_rgba(16,24,40,0.06)]"
        >
          {menuItems}
        </DropdownMenuContent>
      </DropdownMenu>
      <PauseNotificationModal
        open={pauseModalOpen}
        onOpenChange={setPauseModalOpen}
        onConfirm={() => {
          onPauseConfirmed(subscriptionId, baseStatus);
          setPauseModalOpen(false);
          showSuccess("Subscription paused");
        }}
      />
      <CancelSubscriptionModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onConfirmCancel={() => {
          onCancelConfirmed(subscriptionId);
          setCancelModalOpen(false);
          showSuccess("Subscription canceled");
        }}
      />
      <ResumeSubscriptionModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        onConfirmResume={() => {
          onResume(subscriptionId);
          setResumeModalOpen(false);
          showSuccess("Subscription resumed");
        }}
      />
    </>
  );
}

export type SubscriptionStatus =
  | "Active"
  | "Trailing"
  | "Scheduled"
  | "Canceled"
  | "Incomplete"
  | "Paused";

export type SubscriptionRow = {
  id: string;
  provider: string;
  customer: { name: string; avatarBg?: string };
  source: string;
  createdOn: string;
  amount: string;
  status: SubscriptionStatus;
};

/** Tag / warning — same tokens as Canceled (Subscription-2025 Figma). */
const warningTagChipClass =
  "h-6 min-h-[24px] max-h-[24px] justify-center rounded-[12px] px-2 py-0 leading-5";

/** Tag / badge chip — Trailing, Scheduled (primary); Paused (gray) — Figma 1164:247516, 1379:127053. */
const tagChipClass =
  "h-6 min-h-[24px] max-h-[24px] justify-center rounded-[12px] px-2 py-0 leading-5";

const statusStyles: Record<
  SubscriptionStatus,
  { bg: string; text: string; chip?: string }
> = {
  Active: {
    bg: "bg-[#ecfdf3]",
    text: "text-[#027a48]",
  },
  Trailing: {
    bg: "bg-[#eff4ff]",
    text: "text-[#004eeb]",
    chip: tagChipClass,
  },
  Scheduled: {
    bg: "bg-[#eff4ff]",
    text: "text-[#004eeb]",
    chip: tagChipClass,
  },
  Canceled: {
    bg: "bg-[#fffaeb]",
    text: "text-[#b54708]",
    chip: warningTagChipClass,
  },
  Incomplete: {
    bg: "bg-[#fef3f2]",
    text: "text-[#b42318]",
  },
  Paused: {
    bg: "bg-[#f2f4f7]",
    text: "text-[#344054]",
    chip: tagChipClass,
  },
};

function HeaderCell({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "h-9 border-b border-r border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left align-middle",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <span className="flex size-4 shrink-0 items-center justify-center text-[#475467]">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-base font-semibold leading-6 text-[#101828]">
          {label}
        </span>
        <button
          type="button"
          className="inline-flex size-[14px] shrink-0 items-center justify-center rounded text-[#667085] hover:bg-slate-200/80"
          aria-label={`Filter ${label}`}
        >
          <img
            src="/icons/subscriptions/filter-lines.svg"
            alt=""
            className="size-3.5 shrink-0"
            aria-hidden
          />
        </button>
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const s = statusStyles[status];
  return (
    <span
      className={cn(
        "inline-flex items-center text-[14px] font-medium",
        s.chip ?? "rounded-full px-2 py-0.5 leading-5",
        s.bg,
        s.text
      )}
    >
      {status}
    </span>
  );
}

function CustomerCell({
  customer,
}: {
  customer: SubscriptionRow["customer"];
}) {
  const initials = customer.name
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#344054]"
        style={{ backgroundColor: customer.avatarBg ?? "#e4e7ec" }}
      >
        {initials}
      </span>
      <span className="min-w-0 truncate text-base font-medium leading-6 text-[#475467]">
        {customer.name}
      </span>
    </div>
  );
}

const MOCK_ROWS: SubscriptionRow[] = [
  {
    id: "1",
    provider: "Manual",
    customer: { name: "Olivia John", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Active",
  },
  {
    id: "2",
    provider: "Stripe",
    customer: { name: "Erin Ekstrom Bothman", avatarBg: "#dbeafe" },
    source: "Annual plan — checkout",
    createdOn: "",
    amount: "",
    status: "Active",
  },
  {
    id: "3",
    provider: "PayPal",
    customer: { name: "Madelyn Calzoni", avatarBg: "#dbc0dd" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Scheduled",
  },
  {
    id: "4",
    provider: "Square",
    customer: { name: "James Hall", avatarBg: "#dfcc9f" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Canceled",
  },
  {
    id: "5",
    provider: "Amazon Pay",
    customer: { name: "Kris Ullman", avatarBg: "#c2c7b8" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Incomplete",
  },
  {
    id: "6",
    provider: "Apple Pay",
    customer: { name: "Lori Bryson", avatarBg: "#d1baa9" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Active",
  },
  {
    id: "7",
    provider: "Google Pay",
    customer: { name: "Chris Glasser", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Incomplete",
  },
  {
    id: "8",
    provider: "Venmo",
    customer: { name: "Kris Ullman", avatarBg: "#c2c7b8" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Canceled",
  },
  {
    id: "9",
    provider: "Cash App",
    customer: { name: "Olivia John", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Trailing",
  },
  {
    id: "10",
    provider: "Zelle",
    customer: { name: "Erin Ekstrom Bothman", avatarBg: "#dbeafe" },
    source: "Annual plan — checkout",
    createdOn: "",
    amount: "",
    status: "Active",
  },
  {
    id: "11",
    provider: "Samsung Pay",
    customer: { name: "Madelyn Calzoni", avatarBg: "#dbc0dd" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Incomplete",
  },
  {
    id: "12",
    provider: "Dwolla",
    customer: { name: "James Hall", avatarBg: "#dfcc9f" },
    source: "30% - 1 step order form",
    createdOn: "",
    amount: "",
    status: "Canceled",
  },
];

const CREATED_ON_STEP_DAYS = 22;

/** MM/DD/YYYY: newest first — row 0 is today, each next row is CREATED_ON_STEP_DAYS earlier (no future dates). */
function formatCreatedOnMMDDYYYY(stepsOlderThanNewest: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - stepsOlderThanNewest * CREATED_ON_STEP_DAYS);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/** Unique USD per row index, e.g. $1,500.00 */
function formatUsdUnique(index: number): string {
  const cents = 150000 + index * 8471 + (index % 100) * 3;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const TOTAL_ROWS = 212;

function getPaginationItems(
  current: number,
  total: number
): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", total];
  }
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export function SubscriptionsTable() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  /** Row id → status before pause (for restoring on Resume). */
  const [pausedById, setPausedById] = useState<
    Record<string, SubscriptionStatus>
  >({});
  /** Locally canceled rows (badge → Canceled until refresh). */
  const [canceledIds, setCanceledIds] = useState<Record<string, boolean>>({});

  const { slice, start, end } = useMemo(() => {
    const startIdx = (page - 1) * perPage;
    const rowCount = Math.min(perPage, TOTAL_ROWS - startIdx);
    const slice = Array.from({ length: rowCount }, (_, i) => {
      const globalIdx = startIdx + i;
      const template = MOCK_ROWS[globalIdx % MOCK_ROWS.length];
      return {
        ...template,
        id: `row-${globalIdx + 1}`,
        createdOn: formatCreatedOnMMDDYYYY(globalIdx),
        amount: formatUsdUnique(globalIdx),
      };
    });
    return {
      slice,
      start: rowCount === 0 ? 0 : startIdx + 1,
      end: startIdx + rowCount,
    };
  }, [page, perPage]);

  const totalPages = Math.max(1, Math.ceil(TOTAL_ROWS / perPage));

  const paginationItems = useMemo(
    () => getPaginationItems(page, totalPages),
    [page, totalPages]
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start gap-0 bg-white">
      <div className="isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[4px] border border-[#d0d5dd] bg-white">
        {/* Horizontal scroll wraps header + body so columns stay aligned; vertical scroll is body-only (scrollbar below header). */}
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-x-auto">
          <div className="flex min-h-0 w-full min-w-[1088px] flex-1 flex-col">
            <div className="shrink-0">
              <table className="w-full min-w-[1088px] table-fixed border-separate border-spacing-0 text-left">
                <SubscriptionsTableColGroup />
                <thead>
                  <tr>
                    <HeaderCell
                      icon={
                        <img
                          src="/icons/subscriptions/credit-card.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      }
                      label="Provider"
                    />
                    <HeaderCell
                      icon={
                        <img
                          src="/icons/subscriptions/account-circle.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      }
                      label="Customer"
                    />
                    <HeaderCell
                      icon={
                        <img
                          src="/icons/subscriptions/highlight-mouse-cursor.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      }
                      label="Source"
                    />
                    <HeaderCell
                      icon={
                        <img
                          src="/icons/subscriptions/calendar-today.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      }
                      label="Created on"
                    />
                    <HeaderCell
                      icon={
                        <img
                          src="/icons/subscriptions/credit-card.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      }
                      label="Amount"
                    />
                    <HeaderCell
                      icon={
                        <img
                          src="/icons/subscriptions/flag.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      }
                      label="Status"
                    />
                    <th
                      scope="col"
                      className="h-9 w-12 border-b border-[#d0d5dd] bg-[#f2f4f7] px-2 text-center align-middle"
                    >
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded text-[#667085] hover:bg-slate-200/80"
                        aria-label="Table actions"
                      >
                        <img
                          src="/icons/subscriptions/highlight-mouse-cursor.svg"
                          alt=""
                          className="size-4 shrink-0 object-contain"
                          aria-hidden
                        />
                      </button>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-visible [scrollbar-gutter:stable]">
              <table className="w-full min-w-[1088px] table-fixed border-separate border-spacing-0 text-left">
                <SubscriptionsTableColGroup />
                <tbody>
                  {slice.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80">
                      <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle text-base font-medium leading-6 text-[#475467]">
                        {row.provider}
                      </td>
                      <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle">
                        <CustomerCell customer={row.customer} />
                      </td>
                      <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle">
                        <div className="flex min-w-0 items-center gap-1">
                          <span className="min-w-0 truncate text-base font-medium leading-6 text-[#475467]">
                            {row.source}
                          </span>
                          <img
                            src="/icons/subscriptions/share-04.svg"
                            alt=""
                            className="size-4 shrink-0 object-contain"
                            aria-hidden
                          />
                        </div>
                      </td>
                      <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle text-base font-medium leading-6 text-[#475467]">
                        {row.createdOn}
                      </td>
                      <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle text-base font-medium leading-6 text-[#475467]">
                        {row.amount}
                      </td>
                      <td className="h-9 border-b border-r border-[#d0d5dd] px-3 align-middle">
                        <StatusBadge
                          status={
                            canceledIds[row.id]
                              ? "Canceled"
                              : pausedById[row.id] !== undefined
                                ? "Paused"
                                : row.status
                          }
                        />
                      </td>
                      <td className="h-9 border-b border-[#d0d5dd] px-3 text-center align-middle">
                        <div className="flex justify-center">
                          <SubscriptionRowActions
                            customerName={row.customer.name}
                            subscriptionId={row.id}
                            baseStatus={row.status}
                            displayStatus={
                              canceledIds[row.id]
                                ? "Canceled"
                                : pausedById[row.id] !== undefined
                                  ? "Paused"
                                  : row.status
                            }
                            onPauseConfirmed={(
                              subscriptionId,
                              previousStatus
                            ) => {
                              setPausedById((p) => ({
                                ...p,
                                [subscriptionId]: previousStatus,
                              }));
                            }}
                            onResume={(subscriptionId) => {
                              setPausedById((p) => {
                                const { [subscriptionId]: _, ...rest } = p;
                                return rest;
                              });
                            }}
                            onCancelConfirmed={(subscriptionId) => {
                              setCanceledIds((p) => ({
                                ...p,
                                [subscriptionId]: true,
                              }));
                              setPausedById((p) => {
                                const { [subscriptionId]: _, ...rest } = p;
                                return rest;
                              });
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-fit w-full shrink-0 flex-nowrap items-end justify-end gap-4 bg-white px-0 pt-2 pb-2 text-left">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <label className="flex items-center gap-1 text-sm font-medium leading-5 text-[#475467]">
            <span className="whitespace-nowrap">Rows per page</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 min-w-[64px] cursor-pointer rounded border border-[#d0d5dd] bg-white px-2 py-1.5 text-sm font-normal leading-5 text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] outline-none hover:border-[#98a2b3] focus-visible:ring-2 focus-visible:ring-[#2970ff]/30"
              aria-label="Rows per page"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <p className="text-sm font-normal leading-5 text-[#475467]">
            {start}-{end} of {TOTAL_ROWS}
          </p>
        </div>
        <nav
          className="flex flex-wrap items-center gap-1"
          aria-label="Pagination"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 py-1 text-sm font-semibold leading-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors",
              page <= 1
                ? "cursor-not-allowed text-[#d0d5dd]"
                : "text-[#475467] hover:bg-slate-50"
            )}
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {paginationItems.map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 text-sm leading-5 text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={cn(
                    "inline-flex min-h-8 min-w-8 items-center justify-center rounded p-1.5 text-sm font-normal leading-5 text-[#475467] transition-colors",
                    page === item
                      ? "border border-[#2970ff] bg-white"
                      : "border border-transparent hover:bg-slate-100"
                  )}
                  aria-current={page === item ? "page" : undefined}
                >
                  {item}
                </button>
              )
            )}
          </div>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center rounded border border-[#d0d5dd] bg-white px-2 py-1 text-sm font-semibold leading-5 text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-[#d0d5dd]"
            )}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
}
