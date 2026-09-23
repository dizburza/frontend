"use client";

import { useCallback, useMemo } from "react";
import { useCachedResource } from "@/hooks/useCachedResource";
import { useSessionIdentity } from "@/hooks/useSessionIdentity";
import { BalanceView, fetchBalance } from "@/lib/api/transactions";

const formatFromRaw = (raw: string, decimals: number): number => {
  try {
    const negative = raw.startsWith("-");
    const digits = (negative ? raw.slice(1) : raw).padStart(decimals + 1, "0");
    const whole = digits.slice(0, digits.length - decimals);
    const fraction = digits.slice(digits.length - decimals);
    const value = Number.parseFloat(`${whole}.${fraction}`);
    return negative ? -value : value;
  } catch {
    return 0;
  }
};

/**
 * Payroll token balance, read from the backend's cached value not the chain.
 *
 * The old path used thirdweb's `useWalletBalance`, which issued a fresh
 * `balanceOf` on every mount. First paint now comes from localStorage,
 * revalidation happens in the background, and confirmed changes arrive over the
 * realtime stream.
 */
export function useBalance(address?: string | null) {
  // The session's address, not the wallet's: keying off the wallet meant the
  // cache key was null for as long as the smart account took to restore, so a
  // reload showed nothing while the answer sat in localStorage unread.
  const { address: sessionAddress } = useSessionIdentity();
  const target = (address ?? sessionAddress ?? "").toLowerCase();

  const key = target ? `balance:${target}` : null;

  const fetcher = useCallback(() => fetchBalance(target), [target]);

  const resource = useCachedResource<BalanceView>(key, fetcher, {
    // Transfers invalidate this instantly over SSE, so the timer only needs to
    // catch movements the indexer can't see.
    staleTimeMs: 30_000,
  });

  const { data, mutate } = resource;

  const balance = useMemo(() => {
    if (!data) return null;
    return formatFromRaw(data.raw, data.decimals);
  }, [data]);

  /**
   * Subtract a pending outgoing amount immediately, so the figure the user sees
   * after sending matches what they just did. Reconciles on the next push.
   */
  const applyPendingDebit = useCallback(
    (amountRaw: bigint) => {
      mutate((current) => {
        if (!current) return current;
        const next = BigInt(current.raw) - amountRaw;
        return {
          ...current,
          raw: (next < BigInt(0) ? BigInt(0) : next).toString(),
        };
      });
    },
    [mutate]
  );

  return {
    address: target || null,
    balance,
    raw: data?.raw ?? null,
    // Null until the first response rather than a guessed six. Callers that
    // scale an amount must wait for the real value, since guessing wrong here
    // is a silent factor-of-a-thousand error rather than a visible failure.
    decimals: data?.decimals ?? null,
    isLoading: resource.isLoading,
    isValidating: resource.isValidating,
    error: resource.error,
    refresh: resource.refresh,
    applyPendingDebit,
  };
}

export default useBalance;
