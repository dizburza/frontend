"use client";

type SyncJob = {
  id: string;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  nextAttemptAt: number;
  request: {
    endpoint: string;
    method: "POST";
    body: unknown;
  };
};

const STORAGE_KEY = "backendSyncQueue:v1";

const now = () => Date.now();

const readQueue = (): SyncJob[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncJob[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (jobs: SyncJob[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch {
    // ignore
  }
};

const makeId = () => `${now()}_${Math.random().toString(16).slice(2)}`;

const stableKey = (job: Pick<SyncJob, "request">) => {
  try {
    return `${job.request.method}:${job.request.endpoint}:${JSON.stringify(job.request.body)}`;
  } catch {
    return `${job.request.method}:${job.request.endpoint}`;
  }
};

export function getBackendSyncQueueSize() {
  return readQueue().length;
}

export function enqueueBackendSyncJob(input: {
  endpoint: string;
  body: unknown;
}) {
  const endpoint = input.endpoint.startsWith("/api/") ? input.endpoint : `/api${input.endpoint}`;

  const job: SyncJob = {
    id: makeId(),
    createdAt: now(),
    updatedAt: now(),
    attempts: 0,
    nextAttemptAt: now(),
    request: {
      endpoint,
      method: "POST",
      body: input.body,
    },
  };

  const jobs = readQueue();
  const key = stableKey(job);
  const exists = jobs.some((j) => stableKey(j) === key);
  if (exists) return;

  const next = [job, ...jobs].slice(0, 50);
  writeQueue(next);
}

async function sendJob(job: SyncJob) {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(job.request.endpoint, {
    method: job.request.method,
    headers,
    body: JSON.stringify(job.request.body),
  });

  // Duplicate record is safe to treat as success for replays
  if (res.status === 409) {
    return;
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const msg =
      (payload && (payload.error || payload.message)) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
}

export async function flushBackendSyncQueue(opts?: {
  maxJobs?: number;
}) {
  const maxJobs = Math.max(1, opts?.maxJobs ?? 5);

  const jobs = readQueue();
  if (jobs.length === 0) return;

  const due = jobs
    .filter((j) => j.nextAttemptAt <= now())
    .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt)
    .slice(0, maxJobs);

  if (due.length === 0) return;

  const remaining = [...jobs];

  for (const job of due) {
    const index = remaining.findIndex((j) => j.id === job.id);
    if (index === -1) continue;

    try {
      await sendJob(job);
      remaining.splice(index, 1);
      writeQueue(remaining);
    } catch {
      const updated: SyncJob = {
        ...job,
        updatedAt: now(),
        attempts: job.attempts + 1,
        nextAttemptAt: now() + Math.min(5 * 60_000, 1000 * 2 ** job.attempts),
      };
      remaining[index] = updated;
      writeQueue(remaining);
    }
  }
}
