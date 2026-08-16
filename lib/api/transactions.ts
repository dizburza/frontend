export type TransactionRange = "1h" | "24h" | "7d" | "30d" | "90d" | "1y" | "all";
export type ChartBucket = "hour" | "day" | "week" | "month";

export interface TransactionSummary {
  walletAddress: string;
  status: string;
  totalCount: number;
  inflowCount: number;
  outflowCount: number;
  inflowAmount: string;
  outflowAmount: string;
  inflowAmountRaw: string;
  outflowAmountRaw: string;
}

export interface ChartPoint {
  bucketStart: string;
  incoming: number;
  outgoing: number;
  incomingRaw: string;
  outgoingRaw: string;
  count: number;
}

export interface TransactionChart {
  walletAddress: string;
  bucket: ChartBucket;
  range: TransactionRange;
  points: ChartPoint[];
}

export interface BalanceView {
  address: string;
  raw: string;
  decimals: number;
  formatted: string;
  fetchedAt: string;
  stale: boolean;
}

export interface TransactionRow {
  id: string;
  txHash: string;
  logIndex?: number;
  type: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  currency: string;
  fee?: string;
  gasUsed?: string;
  blockNumber?: number;
  status: string;
  timestamp: string;
  direction: "sent" | "received";
  displayAmount: string;
}

export interface TransactionHistory {
  transactions: TransactionRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

async function apiGet<T>(endpoint: string): Promise<T> {

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  const response = await fetch(`/api${endpoint}`, {
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.message || `HTTP ${response.status}`);
  }

  const json = await response.json();
  // Backend wraps payloads as { success, data }.
  return (json?.data ?? json) as T;
}

const withRange = (params: URLSearchParams, range?: TransactionRange) => {
  if (range && range !== "all") params.set("range", range);
  return params;
};

export async function fetchTransactionSummary(
  address: string,
  range?: TransactionRange
): Promise<TransactionSummary> {
  const params = withRange(new URLSearchParams(), range);
  const query = params.toString();
  return apiGet(`/transactions/${address}/summary${query ? `?${query}` : ""}`);
}

export async function fetchTransactionChart(
  address: string,
  options?: { range?: TransactionRange; bucket?: ChartBucket }
): Promise<TransactionChart> {
  const params = withRange(new URLSearchParams(), options?.range);
  if (options?.bucket) params.set("bucket", options.bucket);
  const query = params.toString();
  return apiGet(`/transactions/${address}/chart${query ? `?${query}` : ""}`);
}

export async function fetchTransactionHistory(
  address: string,
  options?: { range?: TransactionRange; page?: number; limit?: number }
): Promise<TransactionHistory> {
  const params = withRange(new URLSearchParams(), options?.range);
  if (options?.page) params.set("page", String(options.page));
  if (options?.limit) params.set("limit", String(options.limit));
  const query = params.toString();
  return apiGet(`/transactions/${address}${query ? `?${query}` : ""}`);
}

export async function fetchBalance(address: string): Promise<BalanceView> {
  return apiGet(`/balances/${address}`);
}

/**
 * Hand a just-submitted transaction to the backend to confirm server-side.
 * Replaces the browser holding a 90-second receipt-polling loop open behind a
 * blocking overlay. The result arrives over the realtime stream instead.
 */
export async function watchTransaction(txHash: string): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  await fetch("/api/transactions/watch", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ txHash }),
  }).catch(() => {
    // Best-effort: the block cursor indexes it regardless, just less promptly.
  });
}

/**
 * Ask the backend to index a transaction it may not have seen yet. Only the
 * hash is sent. The server reads amounts and addresses back from the chain.
 * Purely a latency shortcut; the indexer would pick it up regardless.
 */
export async function recordTransaction(
  txHash: string,
  meta?: { description?: string; memo?: string; category?: string }
): Promise<void> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  await fetch("/api/transactions/record", {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ txHash, ...meta }),
  });
}
