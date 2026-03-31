"use client";

import { MoreVertical } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type SubscriptionStatus = "Active" | "Trailing" | "Canceled" | "Incomplete";

export type SubscriptionRow = {
  id: string;
  provider: string;
  customer: { name: string; avatarBg?: string };
  source: string;
  createdOn: string;
  amount: string;
  status: SubscriptionStatus;
};

const statusStyles: Record<
  SubscriptionStatus,
  { bg: string; text: string }
> = {
  Active: {
    bg: "bg-[#ecfdf3]",
    text: "text-[#027a48]",
  },
  Trailing: {
    bg: "bg-[#eff4ff]",
    text: "text-[#004eeb]",
  },
  Canceled: {
    bg: "bg-[#fff7ed]",
    text: "text-[#c4320a]",
  },
  Incomplete: {
    bg: "bg-[#fef3f2]",
    text: "text-[#b42318]",
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
        "sticky top-0 z-20 h-9 border-b border-r border-[#d0d5dd] bg-[#f2f4f7] px-3 text-left align-middle [transform:translate3d(0,0,0)]",
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-[14px] font-medium",
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
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Active",
  },
  {
    id: "2",
    provider: "Stripe",
    customer: { name: "Erin Ekstrom Bothman", avatarBg: "#dbeafe" },
    source: "Annual plan — checkout",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Active",
  },
  {
    id: "3",
    provider: "PayPal",
    customer: { name: "Madelyn Calzoni", avatarBg: "#dbc0dd" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Trailing",
  },
  {
    id: "4",
    provider: "Square",
    customer: { name: "James Hall", avatarBg: "#dfcc9f" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Canceled",
  },
  {
    id: "5",
    provider: "Amazon Pay",
    customer: { name: "Kris Ullman", avatarBg: "#c2c7b8" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Incomplete",
  },
  {
    id: "6",
    provider: "Apple Pay",
    customer: { name: "Lori Bryson", avatarBg: "#d1baa9" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Active",
  },
  {
    id: "7",
    provider: "Google Pay",
    customer: { name: "Chris Glasser", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Incomplete",
  },
  {
    id: "8",
    provider: "Venmo",
    customer: { name: "Kris Ullman", avatarBg: "#c2c7b8" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Canceled",
  },
  {
    id: "9",
    provider: "Cash App",
    customer: { name: "Olivia John", avatarBg: "#f2f4f7" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Trailing",
  },
  {
    id: "10",
    provider: "Zelle",
    customer: { name: "Erin Ekstrom Bothman", avatarBg: "#dbeafe" },
    source: "Annual plan — checkout",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Active",
  },
  {
    id: "11",
    provider: "Samsung Pay",
    customer: { name: "Madelyn Calzoni", avatarBg: "#dbc0dd" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Incomplete",
  },
  {
    id: "12",
    provider: "Dwolla",
    customer: { name: "James Hall", avatarBg: "#dfcc9f" },
    source: "30% - 1 step order form",
    createdOn: "30 Oct 2024",
    amount: "$1,500",
    status: "Canceled",
  },
];

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

  const { slice, start, end } = useMemo(() => {
    const startIdx = (page - 1) * perPage;
    const rowCount = Math.min(perPage, TOTAL_ROWS - startIdx);
    const slice = Array.from({ length: rowCount }, (_, i) => {
      const globalIdx = startIdx + i;
      const template = MOCK_ROWS[globalIdx % MOCK_ROWS.length];
      return {
        ...template,
        id: `row-${globalIdx + 1}`,
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
    <div className="flex min-h-0 w-full flex-1 flex-col items-start justify-start gap-0 overflow-hidden bg-white">
      <div className="isolate h-fit max-h-full min-h-0 w-full overflow-auto rounded-[4px] border border-[#d0d5dd] bg-white">
        <table className="w-full min-w-[960px] border-separate border-spacing-0 text-left">
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
                className="w-[160px]"
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
                className="min-w-[280px]"
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
                className="min-w-[220px]"
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
                className="w-[140px]"
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
                className="w-[100px]"
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
                className="w-[140px]"
              />
              <th
                scope="col"
                className="sticky top-0 z-20 h-9 w-12 border-b border-[#d0d5dd] bg-[#f2f4f7] px-2 text-center align-middle [transform:translate3d(0,0,0)]"
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
                  <StatusBadge status={row.status} />
                </td>
                <td className="h-9 border-b border-[#d0d5dd] px-2 text-center align-middle">
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded text-[#667085] hover:bg-slate-100"
                    aria-label={`Actions for ${row.customer.name}`}
                  >
                    <MoreVertical className="size-4" strokeWidth={2} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
