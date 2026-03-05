"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { getContractEvents, prepareEvent, type PreparedEvent } from "thirdweb/event";
import { eth_blockNumber, eth_getBlockByNumber, eth_getTransactionReceipt, getRpcClient } from "thirdweb/rpc";
import type { AbiEvent } from "abitype";
import { formatUnits } from "viem";
import { thirdwebClient } from "@/app/client";

export type CngnTransferRow = {
  id: string;
  direction: "incoming" | "outgoing";
  counterparty: `0x${string}`;
  amount: number;
  transactionHash: `0x${string}`;
  blockNumber?: bigint;
  timestamp?: number;
  gasFeeEth?: number;
};

const toShortAddress = (address: string) => {
  if (!address) return "--";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

const toMonthKey = (unixSeconds: number) => {
  const d = new Date(unixSeconds * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

const toMonthLabel = (key: string) => {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString(undefined, { month: "short" });
};

// Base Sepolia RPC caps eth_getLogs at 1000 blocks per request.
// We use 900 to stay safely under the limit.
const RPC_CHUNK_SIZE = BigInt(900);

const clampChunkTo = (chunkFrom: bigint, toBlock: bigint) => {
  const maxChunkTo = chunkFrom + RPC_CHUNK_SIZE - BigInt(1);
  let chunkTo = maxChunkTo;
  if (chunkTo > toBlock) chunkTo = toBlock;
  return chunkTo;
};

const fetchContractEventsChunked = async (
  contract: NonNullable<ReturnType<typeof getContract>>,
  preparedEvent: PreparedEvent<AbiEvent>,
  fromBlock: bigint,
  toBlock: bigint,
  shouldCancel: () => boolean,
) => {
  const results = [] as Awaited<ReturnType<typeof getContractEvents>>;
  let chunkFrom = fromBlock;

  while (chunkFrom <= toBlock) {
    if (shouldCancel()) return results;

    const chunkTo = clampChunkTo(chunkFrom, toBlock);
    const events = await getContractEvents({
      contract,
      fromBlock: chunkFrom,
      toBlock: chunkTo,
      useIndexer: false,
      events: [preparedEvent],
    });

    results.push(...events);
    chunkFrom = chunkTo + BigInt(1);
  }

  return results;
};

const enrichWithBlockAndGas = async (
  contract: NonNullable<ReturnType<typeof getContract>>,
  rows: CngnTransferRow[],
  enrichLimit: number,
  shouldCancel: () => boolean,
) => {
  const rpcRequest = getRpcClient(contract);
  const blockTimestampCache = new Map<string, number>();
  const target = rows.slice(0, Math.max(0, enrichLimit));

  const enriched = await Promise.all(
    target.map(async (r) => {
      if (shouldCancel() || !r.blockNumber) return r;

      const blockKey = r.blockNumber.toString();
      let ts = blockTimestampCache.get(blockKey);
      if (ts === undefined) {
        const block = await eth_getBlockByNumber(rpcRequest, {
          blockNumber: r.blockNumber,
          includeTransactions: false,
        });
        ts = Number(block.timestamp);
        blockTimestampCache.set(blockKey, ts);
      }

      let gasFeeEth: number | undefined;
      try {
        const receipt = await eth_getTransactionReceipt(rpcRequest, {
          hash: r.transactionHash,
        });
        const feeWei = receipt.gasUsed * receipt.effectiveGasPrice;
        gasFeeEth = Number.parseFloat(formatUnits(feeWei, 18));
      } catch {
        gasFeeEth = undefined;
      }

      return {
        ...r,
        timestamp: ts,
        gasFeeEth,
      };
    }),
  );

  return [...enriched, ...rows.slice(target.length)];
};

const logIndexToString = (logIndex: unknown): string => {
  if (logIndex === null || logIndex === undefined) return "";
  if (typeof logIndex === "string") return logIndex;
  if (
    typeof logIndex === "number" ||
    typeof logIndex === "bigint" ||
    typeof logIndex === "boolean"
  ) {
    return String(logIndex);
  }

  if (typeof logIndex === "object") {
    const maybeToString = (logIndex as { toString?: unknown }).toString;
    if (typeof maybeToString === "function" && maybeToString !== Object.prototype.toString) {
      return maybeToString.call(logIndex) as string;
    }

    try {
      return JSON.stringify(logIndex);
    } catch {
      return "";
    }
  }

  if (typeof logIndex === "symbol") return logIndex.description ?? "";

  return "";
};

const dedupeContractEvents = <T extends { transactionHash?: string; logIndex?: unknown }>(
  events: T[],
) => {
  const deduped = new Map<string, T>();
  for (const e of events) {
    const txHash = (e.transactionHash || "");
    const logIndex = logIndexToString(e.logIndex);
    const key = `${txHash}:${logIndex}`;
    if (!deduped.has(key)) deduped.set(key, e);
  }
  return Array.from(deduped.values());
};

const normalizeTransferEventsToRows = (
  events: Array<{
    args?: unknown;
    transactionHash: `0x${string}`;
    logIndex?: unknown;
    blockNumber?: bigint;
    blockTimestamp?: string;
  }>,
  walletAddress: `0x${string}`,
  decimals: number,
): CngnTransferRow[] => {
  const walletLower = walletAddress.toLowerCase();

  return events
    .map((e) => {
      const args = e.args as
        | { from?: string; to?: string; value?: bigint }
        | undefined;
      const from = ((args?.from || "") as `0x${string}`) || "";
      const to = ((args?.to || "") as `0x${string}`) || "";
      const value = args?.value ?? BigInt(0);

      const direction: CngnTransferRow["direction"] =
        to.toLowerCase() === walletLower ? "incoming" : "outgoing";

      const counterparty = direction === "incoming" ? from : to;
      const amount = Number.parseFloat(formatUnits(value, decimals));

      const timestamp = e.blockTimestamp
        ? Math.floor(new Date(e.blockTimestamp).getTime() / 1000)
        : undefined;

      return {
        id: `${e.transactionHash}:${logIndexToString(e.logIndex)}`,
        direction,
        counterparty,
        amount,
        transactionHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp,
      } satisfies CngnTransferRow;
    })
    .filter((r) => r.counterparty && r.transactionHash)
    .sort((a, b) =>
      Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0))),
    );
};

