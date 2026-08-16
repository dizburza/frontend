"use client";

import { privateKeyToAccount } from "thirdweb/wallets";
import { thirdwebClient } from "@/app/client";

/**
 * Send by link.
 *
 * A link is a throwaway keypair. Its address is the link's id on chain, and the
 * private key is the credential: whoever holds it can sign a claim naming
 * themselves as the recipient, and nobody else can name anyone.
 *
 * The key travels in the URL **fragment**, which browsers never send to a
 * server. It is not in the path, not in a query string, and never posted here.
 * That is what keeps it out of access logs, referrer headers and this app's own
 * database.
 */

export type CashLinkConfig = {
  enabled: boolean;
  contractAddress: string | null;
  chainId: number;
  defaultWindowSeconds: number;
  name: string;
  version: string;
};

export type CashLinkQuote = {
  amount: string;
  fee: string;
  total: string;
  amountFormatted: string;
  feeFormatted: string;
  totalFormatted: string;
  symbol: string;
  decimals: number;
  windowSeconds: number;
  /**
   * The escrow pulls the tokens, so it needs an allowance. This is the one
   * transaction the sender pays for: a relayed `approve` would credit the
   * forwarder, since cNGN reads `msg.sender` and knows nothing about ERC-2771.
   */
  needsApproval: boolean;
};

export type PublicLink = {
  claimAddress: string;
  amount: string;
  amountFormatted: string;
  symbol: string;
  expiresAt: string;
  state: "claimable" | "claiming" | "settled" | "expired";
};

export type SenderLink = {
  id: string;
  claimAddress: string;
  amountFormatted: string;
  feeFormatted: string;
  description: string | null;
  status: "open" | "claiming" | "claimed" | "cancelled" | "reclaimed";
  expiresAt: string;
  claimedByAddress: string | null;
  createTxHash: string | null;
  settleTxHash: string | null;
  createdAt: string;
  settledAt: string | null;
};

export const CLAIM_TYPES = {
  Claim: [
    { name: "claimAddress", type: "address" },
    { name: "recipient", type: "address" },
  ],
} as const;

const KEY_PARAM = "k";

const api = async (path: string, init: RequestInit = {}) => {
  const res = await fetch(`/api/cashlinks${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.message ?? payload.error ?? `Request failed (${res.status})`);
  }

  return payload.data ?? payload;
};

let cachedConfig: CashLinkConfig | null = null;

export const getCashLinkConfig = async (): Promise<CashLinkConfig> => {
  cachedConfig ??= (await api("/config")) as CashLinkConfig;
  return cachedConfig;
};

/**
 * A fresh keypair per link, from the platform's CSPRNG.
 *
 * Never derived from the sender's wallet, the amount or anything else. A
 * derivable key would mean anyone who worked out the derivation could claim
 * every link ever made.
 */
export const newLinkKey = (): { privateKey: `0x${string}`; claimAddress: string } => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  const privateKey = `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    ""
  )}` as `0x${string}`;

  const account = privateKeyToAccount({ client: thirdwebClient, privateKey });

  return { privateKey, claimAddress: account.address };
};

/** The URL to send. The key is after the hash and stays in the browser. */
export const buildLinkUrl = (privateKey: string, origin?: string): string => {
  const base = origin ?? window.location.origin;
  return `${base}/claim#${KEY_PARAM}=${privateKey.replace(/^0x/, "")}`;
};

/**
 * Read the key back out of the address bar, then clear it.
 *
 * Removing it from history means a shared screen, a back button or a later
 * screenshot does not hand the link to whoever sees it. The claim page keeps
 * the key in memory for as long as it needs it.
 */
export const readLinkKey = (): `0x${string}` | null => {
  const raw = new URLSearchParams(window.location.hash.replace(/^#/, "")).get(KEY_PARAM);
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) return null;

  history.replaceState(null, "", window.location.pathname + window.location.search);

  return `0x${raw}` as `0x${string}`;
};

export const claimAddressFor = (privateKey: `0x${string}`): string =>
  privateKeyToAccount({ client: thirdwebClient, privateKey }).address;

/** Sign the claim with the link's own key, naming the claimer as recipient. */
export const signClaim = async (
  privateKey: `0x${string}`,
  recipient: string
): Promise<string> => {
  const config = await getCashLinkConfig();
  if (!config.contractAddress) throw new Error("Send by link is not available");

  const account = privateKeyToAccount({ client: thirdwebClient, privateKey });

  return account.signTypedData({
    domain: {
      name: config.name,
      version: config.version,
      chainId: config.chainId,
      verifyingContract: config.contractAddress as `0x${string}`,
    },
    types: CLAIM_TYPES,
    primaryType: "Claim",
    message: {
      claimAddress: account.address as `0x${string}`,
      recipient: recipient as `0x${string}`,
    },
  });
};

export const quoteCashLink = (amountBaseUnits: bigint): Promise<CashLinkQuote> =>
  api(`/quote?amount=${amountBaseUnits.toString()}`) as Promise<CashLinkQuote>;

export const getPublicLink = (claimAddress: string): Promise<PublicLink> =>
  api(`/${claimAddress}`) as Promise<PublicLink>;

export const recordCashLink = (input: {
  claimAddress: string;
  txHash: string;
  description?: string | null;
}): Promise<SenderLink> =>
  api("", { method: "POST", body: JSON.stringify(input) }) as Promise<SenderLink>;

export const claimCashLink = (
  claimAddress: string,
  signature: string
): Promise<{ txHash: string }> =>
  api(`/${claimAddress}/claim`, {
    method: "POST",
    body: JSON.stringify({ signature }),
  }) as Promise<{ txHash: string }>;

export const recordCashLinkCancelled = (
  claimAddress: string,
  txHash: string
): Promise<unknown> =>
  api(`/${claimAddress}/cancelled`, {
    method: "POST",
    body: JSON.stringify({ txHash }),
  });

export const listCashLinks = (): Promise<SenderLink[]> => api("") as Promise<SenderLink[]>;
