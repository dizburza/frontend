"use client";

import { useCallback, useMemo } from "react";
import { useCachedResource } from "@/hooks/useCachedResource";
import { useSessionIdentity } from "@/hooks/useSessionIdentity";
import { TRANSACTION_HISTORY_ENABLED } from "@/lib/features";
import {
  ChartBucket,
  TransactionChart,
  TransactionRange,
  TransactionSummary,
  fetchTransactionChart,
  fetchTransactionSummary,
} from "@/lib/api/transactions";

const REFRESH_EVENT = "cngn:activity:refresh";

const toMonthLabel = (iso: string, bucket: ChartBucket) => {
  const d = new Date(iso);
  if (bucket === "month") return d.toLocaleString(undefined, { month: "short" });
  if (bucket === "week" || bucket === "day") {
    return d.toLocaleString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleString(undefined, { hour: "numeric" });
};

/**
 * Dashboard activity, served by the backend indexer.
 *
 * Replaces the previous approach of scanning 200k blocks of eth_getLogs in
 * 900-block chunks from the browser (~446 RPC round trips per load, for under
 * five days of history). Totals and chart buckets are now aggregated in Mongo
 * and cached across reloads.
 */
export default function useTransactionActivity(params?: {
  walletAddress?: string;
  range?: TransactionRange;
  bucket?: ChartBucket;
  staleTimeMs?: number;
}) {
  // Session rather than wallet, so the cache key exists on first paint instead
  // of waiting for the smart account to restore. See useSessionIdentity.
  const { address: sessionAddress } = useSessionIdentity();
  const walletAddress = (params?.walletAddress || sessionAddress || "").toLowerCase();

  const range = params?.range ?? "1y";
  const bucket = params?.bucket ?? "month";
  const staleTimeMs = params?.staleTimeMs ?? 60_000;

  const active = walletAddress && TRANSACTION_HISTORY_ENABLED;
  const summaryKey = active ? `summary:${walletAddress}:${range}` : null;
  const chartKey = active ? `chart:${walletAddress}:${range}:${bucket}` : null;

  const summaryFetcher = useCallback(
    () => fetchTransactionSummary(walletAddress, range),
    [walletAddress, range]
  );

  const chartFetcher = useCallback(
    () => fetchTransactionChart(walletAddress, { range, bucket }),
    [walletAddress, range, bucket]
  );

  const summary = useCachedResource<TransactionSummary>(summaryKey, summaryFetcher, {
    staleTimeMs,
    refreshEvent: REFRESH_EVENT,
  });

  const chart = useCachedResource<TransactionChart>(chartKey, chartFetcher, {
    staleTimeMs,
    refreshEvent: REFRESH_EVENT,
  });

  const monthly = useMemo(() => {
    const points = chart.data?.points ?? [];
    return points.map((p) => ({
      month: toMonthLabel(p.bucketStart, chart.data?.bucket ?? bucket),
      incoming: p.incoming,
      outgoing: p.outgoing,
    }));
  }, [chart.data, bucket]);

  const incomingTotal = Number.parseFloat(summary.data?.inflowAmount ?? "0") || 0;
  const outgoingTotal = Number.parseFloat(summary.data?.outflowAmount ?? "0") || 0;

  // Depend on the stable refresh callbacks, not the resource objects, so this
  // identity survives re-renders and is safe in a consumer's dependency array.
  const { refresh: refreshSummary } = summary;
  const { refresh: refreshChart } = chart;
  const refresh = useCallback(() => {
    refreshSummary();
    refreshChart();
  }, [refreshSummary, refreshChart]);

  return {
    walletAddress,
    isLoading: summary.isLoading || chart.isLoading,
    isValidating: summary.isValidating || chart.isValidating,
    error: summary.error ?? chart.error,
    lastUpdatedAt: summary.lastUpdatedAt,
    incomingTotal,
    outgoingTotal,
    transactionCount: summary.data?.totalCount ?? 0,
    monthly,
    refresh,
  };
}
