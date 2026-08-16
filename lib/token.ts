"use client";

/**
 * The token this deployment pays in, fetched once from the backend.
 *
 * Decimals used to be the literal 6 wherever an amount was converted. That is
 * right for cNGN, so nothing would have looked wrong until the payroll token
 * changed, at which point every salary would have been off by a power of ten
 * with no error to notice.
 */
export type TokenConfig = {
  address: string;
  symbol: string;
  name: string | null;
  decimals: number;
  logoUrl: string | null;
  chainId: number;
};

let cached: TokenConfig | null = null;
let inflight: Promise<TokenConfig> | null = null;

export const getTokenConfig = async (): Promise<TokenConfig> => {
  if (cached) return cached;

  inflight ??= fetch("/api/token", { credentials: "include" })
    .then((res) => {
      if (!res.ok) throw new Error(`Token config unavailable (HTTP ${res.status})`);
      return res.json();
    })
    .then((payload) => {
      const config = (payload.data ?? payload) as TokenConfig;
      if (typeof config?.decimals !== "number") {
        throw new Error("Token config missing decimals");
      }
      cached = config;
      return config;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
};

/** Human amount to base units. Throws rather than guessing a precision. */
export const toBaseUnits = async (amount: string | number): Promise<bigint> => {
  const { decimals } = await getTokenConfig();
  const text = String(amount).trim();
  if (!text) return BigInt(0);

  const negative = text.startsWith("-");
  const [whole, fraction = ""] = (negative ? text.slice(1) : text).split(".");

  if (!/^\d*$/.test(whole) || !/^\d*$/.test(fraction)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Truncated rather than rounded, so an over-precise input can never pay out
  // more than was typed.
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const value = BigInt((whole || "0") + padded);

  return negative ? -value : value;
};
