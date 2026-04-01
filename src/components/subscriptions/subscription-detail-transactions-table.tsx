"use client";

import {
  Banknote,
  Calendar,
  CreditCard,
  Flag,
  Link2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  DataTableCard,
  DataTableCell,
  TablePaginationFooter,
} from "@/components/subscriptions/subscription-detail-tables";
import { buildTransactionRows } from "@/components/subscriptions/subscription-detail-derived-data";
import type { SubscriptionRow } from "@/components/subscriptions/subscription-row-model";
import { SubscriptionStatusPill } from "@/components/subscriptions/subscription-status-pill";

export function SubscriptionDetailTransactionsTable({ row }: { row: SubscriptionRow }) {
  const allRows = useMemo(() => buildTransactionRows(row), [row]);
  const totalRows = allRows.length;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return allRows.slice(start, start + perPage);
  }, [allRows, page, perPage]);

  return (
    <DataTableCard
      title="Transaction(s)"
      rowCount={totalRows}
      footer={
        <TablePaginationFooter
          totalRows={totalRows}
          page={page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      }
      columns={[
        {
          key: "provider",
          label: "Provider",
          icon: CreditCard,
          widthClass: "min-w-[140px]",
        },
        { key: "charge", label: "Charge id", icon: Link2, widthClass: "min-w-[200px]" },
        {
          key: "date",
          label: "Transaction date",
          icon: Calendar,
          widthClass: "w-[148px]",
        },
        { key: "amount", label: "Amount", icon: Banknote, widthClass: "w-[120px]" },
        { key: "status", label: "Status", icon: Flag, widthClass: "w-[128px]" },
      ]}
    >
      {visibleRows.map((t, i) => (
        <tr key={`${t.provider}-${t.dateLabel}-${i}`}>
          <DataTableCell>
            <span className="block min-w-0 truncate">{t.provider}</span>
          </DataTableCell>
          <DataTableCell>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <span className="min-w-0 truncate text-base font-medium leading-6 text-[#475467]">
                {t.chargeLabel}
              </span>
              <button
                type="button"
                className="inline-flex size-6 shrink-0 items-center justify-center rounded text-[#475467] hover:bg-[#f9fafb]"
                aria-label="Share charge id"
              >
                <img
                  src="/icons/subscriptions/share-04.svg"
                  alt=""
                  width={14}
                  height={14}
                  className="size-3.5 object-contain opacity-80"
                />
              </button>
            </div>
          </DataTableCell>
          <DataTableCell>
            <span className="whitespace-nowrap">{t.dateLabel}</span>
          </DataTableCell>
          <DataTableCell>
            <span className="tabular-nums">{t.amount}</span>
          </DataTableCell>
          <DataTableCell>
            <div className="flex min-h-9 items-center">
              <SubscriptionStatusPill status={t.status} />
            </div>
          </DataTableCell>
        </tr>
      ))}
    </DataTableCard>
  );
}
