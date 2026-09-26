"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { WalletBalanceCard } from "@/components/wallet/wallet-balance-card";
import { QuickLinks } from "@/components/wallet/quick-links";
import { QrPromoCard } from "@/components/wallet/qr-promo-card";
import { EmployerBadge } from "@/components/wallet/employer-badge";
import {
  TransactionHistoryTable,
  type StatusFilter,
} from "@/components/wallet/transaction-history-table";
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow";
import { ReceiveFlow } from "@/components/receive-flow";
import { QRScanModal } from "@/components/qr-scan-modal";
import { CreateCashLinkModal } from "@/components/cashlink/create-cashlink-modal";
import { CashLinkList } from "@/components/cashlink/cashlink-list";

import useGetTokenBalance from "@/hooks/ERC20/useGetBalance";
import useTransactionActivity from "@/hooks/useTransactionActivity";
import { useSessionIdentity } from "@/hooks/useSessionIdentity";
import { useToken } from "@/hooks/useToken";
import { useTransactionHistory, useTransactionSummary } from "@/lib/api/organization";
import { fetchSessionProfile } from "@/lib/session";
import { buildTransactionCsv, downloadCsv } from "@/lib/transaction-csv";

const MONTHS_SHOWN = 12;

/** Month boundaries as ISO dates, which is what the history filters take. */
const monthRange = (value: string) => {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const buildMonths = () => {
  const now = new Date();

  return Array.from({ length: MONTHS_SHOWN }, (_, index) => {
    const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const value = `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;

    return {
      value,
      label: at.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    };
  });
};

export function WalletView() {
  const router = useRouter();
  const { symbol } = useToken();
  const { address } = useSessionIdentity();

  const balance = useGetTokenBalance();
  const { lastUpdatedAt, isLoading } = useTransactionActivity();

  const months = useMemo(buildMonths, []);
  const [month, setMonth] = useState(() => months[0].value);
  const [status, setStatus] = useState<StatusFilter>("all");

  const filters = useMemo(() => {
    const { startDate, endDate } = monthRange(month);
    return {
      startDate,
      endDate,
      status: status === "all" ? undefined : status,
    };
  }, [month, status]);

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
  } = useTransactionHistory(address, { limit: 25, page: 1, ...filters });

  const { data: summaryData } = useTransactionSummary(address, filters);

  const [profile, setProfile] = useState<{
    firstName: string;
    organizationSlug: string | null;
    jobRole: string | null;
  } | null>(null);

  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showCashLink, setShowCashLink] = useState(false);
  const [cashLinkRefresh, setCashLinkRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchSessionProfile(controller.signal)
      .then((user) => {
        if (!user) return;
        const full = (user.fullName || user.firstname || user.username || "").trim();
        setProfile({
          firstName: full.split(/\s+/)[0] || "",
          organizationSlug: user.organizationSlug || null,
          jobRole: user.jobRole || null,
        });
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  const transactions = historyData?.transactions ?? [];

  const downloadHistory = () => {
    downloadCsv(
      `transactions-${month}.csv`,
      buildTransactionCsv(transactions, symbol)
    );
  };

  return (
    <div className="flex flex-col gap-6 px-1 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-nohemi text-3xl text-gray-600 lg:text-4xl">
            Hi {profile?.firstName || "there"}!
          </h1>
          <p className="text-xs text-zinc-700">Here is what is in your wallet today.</p>
        </div>

        <EmployerBadge
          organizationSlug={profile?.organizationSlug ?? null}
          jobRole={profile?.jobRole ?? null}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,493px)]">
        <TransactionHistoryTable
          transactions={transactions}
          loading={historyLoading}
          error={historyError}
          incoming={summaryData?.inflowAmount ?? "0"}
          outgoing={summaryData?.outflowAmount ?? "0"}
          months={months}
          month={month}
          onMonthChange={setMonth}
          status={status}
          onStatusChange={setStatus}
          onDownload={downloadHistory}
          downloadDisabled={transactions.length === 0}
        />

        <div className="flex flex-col gap-4">
          <WalletBalanceCard
            address={address}
            balance={balance}
            lastUpdatedAt={lastUpdatedAt}
            isLoading={isLoading}
          />

          <QuickLinks
            onSend={() => setShowSend(true)}
            onCashLink={() => setShowCashLink(true)}
            onReceive={() => setShowReceive(true)}
            onScan={() => setShowScan(true)}
          />

          <QrPromoCard onShow={() => setShowReceive(true)} />

          <CashLinkList refreshKey={cashLinkRefresh} />
        </div>
      </div>

      <SendToCNGNFlow isOpen={showSend} onClose={() => setShowSend(false)} />
      <ReceiveFlow isOpen={showReceive} onClose={() => setShowReceive(false)} />

      {showCashLink ? (
        <CreateCashLinkModal
          onClose={() => setShowCashLink(false)}
          onCreated={() => setCashLinkRefresh((n) => n + 1)}
        />
      ) : null}

      <QRScanModal
        isOpen={showScan}
        onClose={() => setShowScan(false)}
        onDetected={({ recipient }) => {
          const value = (recipient || "").trim();
          if (!value) return;
          const params = new URLSearchParams();
          if (value.startsWith("@")) {
            params.set("username", value);
          } else {
            params.set("address", value);
          }
          router.push(`/receive?${params.toString()}`);
          setShowScan(false);
        }}
      />
    </div>
  );
}
