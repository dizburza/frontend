"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { getContractEvents, prepareEvent } from "thirdweb/event";
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

export default function useCngnTransferActivity(params?: {
  blockRange?: bigint;
  decimals?: number;
}) {
  const account = useActiveAccount();
  const walletAddress = account?.address as `0x${string}` | undefined;

  const tokenAddress = process.env.NEXT_PUBLIC_CNGN_ADDRESS as `0x${string}` | undefined;
  const decimals = params?.decimals ?? 6;
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

  useEffect(() => {
    const run = async () => {
      if (!walletAddress || !contract) {
        setRows([]);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
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
          getContractEvents({
            contract,
            blockRange,
            events: [transferTo],
          }),
          getContractEvents({
            contract,
            blockRange,
            events: [transferFrom],
          }),
        ]);

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
            const from = (e.args?.from || "");
            const to = (e.args?.to || "");
            const value = (e.args?.value ?? BigInt(0));

            const direction: CngnTransferRow["direction"] =
              to.toLowerCase() === walletAddress.toLowerCase()
                ? "incoming"
                : "outgoing";

            const counterparty =
              direction === "incoming" ? from : to;

            const amount = Number.parseFloat(formatUnits(value, decimals));

            const maybeTimestamp = (e as unknown as { blockTimestamp?: string }).blockTimestamp;
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
          .sort((a, b) => Number((b.blockNumber ?? BigInt(0)) - (a.blockNumber ?? BigInt(0))));

        setRows(normalized);
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Failed to fetch transfers");
        setError(err);
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [blockRange, contract, decimals, walletAddress]);

  const incomingTotal = rows
    .filter((r) => r.direction === "incoming")
    .reduce((acc, r) => acc + r.amount, 0);

  const outgoingTotal = rows
    .filter((r) => r.direction === "outgoing")
    .reduce((acc, r) => acc + r.amount, 0);

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
    monthly,
    toShortAddress,
  };
}
