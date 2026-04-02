"use client";

import {
  ArrowUpRight,
  MoreVertical,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useHubToast } from "@/components/payment-hub/hub-toast";
import { CancelSubscriptionModal } from "@/components/subscriptions/cancel-subscription-modal";
import { PauseNotificationModal } from "@/components/subscriptions/pause-notification-modal";
import {
  PAUSE_SUBSCRIPTION_ERROR_MESSAGE,
  pauseSubscriptionRequest,
  pauseSubscriptionSuccessMessage,
} from "@/components/subscriptions/pause-subscription-messages";
import { ResumeSubscriptionModal } from "@/components/subscriptions/resume-subscription-modal";
import { figmaFieldFocusVisible } from "@/components/subscriptions/figma-field-focus";
import {
  loadCreatedSubscriptions,
  subscribeCreatedSubscriptions,
} from "@/components/subscriptions/created-subscriptions-storage";
import { SUBSCRIPTION_TOTAL_ROWS } from "@/components/subscriptions/subscriptions-constants";
import {
  buildSubscriptionRow,
  type SubscriptionRow,
  type SubscriptionStatus,
} from "@/components/subscriptions/subscription-row-model";
import {
  loadSubscriptionUiOverrides,
  saveSubscriptionUiOverrides,
  subscribeSubscriptionUiOverrides,
} from "@/components/subscriptions/subscription-ui-overrides";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPaginationItems } from "@/components/subscriptions/pagination-utils";
import { hubFeatureUnavailableMessage } from "@/lib/hub-feature-unavailable-message";
import { cn } from "@/lib/utils";

const rowActionItemClass =
  "cursor-pointer gap-2 rounded px-4 py-2 text-base font-medium leading-6 text-[#101828] data-[highlighted]:bg-[#f2f4f7] data-[highlighted]:text-[#101828]";

const rowActionIconClass = "size-4 shrink-0 text-[#344054]";

