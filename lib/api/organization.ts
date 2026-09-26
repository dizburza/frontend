import { useState, useEffect, useCallback } from "react";
import { useAuthCompleted } from "@/hooks/useAutoAuthenticate";
import { useCachedResource } from "@/hooks/useCachedResource";
import { enqueueBackendSyncJob } from "@/lib/backend-sync-queue";
import { TRANSACTION_HISTORY_ENABLED } from "@/lib/features";

// Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  contractAddress: string;
  organizationHash: string;
  creatorAddress: string;
  businessEmail: string;
  businessInfo?: {
    registrationNumber?: string;
    taxIdentificationNumber?: string;
    registrationType?: string;
  };
  signers: {
    address: string;
    name: string;
    role: "owner" | "signer";
    joinedAt: string;
    isActive: boolean;
  }[];
  quorum: number;
  employees: {
    id: string | null;
    username: string | null;
    fullName: string;
    walletAddress: string;
    avatar: string | null;
  }[];
  metadata?: {
    industry?: string;
    size?: string;
    description?: string;
  };
  settings?: {
    payrollCurrency: string;
    defaultPaymentDay?: number;
    timeZone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// API Functions
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  

  const url = endpoint.startsWith("/api/") ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    // Session lives in an httpOnly cookie, so it has to be sent explicitly.
    credentials: "include",
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    const serverMessage = errorData.message as string | undefined;
    const status = response.status;

    if (status === 401 || status === 403) {
      throw new Error(serverMessage || `HTTP ${status} (unauthorized)`);
    }

    throw new Error(serverMessage || `HTTP ${status}`);
  }
  
  return response.json();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function apiFetchWithRetry<T>(
  fn: () => Promise<T>,
  opts?: {
    attempts?: number;
    baseDelayMs?: number;
  }
): Promise<T> {
  const attempts = Math.max(1, opts?.attempts ?? 5);
  const baseDelayMs = Math.max(50, opts?.baseDelayMs ?? 500);

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : String(e);

      const retryable =
        msg.includes("HTTP 429") ||
        msg.includes("HTTP 500") ||
        msg.includes("HTTP 502") ||
        msg.includes("HTTP 503") ||
        msg.includes("HTTP 504") ||
        msg.includes("HTTP 401") ||
        msg.includes("HTTP 403") ||
        msg.toLowerCase().includes("network") ||
        msg.toLowerCase().includes("failed to fetch");

      // Idempotent replay: backend may return conflict for duplicate record.
      if (msg.includes("HTTP 409")) {
        throw e;
      }

      if (!retryable || attempt === attempts) {
        throw e;
      }

      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

// Types from backend
export interface ApiEmployee {
  _id: string;
  /** The organization_members row, which is what employee actions address. */
  membershipId?: string;
  username: string;
  displayUsername?: string;
  surname: string;
  firstname: string;
  fullName: string;
  walletAddress: string;
  email?: string;
  phoneNumber?: string;
  /** "invited" until the person claims their row and connects a wallet. */
  status?: "invited" | "joined";
  avatar?: string;
  role: string;
  isSigner?: boolean;
  /** False once suspended. Older responses predate the field and are active. */
  isActive?: boolean;
  lastAudit?: {
    action?: "ADD" | "UPDATE" | "REMOVE";
    createdAt?: string;
    performedByUsername?: string;
    performedByWalletAddress?: string;
  } | null;
  jobDetails?: {
    jobRole?: string;
    salary?: string;
    salaryFormatted?: string;
    currency?: string;
    department?: string;
    joinedAt?: string;
    employeeId?: string;
  };
  createdAt: string;
}

export interface ApiPaymentBatch {
  id: string;
  batchName: string;
  organizationId: string;
  organizationAddress: string;
  creatorAddress: string;
  creatorJobRole?: string;
  recipients: {
    userId?: string;
    walletAddress: string;
    amount: string;
    employeeName: string;
    kind?: "employee" | "tax_authority";
  }[];
  totalAmount: string;
  totalAmountFormatted?: string;
  status: "pending" | "approved" | "executed" | "cancelled" | "expired";
  approvals: {
    signerAddress: string;
    signerName: string;
    approvedAt: string;
  }[];
  approvalCount: number;
  quorumRequired: number;
  submittedAt: string;
  expiresAt: string;
  executedAt?: string;
  executedBy?: string;
  txHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeesResponse {
  organization: {
    name: string;
    slug: string;
  };
  employees: ApiEmployee[];
  totalEmployees: number;
  signersCount?: number;
}

export interface BatchesResponse {
  organization: {
    name: string;
    slug: string;
  };
  batches: ApiPaymentBatch[];
  totalBatches: number;
  stats: {
    pending: number;
    approved: number;
    executed: number;
    cancelled: number;
  };
}

// The history join attaches names only, never an id.
export interface ApiTransactionUser {
  username: string;
  fullName: string | null;
}

export interface ApiTransaction {
  id: string;
  txHash: string;
  type: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  currency?: string;
  /** Gas paid on this transfer, in token base units. */
  fee?: string;
  /** `fee` scaled by the token's decimals, so the browser never needs them. */
  feeFormatted?: string;
  gasUsed?: string;
  /** What the user was actually charged, in token base units. */
  chargedFee?: string;
  chargedFeeFormatted?: string;
  /** PAYE withheld on this transfer, formatted from the token's decimals. */
  taxFormatted?: string;
  description?: string;
  memo?: string;
  category?: string;
  batchId?: string;
  batchName?: string;
  organizationId?: string;
  blockNumber?: number;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  direction?: "sent" | "received";
  displayAmount?: string;
  fromUserId?: string | null;
  toUserId?: string | null;
  fromUser?: ApiTransactionUser | null;
  toUser?: ApiTransactionUser | null;
}

export interface TransactionHistoryResponse {
  transactions: ApiTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface TransactionSummaryResponse {
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

export interface CreateOrganizationRequest {
  name: string;
  contractAddress: string;
  organizationHash?: string;
  creatorAddress: string;
  businessEmail: string;
  businessInfo?: {
    registrationNumber?: string;
    taxIdentificationNumber?: string;
    registrationType?: string;
  };
  signers: {
    address: string;
    name: string;
    role: string;
  }[];
  quorum: number;
  metadata?: {
    industry?: string;
    size?: string;
    description?: string;
  };
  settings?: {
    payrollCurrency?: string;
    defaultPaymentDay?: number;
    timeZone?: string;
  };
  /** Set when the creator said they are on their own payroll. */
  creatorEmployment?: {
    jobRole: string;
    /** The human figure; the backend scales it by the token's decimals. */
    salary: string;
  };
}

// API Functions
export async function fetchOrganizationBySlug(slug: string): Promise<Organization> {
  const response = await apiFetch(`/api/organizations/slug/${slug}`);
  // API returns { success: true, data: {...} }, extract the data
  return response.data || response;
}

export async function fetchOrganizationEmployees(organizationId: string): Promise<EmployeesResponse> {
  const response = await apiFetch(`/api/organizations/${organizationId}/employees`);
  // API returns { success: true, data: {...} }, extract the data
  return response.data || response;
}

export async function fetchOrganizationBatches(organizationId: string): Promise<BatchesResponse> {
  return apiFetch(`/api/payroll/organizations/${organizationId}/batches`);
}

export async function recordBatchCreation(payload: {
  batchName: string;
  organizationId: string;
  organizationAddress: string;
  creatorAddress: string;
  recipients: {
    userId?: string;
    walletAddress: string;
    amount: string;
    employeeName: string;
    kind?: "employee" | "tax_authority";
  }[];
}): Promise<ApiPaymentBatch> {
  try {
    const response = await apiFetchWithRetry(
      () =>
        apiFetch(`/api/payroll/batches`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      { attempts: 5, baseDelayMs: 500 }
    );
    return response.data || response;
  } catch (e) {
    enqueueBackendSyncJob({ endpoint: "/api/payroll/batches", body: payload });
    throw e;
  }
}

export async function recordBatchApproval(
  batchName: string,
  payload: {
    signerAddress: string;
    signerName: string;
  }
): Promise<ApiPaymentBatch> {
  const endpoint = `/api/payroll/batches/${encodeURIComponent(batchName)}/approve`;
  try {
    const response = await apiFetchWithRetry(
      () =>
        apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      { attempts: 5, baseDelayMs: 500 }
    );
    return response.data || response;
  } catch (e) {
    enqueueBackendSyncJob({ endpoint, body: payload });
    throw e;
  }
}

export async function recordBatchApprovalRevocation(
  batchName: string,
  payload: {
    signerAddress: string;
  }
): Promise<ApiPaymentBatch> {
  const endpoint = `/api/payroll/batches/${encodeURIComponent(batchName)}/revoke`;
  try {
    const response = await apiFetchWithRetry(
      () =>
        apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      { attempts: 5, baseDelayMs: 500 }
    );
    return response.data || response;
  } catch (e) {
    enqueueBackendSyncJob({ endpoint, body: payload });
    throw e;
  }
}

export async function recordBatchExecution(
  batchName: string,
  payload: {
    executorAddress: string;
    txHash: string;
  }
): Promise<ApiPaymentBatch> {
  const endpoint = `/api/payroll/batches/${encodeURIComponent(batchName)}/execute`;
  try {
    const response = await apiFetchWithRetry(
      () =>
        apiFetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      { attempts: 5, baseDelayMs: 500 }
    );
    return response.data || response;
  } catch (e) {
    enqueueBackendSyncJob({ endpoint, body: payload });
    throw e;
  }
}

export async function recordBatchCancellation(batchName: string): Promise<ApiPaymentBatch> {
  const endpoint = `/api/payroll/batches/${encodeURIComponent(batchName)}/cancel`;
  try {
    const response = await apiFetchWithRetry(
      () =>
        apiFetch(endpoint, {
          method: "POST",
        }),
      { attempts: 5, baseDelayMs: 500 }
    );
    return response.data || response;
  } catch (e) {
    enqueueBackendSyncJob({ endpoint, body: {} });
    throw e;
  }
}

export async function fetchTransactionHistory(
  address: string,
  params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
): Promise<TransactionHistoryResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.type) query.set("type", params.type);
  if (params?.category) query.set("category", params.category);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  const baseUrl = `/api/transactions/${address}`;
  const url = qs ? baseUrl + "?" + qs : baseUrl;
  const response = await apiFetch(url);
  return response.data || response;
}

export async function fetchTransactionSummary(
  address: string,
  params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
): Promise<TransactionSummaryResponse> {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.category) query.set("category", params.category);
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.status) query.set("status", params.status);

  const qs = query.toString();
  const baseUrl = `/api/transactions/${address}/summary`;
  const url = qs ? baseUrl + "?" + qs : baseUrl;
  const response = await apiFetch(url);
  return response.data || response;
}

export interface IdentifierAvailability {
  registrationNumberAvailable: boolean;
  taxIdentificationNumberAvailable: boolean;
}

/**
 * A company registration and a TIN are claimed once and never reused. Checked
 * while the form is being filled in, and again before the contract is
 * deployed, since deployment cannot be undone if the record is then rejected.
 */
export async function checkOrganizationIdentifiers(input: {
  registrationNumber?: string;
  taxIdentificationNumber?: string;
}): Promise<IdentifierAvailability> {
  const params = new URLSearchParams();
  if (input.registrationNumber) params.set("registrationNumber", input.registrationNumber);
  if (input.taxIdentificationNumber) {
    params.set("taxIdentificationNumber", input.taxIdentificationNumber);
  }

  const response = await apiFetch(`/api/organizations/identifiers/available?${params}`);
  return response.data || response;
}

/** Sends a 6-digit code to the business email typed on the registration step. */
export async function sendOrganizationEmailVerification(email: string): Promise<void> {
  await apiFetch(`/api/organizations/email-verification/send`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/** Confirms the code. The backend checks this again right before deployment. */
export async function verifyOrganizationEmail(email: string, code: string): Promise<void> {
  await apiFetch(`/api/organizations/email-verification/verify`, {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function createOrganizationRecord(payload: CreateOrganizationRequest): Promise<Organization> {
  try {
    const response = await apiFetchWithRetry(
      () =>
        apiFetch(`/api/organizations`, {
          method: "POST",
          body: JSON.stringify(payload),
        }),
      { attempts: 5, baseDelayMs: 500 }
    );
    return response.data || response;
  } catch (e) {
    enqueueBackendSyncJob({ endpoint: "/api/organizations", body: payload });
    throw e;
  }
}

export async function updateOrganizationEmployee(
  organizationId: string,
  username: string,
  updates: {
    jobRole?: string;
    salary?: string;
    department?: string;
    employeeId?: string;
  }
) {
  return apiFetch(`/api/organizations/${organizationId}/employees/${encodeURIComponent(username)}`,
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
}

export async function removeOrganizationEmployee(
  organizationId: string,
  username: string
) {
  const endpoint = `/api/organizations/${organizationId}/employees/${encodeURIComponent(username)}`;
  try {
    return await apiFetchWithRetry(() => apiFetch(endpoint, { method: "DELETE" }), {
      attempts: 5,
      baseDelayMs: 500,
    });
  } catch (e) {
    enqueueBackendSyncJob({ endpoint, body: { method: "DELETE" } });
    throw e;
  }
}

/** Undo a suspension. Safe to retry: reactivating twice is a no-op the second time. */
export async function reactivateOrganizationEmployee(
  organizationId: string,
  username: string
) {
  const endpoint = `/api/organizations/${organizationId}/employees/${encodeURIComponent(username)}/reactivate`;
  try {
    return await apiFetchWithRetry(() => apiFetch(endpoint, { method: "PATCH" }), {
      attempts: 5,
      baseDelayMs: 500,
    });
  } catch (e) {
    enqueueBackendSyncJob({ endpoint, body: { method: "PATCH" } });
    throw e;
  }
}

/** Re-sends the organization's live invite link to one person still waiting on it. */
export async function remindEmployee(organizationId: string, membershipId: string) {
  return apiFetch(
    `/api/organizations/${organizationId}/employees/${encodeURIComponent(membershipId)}/remind`,
    { method: "POST" }
  );
}

export interface EmployeeSeed {
  surname: string;
  firstname: string;
  email: string;
  phone?: string;
  jobRole: string;
  salary: string;
}

export interface SeedOutcome extends EmployeeSeed {
  row: number;
  phone: string;
  status: "added" | "skipped" | "error";
  message?: string;
}

export interface SeedResults {
  added: number;
  skipped: number;
  failed: number;
  invitesSent: boolean;
  details: SeedOutcome[];
}

type SeedPayload = { employees: EmployeeSeed[] } | { csvData: string };

/** What a batch would do, before anything is written or any invitation sent. */
export async function reviewEmployees(
  organizationId: string,
  payload: SeedPayload
): Promise<SeedResults> {
  const response = await apiFetch(`/api/organizations/${organizationId}/employees/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data as SeedResults;
}

/**
 * Seeds the memberships and mails the join link.
 *
 * Not queued for background retry like the other writes here: it sends email,
 * so replaying it would invite everyone twice.
 */
export async function addEmployees(
  organizationId: string,
  payload: SeedPayload
): Promise<SeedResults> {
  const response = await apiFetch(`/api/organizations/${organizationId}/employees/batch`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data as SeedResults;
}

export interface ApiSignerChangeProposal {
  id: string;
  organizationId: string;
  organizationAddress: string;
  proposalId: string;
  subjectAddress: string;
  subjectName: string;
  isRemoval: boolean;
  signerEpoch: number;
  createdByAddress: string;
  quorumRequired: number;
  status: "pending" | "approved" | "executed" | "expired";
  submittedAt: string;
  expiresAt: string;
  executedAt?: string;
  executedBy?: string;
  txHash?: string;
  approvals: { signerAddress: string; signerName: string; approvedAt: string }[];
  approvalCount: number;
}

/** Records a proposeSignerChange() call already made on chain. */
export async function recordSignerChangeProposal(
  organizationId: string,
  payload: {
    proposalId: string;
    organizationAddress: string;
    subjectAddress: string;
    subjectName: string;
    isRemoval: boolean;
    signerEpoch: number;
    createdByName: string;
  }
): Promise<ApiSignerChangeProposal> {
  const response = await apiFetch(`/api/organizations/${organizationId}/signer-changes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data || response;
}

/** Records an approveSignerChange() call already made on chain. */
export async function recordSignerChangeApproval(
  organizationId: string,
  proposalId: string,
  payload: { signerName: string }
): Promise<ApiSignerChangeProposal> {
  const response = await apiFetch(
    `/api/organizations/${organizationId}/signer-changes/${proposalId}/approve`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return response.data || response;
}

/** Records an executeSignerChange() call already made on chain. */
export async function recordSignerChangeExecution(
  organizationId: string,
  proposalId: string,
  payload: { txHash: string }
): Promise<ApiSignerChangeProposal> {
  const response = await apiFetch(
    `/api/organizations/${organizationId}/signer-changes/${proposalId}/execute`,
    { method: "POST", body: JSON.stringify(payload) }
  );
  return response.data || response;
}

export async function fetchSignerChangeProposals(
  organizationId: string
): Promise<{ proposals: ApiSignerChangeProposal[] }> {
  const response = await apiFetch(`/api/organizations/${organizationId}/signer-changes`);
  return response.data || response;
}

/** Records a bootstrap addSigner() call already made on chain, with no proposal to attach it to. */
export async function recordBootstrapSignerAdd(
  organizationId: string,
  payload: { subjectAddress: string; subjectName: string }
): Promise<void> {
  await apiFetch(`/api/organizations/${organizationId}/signers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// React Hooks
export function useOrganizationEmployees(organizationId: string | null) {
  const [data, setData] = useState<EmployeesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = () => setRefreshKey(k => k + 1);
  
  // Retry when authentication completes
  useAuthCompleted(() => {
    if (organizationId) {
      refresh();
    }
  });
  
  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    async function loadEmployees() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchOrganizationEmployees(organizationId!);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load employees");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    loadEmployees();
    
    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey]);
  
  return { data, loading, error, refresh };
}

/**
 * Aggregated inflow/outflow totals for an address.
 *
 * Backed by the shared cache: paints from localStorage on mount, revalidates in
 * the background, and refreshes when the realtime stream reports activity for
 * this address. Previously this refetched from scratch on every page visit and
 * showed an empty state while it did.
 */
export function useTransactionSummary(
  address: string | null,
  params?: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
) {
  const type = params?.type;
  const category = params?.category;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const status = params?.status;

  const normalized = (address || "").toLowerCase();
  const filterKey = [type, category, startDate, endDate, status]
    .map((v) => v ?? "")
    .join("|");

  const key =
    normalized && TRANSACTION_HISTORY_ENABLED
      ? `summary:${normalized}:${filterKey}`
      : null;

  const fetcher = useCallback(
    () =>
      fetchTransactionSummary(normalized, {
        type,
        category,
        startDate,
        endDate,
        status,
      }),
    [normalized, type, category, startDate, endDate, status]
  );

  const resource = useCachedResource<TransactionSummaryResponse>(key, fetcher, {
    refreshEvent: "cngn:activity:refresh",
  });

  useAuthCompleted(resource.refresh);

  return {
    data: resource.data,
    loading: resource.isLoading,
    error: resource.error?.message ?? null,
    refresh: resource.refresh,
  };
}

/**
 * Paginated transaction history for an address, served from the indexer.
 *
 * Each page is cached under its own key, so paging back and forth is instant
 * rather than a fresh round trip per click.
 */
export function useTransactionHistory(
  address: string | null,
  params?: {
    page?: number;
    limit?: number;
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }
) {
  const page = params?.page;
  const limit = params?.limit;
  const type = params?.type;
  const category = params?.category;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const status = params?.status;

  const normalized = (address || "").toLowerCase();
  const filterKey = [page, limit, type, category, startDate, endDate, status]
    .map((v) => v ?? "")
    .join("|");

  const key =
    normalized && TRANSACTION_HISTORY_ENABLED
      ? `history:${normalized}:${filterKey}`
      : null;

  const fetcher = useCallback(
    () =>
      fetchTransactionHistory(normalized, {
        page,
        limit,
        type,
        category,
        startDate,
        endDate,
        status,
      }),
    [normalized, page, limit, type, category, startDate, endDate, status]
  );

  const resource = useCachedResource<TransactionHistoryResponse>(key, fetcher, {
    refreshEvent: "cngn:activity:refresh",
  });

  useAuthCompleted(resource.refresh);

  // Revalidate when the tab regains focus, so a screen left open in a
  // background tab is current the moment the user returns to it.
  const { refresh } = resource;
  useEffect(() => {
    if (!key) return;

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    globalThis.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      globalThis.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [key, refresh]);

  return {
    data: resource.data,
    loading: resource.isLoading,
    error: resource.error?.message ?? null,
    refresh: resource.refresh,
  };
}

export function useOrganizationBatches(organizationId: string | null) {
  const [data, setData] = useState<BatchesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = () => setRefreshKey(k => k + 1);
  
  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    
    async function loadBatches() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchOrganizationBatches(organizationId!);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load payment batches");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    loadBatches();
    
    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey]);
  
  return { data, loading, error, refresh };
}

/**
 * The organization behind a slug.
 *
 * Cached and deduplicated, because every card on the dashboard asks for this
 * and each one used to open its own request: one page produced five identical
 * round trips, and against a database this far away that is seconds of waiting
 * for an answer already on screen.
 */
export function useOrganizationBySlug(slug: string | null) {
  const resource = useCachedResource<Organization>(
    slug ? `organization:slug:${slug}` : null,
    () => fetchOrganizationBySlug(slug!),
    { staleTimeMs: 120_000 }
  );

  return {
    data: resource.data,
    // Only while there is nothing to show: a revalidation behind cached data
    // must not blank the page that is already rendered.
    loading: resource.isLoading,
    error: resource.error?.message ?? null,
    refresh: resource.refresh,
  };
}

// Helper to convert API employee to frontend Employee type
export function mapApiEmployeeToEmployee(apiEmployee: ApiEmployee): {
  id: string;
  membershipId?: string;
  surname: string;
  firstName: string;
  username: string;
  displayUsername?: string;
  walletAddress: string;
  email?: string;
  phoneNumber?: string;
  hasJoined: boolean;
  role: string;
  isSigner: boolean;
  isActive: boolean;
  salary: number;
  department?: string;
  employeeId?: string;
  joinedAt?: string;
  lastAudit?: {
    action?: "ADD" | "UPDATE" | "REMOVE";
    createdAt?: string;
    performedByUsername?: string;
    performedByWalletAddress?: string;
  } | null;
} {
  // Formatted by the backend, which is the only side that knows the token's
  // precision. The raw fallback is there for responses predating that field.
  const displaySalary = Number.parseFloat(apiEmployee.jobDetails?.salaryFormatted || "0");
  
  return {
    id: apiEmployee._id,
    membershipId: apiEmployee.membershipId,
    surname: apiEmployee.surname,
    firstName: apiEmployee.firstname,
    username: apiEmployee.username,
    displayUsername: apiEmployee.displayUsername,
    walletAddress: apiEmployee.walletAddress,
    email: apiEmployee.email,
    phoneNumber: apiEmployee.phoneNumber,
    // Older responses predate the field, and everything they carry came from
    // someone who had already joined.
    hasJoined: (apiEmployee.status ?? "joined") === "joined",
    role: apiEmployee.jobDetails?.jobRole || apiEmployee.role || "Employee",
    isSigner: apiEmployee.isSigner || false,
    isActive: apiEmployee.isActive ?? true,
    salary: displaySalary,
    department: apiEmployee.jobDetails?.department,
    employeeId: apiEmployee.jobDetails?.employeeId,
    joinedAt: apiEmployee.jobDetails?.joinedAt,
    lastAudit: apiEmployee.lastAudit || null,
  };
}

// Helper to convert API batch to frontend PaymentBatch type
export function mapApiBatchToPaymentBatch(apiBatch: ApiPaymentBatch): {
  id: string;
  batchName: string;
  creatorAddress: string;
  creatorJobRole?: string;
  totalAmount: number;
  date: string;
  employees: number;
  status: string;
  statusRaw: ApiPaymentBatch["status"];
  approvalCount: number;
  quorumRequired: number;
  approvalSignerAddresses: string[];
  approvals: { signerName: string; signerAddress: string; approvedAt: string }[];
  txHash?: string;
  recipients: { surname: string; firstName: string; salary: string }[];
} {
  const displayTotal = Number.parseFloat(apiBatch.totalAmountFormatted || "0");

  return {
    id: apiBatch.id,
    batchName: apiBatch.batchName,
    creatorAddress: apiBatch.creatorAddress,
    creatorJobRole: apiBatch.creatorJobRole,
    totalAmount: displayTotal,
    date: new Date(apiBatch.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    // The PAYE leg is a recipient of the same batch, so it is excluded here
    // rather than counted as another person being paid.
    employees: apiBatch.recipients.filter((r) => r.kind !== "tax_authority").length,
    status: apiBatch.status.charAt(0).toUpperCase() + apiBatch.status.slice(1),
    statusRaw: apiBatch.status,
    approvalCount: apiBatch.approvalCount,
    quorumRequired: apiBatch.quorumRequired,
    approvalSignerAddresses: (apiBatch.approvals || []).map((a) => a.signerAddress),
    approvals: (apiBatch.approvals || []).map((a) => ({
      signerName: a.signerName,
      signerAddress: a.signerAddress,
      approvedAt: a.approvedAt,
    })),
    txHash: apiBatch.txHash,
    recipients: apiBatch.recipients
      .filter((r) => r.kind !== "tax_authority")
      .map(r => {
        const nameParts = r.employeeName.split(" ");
        return {
          surname: nameParts.at(-1) || "",
          firstName: nameParts.slice(0, -1).join(" ") || r.employeeName,
          salary: r.amount,
        };
      }),
  };
}

export interface TaxPreviewResponse {
  taxEnabled: boolean;
  regimeVerified: boolean;
  /** Null when tax is off. A placeholder address must never be paid. */
  authority: { name: string; address: string; isPlaceholder: boolean } | null;
  lines: {
    address: string;
    grossFormatted: string;
    taxFormatted: string;
    netFormatted: string;
    /** Base units, so the batch is composed from the figures the receipt carries. */
    grossMinor: string;
    taxMinor: string;
    netMinor: string;
  }[];
}

/**
 * What PAYE would be withheld if these people were paid now.
 *
 * Computed from the organization's own regime rather than a rate assumed here,
 * so the figures the signer reviews are the ones the receipt will carry.
 */
export async function fetchTaxPreview(
  organizationId: string,
  addresses: string[]
): Promise<TaxPreviewResponse> {
  const response = await apiFetch(`/api/tax/organizations/${organizationId}/preview`, {
    method: "POST",
    body: JSON.stringify({ addresses }),
  });
  return response.data || response;
}

export interface TaxLine {
  id: string;
  batchId: string;
  organizationId: string;
  userId: string | null;
  walletAddress: string;
  employeeName: string;
  grossFormatted: string;
  taxFormatted: string;
  netFormatted: string;
  status: "computed" | "remitted" | "failed";
  remittanceReference: string | null;
  remittedAt: string | null;
  createdAt: string;
  breakdown: {
    regimeName: string;
    regimeVerified: boolean;
    [key: string]: unknown;
  } | null;
}

/** PAYE already recorded for one executed batch, one row per employee paid. */
export async function fetchTaxLinesForBatch(
  organizationId: string,
  batchId: string
): Promise<TaxLine[]> {
  const response = await apiFetch(
    `/api/tax/organizations/${organizationId}/batches/${batchId}`
  );
  return response.data || response;
}

/**
 * Records that this line's PAYE was sent to the state authority, by whatever
 * reference the bank transfer gave back. No transaction is sent: nothing here
 * settles on chain, since no state authority accepts that yet.
 */
export async function markTaxLineRemitted(lineId: string, reference: string): Promise<TaxLine> {
  const response = await apiFetch(`/api/tax/lines/${lineId}/remit`, {
    method: "POST",
    body: JSON.stringify({ reference }),
  });
  return response.data || response;
}