type ActivityCacheEntry = {
  rows: CngnTransferRow[];
  lastUpdatedAt: number | null;
  fetchedAt: number;
};

const ACTIVITY_CACHE = new Map<string, ActivityCacheEntry>();

export default function useCngnTransferActivity(params?: {
  blockRange?: bigint;
  decimals?: number;
  enrichLimit?: number;
  staleTimeMs?: number;
  walletAddress?: `0x${string}`;
}) {
  const account = useActiveAccount();
  const walletAddress =
    params?.walletAddress || (account?.address as `0x${string}` | undefined);

  const tokenAddress = process.env.NEXT_PUBLIC_CNGN_ADDRESS as
    | `0x${string}`
    | undefined;
  const decimals = params?.decimals ?? 6;
  const enrichLimit = params?.enrichLimit ?? 3;
  const staleTimeMs = params?.staleTimeMs ?? 60_000;
  const blockRange = params?.blockRange ?? BigInt(200000);

  const contract = useMemo(() => {
    if (!tokenAddress) return null;
    return getContract({
      address: tokenAddress,
      chain: baseSepolia,
      client: thirdwebClient,
    });
  }, [tokenAddress]);

  const cacheKey = useMemo(() => {
    const w = (walletAddress || "").toLowerCase();
    const t = (tokenAddress || "").toLowerCase();
    return `cngn:activity:${t}:${w}:${blockRange.toString()}:${decimals}:${enrichLimit}`;
  }, [walletAddress, tokenAddress, blockRange, decimals, enrichLimit]);

  const cached = ACTIVITY_CACHE.get(cacheKey);

  const [rows, setRows] = useState<CngnTransferRow[]>(() => cached?.rows ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(() => cached?.lastUpdatedAt ?? null);

  const lastRefreshNonceRef = useRef<number>(refreshNonce);

  useEffect(() => {
    const handler = () => {
      setRefreshNonce((n) => n + 1);
    };

    globalThis.addEventListener("cngn:activity:refresh", handler);
    return () => {
      globalThis.removeEventListener("cngn:activity:refresh", handler);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!walletAddress || !contract) {
        setRows([]);
        return;
      }
      const shouldCancel = () => cancelled;

      const forceRefresh = refreshNonce !== lastRefreshNonceRef.current;
      lastRefreshNonceRef.current = refreshNonce;

      const existing = ACTIVITY_CACHE.get(cacheKey);
      const isFresh =
        existing && Date.now() - existing.fetchedAt < staleTimeMs;

      if (!forceRefresh && isFresh) {
        setRows(existing.rows);
        setLastUpdatedAt(existing.lastUpdatedAt);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const rpcRequest = getRpcClient(contract);
        const latestBlock = await eth_blockNumber(rpcRequest);
        const fromBlock =
          latestBlock > blockRange
            ? latestBlock - blockRange + BigInt(1)
            : BigInt(0);

        const transferTo = prepareEvent({
          signature:
            "event Transfer(address indexed from, address indexed to, uint256 value)",
          filters: { to: walletAddress },
        });

        const transferFrom = prepareEvent({
          signature:
            "event Transfer(address indexed from, address indexed to, uint256 value)",
          filters: { from: walletAddress },
        });

        const [incomingEvents, outgoingEvents] = await Promise.all([
          fetchContractEventsChunked(contract, transferTo, fromBlock, latestBlock, shouldCancel),
          fetchContractEventsChunked(contract, transferFrom, fromBlock, latestBlock, shouldCancel),
        ]);

        if (cancelled) return;

        const raw = [...incomingEvents, ...outgoingEvents];

        const deduped = dedupeContractEvents(raw);
        const normalized = normalizeTransferEventsToRows(
          deduped as unknown as Array<{
            args?: unknown;
            transactionHash: `0x${string}`;
            logIndex?: unknown;
            blockNumber?: bigint;
            blockTimestamp?: string;
          }>,
          walletAddress,
          decimals,
        );
        const withMeta = await enrichWithBlockAndGas(contract, normalized, enrichLimit, shouldCancel);
        if (cancelled) return;
        setRows(withMeta);
        const now = Date.now();
        setLastUpdatedAt(now);
        ACTIVITY_CACHE.set(cacheKey, {
          rows: withMeta,
          lastUpdatedAt: now,
          fetchedAt: now,
        });
      } catch (e) {
        if (cancelled) return;
        const err =
          e instanceof Error ? e : new Error("Failed to fetch transfers");
        setError(err);
        setRows([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void run();

    // Cleanup: if the effect re-runs before the fetch completes, abandon the
    // stale fetch so it doesn't overwrite newer results.
    return () => {
      cancelled = true;
    };
  }, [walletAddress, contract, cacheKey, staleTimeMs, blockRange, decimals, enrichLimit, refreshNonce]);

  const incomingTotal = rows
    .filter((r) => r.direction === "incoming")
    .reduce((acc, r) => acc + r.amount, 0);

  const outgoingTotal = rows
    .filter((r) => r.direction === "outgoing")
    .reduce((acc, r) => acc + r.amount, 0);

  const latestIncomingAmount =
    rows.find((r) => r.direction === "incoming")?.amount ?? 0;
  const latestOutgoingAmount =
    rows.find((r) => r.direction === "outgoing")?.amount ?? 0;

  const monthly = (() => {
    const buckets = new Map<string, { incoming: number; outgoing: number }>();

    for (const r of rows) {
      if (!r.timestamp) continue;
      const key = toMonthKey(r.timestamp);
      const prev = buckets.get(key) || { incoming: 0, outgoing: 0 };
      if (r.direction === "incoming") prev.incoming += r.amount;
      else prev.outgoing += r.amount;
      buckets.set(key, prev);
    }

    const keys = Array.from(buckets.keys()).sort((a, b) => a.localeCompare(b));
    const last = keys.slice(-10);

    return last.map((key) => ({
      month: toMonthLabel(key),
      incoming: buckets.get(key)?.incoming ?? 0,
      outgoing: buckets.get(key)?.outgoing ?? 0,
    }));
  })();

  return {
    walletAddress,
    tokenAddress,
    isLoading,
    error,
    lastUpdatedAt,
    rows,
    incomingTotal,
    outgoingTotal,
    latestIncomingAmount,
    latestOutgoingAmount,
    monthly,
    toShortAddress,
  };
}