/** Fixed column widths so split header/body tables stay aligned. 1040px without actions; +48px = 1088px with actions. Empty state: six equal-width columns. */
function SubscriptionsTableColGroup({
  includeActionsColumn = true,
}: {
  includeActionsColumn?: boolean;
}) {
  if (!includeActionsColumn) {
    const sixth = `${100 / 6}%`;
    return (
      <colgroup>
        <col style={{ width: sixth }} />
        <col style={{ width: sixth }} />
        <col style={{ width: sixth }} />
        <col style={{ width: sixth }} />
        <col style={{ width: sixth }} />
        <col style={{ width: sixth }} />
      </colgroup>
    );
  }
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
    <DropdownMenuItem asChild key="view" className={rowActionItemClass}>
      <Link
        href={`/subscriptions/${subscriptionId}`}
        className="flex cursor-pointer items-center gap-2 outline-none"
      >
        <ArrowUpRight className={rowActionIconClass} strokeWidth={2} aria-hidden />
        View
      </Link>
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
        showError(
          hubFeatureUnavailableMessage("Share payment update link")
        );
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
        showError(hubFeatureUnavailableMessage("Update subscription"));
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
        onConfirm={async (payload) => {
          try {
            await pauseSubscriptionRequest(payload);
            onPauseConfirmed(subscriptionId, baseStatus);
            setPauseModalOpen(false);
            showSuccess(pauseSubscriptionSuccessMessage(payload));
          } catch {
            showError(PAUSE_SUBSCRIPTION_ERROR_MESSAGE);
          }
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

export function SubscriptionsTableHeaderCell({
  icon,
  label,
  className,
  showFilterButton = true,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  /** Hidden in empty table (no rows to filter). */
  showFilterButton?: boolean;
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
        {showFilterButton ? (
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
        ) : null}
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

function SubscriptionsTableEmptyState() {
  return (
    <div
      className="flex w-full flex-col items-center justify-center gap-4 px-6 py-12"
      role="status"
      aria-live="polite"
    >
      <img
        src="/icons/subscriptions/empty-state-subscriptions.svg"
        alt=""
        width={160}
        height={160}
        className="size-[160px] shrink-0"
      />
      <div className="flex w-full max-w-[480px] flex-col items-center gap-1 text-center tracking-normal">
        <p className="w-full text-base font-semibold leading-6 text-[#101828]">
          No subscription yet
        </p>
        <p className="w-full text-sm font-normal leading-5 text-[#475467]">
          Your payments and charges will appear here once activity begins.
        </p>
      </div>
    </div>
  );
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
  const [overridesHydrated, setOverridesHydrated] = useState(false);
  const [createdRows, setCreatedRows] = useState<SubscriptionRow[]>([]);

  useEffect(() => {
    const o = loadSubscriptionUiOverrides();
    queueMicrotask(() => {
      setPausedById(o.pausedById);
      setCanceledIds(o.canceledIds);
      setOverridesHydrated(true);
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => setCreatedRows(loadCreatedSubscriptions()));
  }, []);

  useEffect(() => {
    return subscribeCreatedSubscriptions(() => {
      setCreatedRows(loadCreatedSubscriptions());
      setPage(1);
    });
  }, []);

  useEffect(() => {
    if (!overridesHydrated) return;
    saveSubscriptionUiOverrides({ pausedById, canceledIds });
  }, [overridesHydrated, pausedById, canceledIds]);

  /** Detail page / other tabs update sessionStorage — keep table in sync. */
  useEffect(() => {
    return subscribeSubscriptionUiOverrides(() => {
      const o = loadSubscriptionUiOverrides();
      setPausedById(o.pausedById);
      setCanceledIds(o.canceledIds);
    });
  }, []);

  const allRows = useMemo(() => {
    const mock = Array.from({ length: SUBSCRIPTION_TOTAL_ROWS }, (_, i) =>
      buildSubscriptionRow(i)
    );
    return [...createdRows, ...mock];
  }, [createdRows]);

  const totalRowCount = allRows.length;

  const { slice, start, end } = useMemo(() => {
    const startIdx = (page - 1) * perPage;
    const rowCount = Math.max(0, Math.min(perPage, totalRowCount - startIdx));
    const slice = allRows.slice(startIdx, startIdx + rowCount);
    return {
      slice,
      start: rowCount === 0 ? 0 : startIdx + 1,
      end: startIdx + rowCount,
    };
  }, [page, perPage, allRows, totalRowCount]);

  const totalPages = Math.max(1, Math.ceil(totalRowCount / perPage));

  const paginationItems = useMemo(
    () => getPaginationItems(page, totalPages),
    [page, totalPages]
  );

  const isEmptyTable = slice.length === 0;
  const includeActionsColumn = !isEmptyTable;
  const tableWidthClass = includeActionsColumn
    ? "min-w-[1088px]"
    : "w-full min-w-0";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start gap-0 bg-white">
      <div className="isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[4px] border border-[#d0d5dd] bg-white">
        {/* Horizontal scroll wraps header + body so columns stay aligned; vertical scroll is body-only (scrollbar below header). */}
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-x-auto">
          <div
            className={cn(
              "flex min-h-0 w-full flex-1 flex-col",
              tableWidthClass
            )}
          >
            <div className="shrink-0">
              <table
                className={cn(
                  "w-full table-fixed border-separate border-spacing-0 text-left",
                  tableWidthClass
                )}
              >
                <SubscriptionsTableColGroup
                  includeActionsColumn={includeActionsColumn}
                />
                <thead>
                  <tr>
                    <SubscriptionsTableHeaderCell
                      showFilterButton={!isEmptyTable}
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
                    <SubscriptionsTableHeaderCell
                      showFilterButton={!isEmptyTable}
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
                    <SubscriptionsTableHeaderCell
                      showFilterButton={!isEmptyTable}
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
                    <SubscriptionsTableHeaderCell
                      showFilterButton={!isEmptyTable}
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
                    <SubscriptionsTableHeaderCell
                      showFilterButton={!isEmptyTable}
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
                    <SubscriptionsTableHeaderCell
                      showFilterButton={!isEmptyTable}
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
                    {includeActionsColumn ? (
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
                    ) : null}
                  </tr>
                </thead>
              </table>
            </div>
            <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-visible [scrollbar-gutter:stable]">
              <table
                className={cn(
                  "w-full table-fixed border-separate border-spacing-0 text-left",
                  tableWidthClass
                )}
              >
                <SubscriptionsTableColGroup
                  includeActionsColumn={includeActionsColumn}
                />
                <tbody>
                  {slice.length === 0 ? (
                    <tr>
                      <td
                        colSpan={includeActionsColumn ? 7 : 6}
                        className="border-b-0 bg-white p-0 align-top"
                      >
                        <div className="flex min-h-[min(400px,calc(100vh-24rem))] w-full flex-col items-center justify-center">
                          <SubscriptionsTableEmptyState />
                        </div>
                      </td>
                    </tr>
                  ) : (
                    slice.map((row) => (
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
                                const next = { ...p };
                                delete next[subscriptionId];
                                return next;
                              });
                            }}
                            onCancelConfirmed={(subscriptionId) => {
                              setCanceledIds((p) => ({
                                ...p,
                                [subscriptionId]: true,
                              }));
                              setPausedById((p) => {
                                const next = { ...p };
                                delete next[subscriptionId];
                                return next;
                              });
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {SUBSCRIPTION_TOTAL_ROWS > 0 ? (
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
                className={cn(
                  "h-8 min-w-[64px] cursor-pointer rounded border border-[#d0d5dd] bg-white px-2 py-1.5 text-sm font-normal leading-5 text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-[#98a2b3]",
                  figmaFieldFocusVisible
                )}
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <p className="text-sm font-normal leading-5 text-[#475467]">
              {start}-{end} of {totalRowCount}
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
      ) : null}
    </div>
  );
}
