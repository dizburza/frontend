import { useState, useEffect } from "react";
import { useAuthCompleted } from "@/hooks/useAutoAuthenticate";
import { enqueueBackendSyncJob } from "@/lib/backend-sync-queue";

// Types
export interface Organization {
  _id: string;
  name: string;
  slug: string;
  contractAddress: string;
  organizationHash: string;
  creatorAddress: string;
  businessEmail: string;
  businessInfo?: {
    registrationNumber?: string;
    registrationType?: string;
  };
  signers: {
    address: string;
    name: string;
    role: string;
    addedAt: string;
    isActive: boolean;
  }[];
  quorum: number;
  employees: string[];
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
  const token = localStorage.getItem("token");
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("/api/") ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
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
  username: string;
  displayUsername?: string;
  surname: string;
  firstname: string;
  fullName: string;
  walletAddress: string;
  email?: string;
  avatar?: string;
  role: string;
  isSigner?: boolean;
  lastAudit?: {
    action?: "ADD" | "UPDATE" | "REMOVE";
    createdAt?: string;
    performedByUsername?: string;
    performedByWalletAddress?: string;
  } | null;
  jobDetails?: {
    jobRole?: string;
    salary?: string;
    department?: string;
    joinedAt?: string;
    employeeId?: string;
  };
  createdAt: string;
}

export interface ApiPaymentBatch {
  _id: string;
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
  }[];
  totalAmount: string;
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

export interface ApiTransactionUser {
  _id: string;
  username?: string;
  fullName?: string;
}

export interface ApiTransaction {
  _id: string;
  txHash: string;
  type: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  currency?: string;
  fee?: string;
  gasUsed?: string;
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
  fromUserId?: ApiTransactionUser;
  toUserId?: ApiTransactionUser;
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
  return apiFetch(`/api/organizations/${organizationId}/employees/${encodeURIComponent(username)}`,
    {
      method: "DELETE",
    }
  );
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
  const [data, setData] = useState<TransactionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const type = params?.type;
  const category = params?.category;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const status = params?.status;

  const refresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    const handler = () => {
      if (address) {
        refresh();
      }
    };

    globalThis.addEventListener("cngn:activity:refresh", handler);
    return () => {
      globalThis.removeEventListener("cngn:activity:refresh", handler);
    };
  }, [address]);

  useAuthCompleted(() => {
    if (address) {
      refresh();
    }
  });

  useEffect(() => {
    const addr = address;
    if (!addr) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchTransactionSummary(addr as string, {
          type,
          category,
          startDate,
          endDate,
          status,
        });
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load transaction summary");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [address, refreshKey, type, category, startDate, endDate, status]);

  return { data, loading, error, refresh };
}

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
  const [data, setData] = useState<TransactionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const page = params?.page;
  const limit = params?.limit;
  const type = params?.type;
  const category = params?.category;
  const startDate = params?.startDate;
  const endDate = params?.endDate;
  const status = params?.status;

  const refresh = () => setRefreshKey((k) => k + 1);

  useAuthCompleted(() => {
    if (address) {
      refresh();
    }
  });

  useEffect(() => {
    const addr = address;
    if (!addr) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      try {
        setLoading(true);
        setError(null);
        if (!addr) {
          return;
        }

        const result = await fetchTransactionHistory(addr, {
          page,
          limit,
          type,
          category,
          startDate,
          endDate,
          status,
        });
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load transactions"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [address, refreshKey, page, limit, type, category, startDate, endDate, status]);

  return { data, loading, error, refresh };
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

// Hook for fetching organization by slug
export function useOrganizationBySlug(slug: string | null) {
  const [data, setData] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadOrganization() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchOrganizationBySlug(slug!);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load organization");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrganization();

    return () => {
      cancelled = true;
    };
  }, [slug, refreshKey]);
  
  return { data, loading, error, refresh };
}

// Helper to convert API employee to frontend Employee type
export function mapApiEmployeeToEmployee(apiEmployee: ApiEmployee): {
  id: string;
  surname: string;
  firstName: string;
  username: string;
  displayUsername?: string;
  walletAddress: string;
  role: string;
  isSigner: boolean;
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
  // Salary is stored with 6 extra decimals for blockchain (divide by 10^6)
  const rawSalary = Number.parseFloat(apiEmployee.jobDetails?.salary || "0");
  const displaySalary = rawSalary / 1_000_000;
  
  return {
    id: apiEmployee._id,
    surname: apiEmployee.surname,
    firstName: apiEmployee.firstname,
    username: apiEmployee.username,
    displayUsername: apiEmployee.displayUsername,
    walletAddress: apiEmployee.walletAddress,
    role: apiEmployee.jobDetails?.jobRole || apiEmployee.role || "Employee",
    isSigner: apiEmployee.isSigner || false,
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
  const rawTotal = Number.parseFloat(apiBatch.totalAmount || "0");
  const displayTotal = rawTotal / 1_000_000;

  return {
    id: apiBatch._id,
    batchName: apiBatch.batchName,
    creatorAddress: apiBatch.creatorAddress,
    creatorJobRole: apiBatch.creatorJobRole,
    totalAmount: displayTotal,
    date: new Date(apiBatch.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    employees: apiBatch.recipients.length,
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
    recipients: apiBatch.recipients.map(r => {
      const nameParts = r.employeeName.split(" ");
      return {
        surname: nameParts.at(-1) || "",
        firstName: nameParts.slice(0, -1).join(" ") || r.employeeName,
        salary: r.amount,
      };
    }),
  };
}
