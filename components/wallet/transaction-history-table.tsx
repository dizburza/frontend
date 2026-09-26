"use client";

import Image from "next/image";
import { useMemo } from "react";

import { StatusPill } from "@/components/dashboard/section-card";
import { useToken } from "@/hooks/useToken";
import useAddressUsernames from "@/hooks/useAddressUsernames";
import type { ApiTransaction } from "@/lib/api/organization";

export type StatusFilter = "all" | "confirmed" | "pending" | "failed";

type TransactionHistoryTableProps = {
  transactions: ApiTransaction[];
  loading: boolean;
  error: string | null;
  /** Totals for the selected month, already formatted by the backend. */
  incoming: string;
  outgoing: string;
  months: { value: string; label: string }[];
  month: string;
  onMonthChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  onDownload: () => void;
  downloadDisabled: boolean;
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "confirmed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const shortAddress = (value: string) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "--";

// Whole naira unless the amount genuinely has kobo, so a salary reads as
// 230,000 rather than 230,000.00.
const formatAmount = (value: string | undefined) => {
  const amount = Number.parseFloat(String(value || "0").replaceAll(/[+-]/g, ""));
  if (!Number.isFinite(amount)) return "--";
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatNaira = (value: string | undefined) => {
  const amount = Number.parseFloat(String(value || "0"));
  if (!Number.isFinite(amount)) return "--";
  return amount.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

/** Split so the date sits above the time, as two lines in one cell. */
const formatWhen = (timestamp: string) => {
  if (!timestamp) return { date: "--", time: "" };
  const at = new Date(timestamp);
  if (Number.isNaN(at.getTime())) return { date: "--", time: "" };

  return {
    date: at.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: `At ${at.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })}`,
  };
};

function Select({
  value,
  options,
  onChange,
  label,
}: Readonly<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  label: string;
}>) {
  return (
    <div className="relative flex items-center rounded-lg bg-surface-sunken">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-8 text-sm font-medium text-neutral-800 outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 8 8"
        className="pointer-events-none absolute right-3 size-2 text-neutral-400"
      >
        <path
          d="M1.4 3 4 5.4 6.6 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function TransactionHistoryTable({
  transactions,
  loading,
  error,
  incoming,
  outgoing,
  months,
  month,
  onMonthChange,
  status,
  onStatusChange,
  onDownload,
  downloadDisabled,
}: Readonly<TransactionHistoryTableProps>) {
  const { symbol } = useToken();

  const counterparties = useMemo(
    () =>
      transactions.map((tx) =>
        tx.direction === "received" ? tx.fromAddress : tx.toAddress
      ),
    [transactions]
  );
  const { getUsername } = useAddressUsernames(counterparties);

  const body = (() => {
    if (loading && transactions.length === 0) {
      return <EmptyRow>Loading...</EmptyRow>;
    }

    if (error) {
      return <EmptyRow>Could not load your history{error ? `: ${error}` : "."}</EmptyRow>;
    }

    if (transactions.length === 0) {
      return (
        <EmptyRow>
          Nothing here yet. Money you send or receive shows up straight away.
        </EmptyRow>
      );
    }

    return transactions.map((tx) => {
      const inflow = tx.direction === "received";
      const counterparty = inflow ? tx.fromAddress : tx.toAddress;

      // The history join already carries a name, which reads better than an
      // address. The username lookup is the fallback, and the address the last.
      const user = inflow ? tx.fromUser : tx.toUser;
      const username = getUsername(counterparty);
      const who =
        user?.fullName || (username ? `@${username}` : shortAddress(counterparty));

      const when = formatWhen(tx.timestamp);

      return (
        <tr
          key={tx.id}
          className="[&>td]:border-b [&>td]:border-surface-hairline last:[&>td]:border-b-0"
        >
          <td className="px-2 py-4">
            <span className="flex items-center gap-2">
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full outline outline-[0.3px] -outline-offset-[0.3px] ${
                  inflow
                    ? "bg-green-100 outline-green-400"
                    : "bg-red-50 outline-orange-700"
                }`}
              >
                <Image
                  src={
                    inflow
                      ? "/icons/arrow-up-right-01 (1).svg"
                      : "/icons/arrow-up-right-01.svg"
                  }
                  alt=""
                  width={12}
                  height={12}
                  className="size-3"
                />
              </span>
              <span className="font-raleway text-xs font-semibold leading-4 text-zinc-600">
                {inflow ? "Received" : "Sent"}
              </span>
            </span>
          </td>

          <td className="px-2 py-4 text-center">
            <span className="text-xs font-semibold leading-4 text-neutral-500">
              {tx.description || tx.memo || "__"}
            </span>
          </td>

          <td className="px-2 py-4 text-center">
            <span className="text-xs font-semibold leading-4 text-neutral-500">{who}</span>
          </td>

          <td className="px-2 py-4 text-center">
            <span className="text-xs font-semibold leading-4 text-neutral-800">
              {formatAmount(tx.displayAmount)}
            </span>
          </td>

          <td className="px-2 py-4">
            <span className="flex justify-center">
              <StatusPill status={tx.status} />
            </span>
          </td>

          <td className="px-2 py-4">
            <span className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold leading-4 text-neutral-800">
                {when.date}
              </span>
              {when.time ? (
                <span className="text-xs leading-3 text-zinc-600">{when.time}</span>
              ) : null}
            </span>
          </td>
        </tr>
      );
    });
  })();

  return (
    <section className="flex h-full flex-col gap-6 rounded-lg bg-white p-5 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-100">
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-4 py-2">
          <h2 className="font-nohemi text-base font-medium leading-5 text-neutral-600">
            Transaction History
          </h2>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloadDisabled}
            className="flex shrink-0 items-center gap-2 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Image
              src="/icons/vuesax/outline/document-download.svg"
              alt=""
              width={14}
              height={14}
              className="size-3.5"
            />
            <span className="font-bricolage">Download</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              label="Filter by month"
              value={month}
              options={months}
              onChange={onMonthChange}
            />
            <p className="font-nohemi text-base">
              <span className="text-zinc-500">In :</span>{" "}
              <span className="text-zinc-600">₦{formatNaira(incoming)}</span>
            </p>
            <p className="font-nohemi text-base">
              <span className="text-zinc-500">Out :</span>{" "}
              <span className="text-zinc-600">₦{formatNaira(outgoing)}</span>
            </p>
          </div>

          <Select
            label="Filter by status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => onStatusChange(value as StatusFilter)}
          />
        </div>
      </div>

      {/* Caps at roughly a dozen rows and scrolls past that, so a busy month
          cannot push the cards beside it off the screen. */}
      <div className="-mx-1 max-h-[560px] flex-1 overflow-y-auto overflow-x-auto px-1">
        <table className="w-full min-w-[720px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="text-left">
              <Th className="w-28 text-left">Type</Th>
              <Th className="w-64">Description</Th>
              <Th className="w-44">From / To</Th>
              <Th className="w-48">
                Amount <span className="font-bold">({symbol || "--"})</span>
              </Th>
              <Th className="w-28">Status</Th>
              <Th className="w-36">Date</Th>
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
    </section>
  );
}

function Th({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <th
      scope="col"
      className={`border-y border-gray-100 bg-neutral-100 px-4 py-4 text-center text-xs font-normal uppercase tracking-wide text-neutral-600 ${className}`}
    >
      {children}
    </th>
  );
}

function EmptyRow({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <tr>
      <td colSpan={6} className="py-16 text-center text-sm text-gray-500">
        {children}
      </td>
    </tr>
  );
}
