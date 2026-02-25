"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function useCngnTransferActivity(params?: {
  blockRange?: bigint;
  decimals?: number;
  enrichLimit?: number;
}) {
  const account = useActiveAccount();
  const walletAddress = account?.address as `0x${string}` | undefined;

  const tokenAddress = process.env.NEXT_PUBLIC_CNGN_ADDRESS as
    | `0x${string}`
    | undefined;
  const decimals = params?.decimals ?? 6;
  const enrichLimit = params?.enrichLimit ?? 3;
  // ~50k blocks covers roughly a week on Base Sepolia (~2s block time).
  // Increase if you need more history, but be aware of RPC call volume.
  const blockRange = params?.blockRange ?? BigInt(50000);

  const contract = useMemo(() => {
    if (!tokenAddress) return null;
    return getContract({
      address: tokenAddress,
      chain: baseSepolia,
      client: thirdwebClient,
    });
  }, [tokenAddress]);

  const [rows, setRows] = useState<CngnTransferRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const handler = () => {
      setRefreshNonce((n) => n + 1);
    };

    window.addEventListener("cngn:activity:refresh", handler);
    return () => {
      window.removeEventListener("cngn:activity:refresh", handler);
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

        const deduped = new Map<string, (typeof raw)[number]>();
        for (const e of raw) {
          const txHash = (e.transactionHash || "") as string;
          const logIndex = String(e.logIndex ?? "");
          const key = `${txHash}:${logIndex}`;
          if (!deduped.has(key)) deduped.set(key, e);
        }

        const normalized: CngnTransferRow[] = Array.from(deduped.values())
          .map((e) => {
            const args = e.args as unknown as { from?: string; to?: string; value?: bigint } | undefined;
            const from = ((args?.from || "") as `0x${string}`) || "";
            const to = ((args?.to || "") as `0x${string}`) || "";
            const value = args?.value ?? BigInt(0);

            const direction: CngnTransferRow["direction"] =
              to.toLowerCase() === walletAddress.toLowerCase()
                ? "incoming"
                : "outgoing";

            const counterparty = (direction === "incoming" ? from : to);
            const amount = Number.parseFloat(formatUnits(value, decimals));

            const maybeTimestamp = (e as unknown as { blockTimestamp?: string })
              .blockTimestamp;
            const timestamp = maybeTimestamp
              ? Math.floor(new Date(maybeTimestamp).getTime() / 1000)
              : undefined;

            return {
              id: `${e.transactionHash}:${String(e.logIndex ?? "")}`,
              direction,
              counterparty,
              amount,
              transactionHash: e.transactionHash,
              blockNumber: e.blockNumber,
              timestamp,
            };
          })
          .filter((r) => r.counterparty && r.transactionHash)
          .sort((a, b) =>
            Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0))),
          );
        const withMeta = await enrichWithBlockAndGas(contract, normalized, enrichLimit, shouldCancel);
        if (cancelled) return;
        setRows(withMeta);
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
  }, [walletAddress, contract, blockRange, decimals, enrichLimit, refreshNonce]);

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
    rows,
    incomingTotal,
    outgoingTotal,
    latestIncomingAmount,
    latestOutgoingAmount,
    monthly,
    toShortAddress,
  };
}
