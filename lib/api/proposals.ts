"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthCompleted } from "@/hooks/useAutoAuthenticate";
import { onOrganizationInvalidated } from "@/lib/cache-bus";

export type ProposalStatus = "open" | "passed" | "rejected" | "expired" | "cancelled";

export type ProposalVote = {
  voterAddress: string;
  voterName: string;
  choice: "for" | "against";
  comment: string | null;
  createdAt: string;
};

export type Proposal = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  title: string;
  description: string | null;
  amount: string | null;
  amountFormatted: string | null;
  currency: string | null;
  createdByAddress: string;
  votesRequired: number;
  signerCountAtCreation: number;
  status: ProposalStatus;
  opensAt: string;
  closesAt: string;
  decidedAt: string | null;
  createdAt: string;
  votesFor: number;
  votesAgainst: number;
  votes: ProposalVote[];
  pendingSigners?: { address: string; name: string }[];
};

export type ProposalStats = {
  total: number;
  open: number;
  passed: number;
  rejected: number;
  expired: number;
  cancelled: number;
};

async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    credentials: "include",
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    // express-validator's "Validation failed" is a summary, not a reason.
    // `details` carries the actual per-field message, which is what someone
    // needs to fix the form rather than just knowing it was rejected.
    const fieldMessage = Array.isArray(payload?.details)
      ? payload.details.find((d: { msg?: string }) => d?.msg)?.msg
      : undefined;

    throw new Error(fieldMessage || payload?.error || payload?.message || `HTTP ${response.status}`);
  }

  return payload.data ?? payload;
}

export const createProposal = (input: {
  organizationId: string;
  title: string;
  description?: string;
  amount?: string;
  closesAt: string;
}): Promise<Proposal> =>
  apiFetch("/api/proposals", { method: "POST", body: JSON.stringify(input) });

export const fetchProposal = (id: string): Promise<Proposal> =>
  apiFetch(`/api/proposals/${id}`);

export const voteOnProposal = (
  id: string,
  choice: "for" | "against",
  comment?: string
): Promise<Proposal> =>
  apiFetch(`/api/proposals/${id}/votes`, {
    method: "POST",
    body: JSON.stringify({ choice, comment }),
  });

export const cancelProposal = (id: string): Promise<Proposal> =>
  apiFetch(`/api/proposals/${id}/cancel`, { method: "POST" });

/**
 * Proposals for an organization.
 *
 * Waits for the session rather than firing on mount, since every proposal route
 * is authenticated and a request sent before sign-in just 401s.
 */
export function useOrganizationProposals(organizationId: string | null) {
  const [data, setData] = useState<{ proposals: Proposal[]; stats: ProposalStats } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  useAuthCompleted(refresh);

  useEffect(
    () =>
      onOrganizationInvalidated((changed) => {
        if (changed === organizationId) refresh();
      }),
    [organizationId, refresh]
  );

  useEffect(() => {
    if (!organizationId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    apiFetch(`/api/proposals/organizations/${organizationId}`)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey]);

  return { data, loading, error, refresh };
}

export function useProposal(id: string | null) {
  const [data, setData] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Which organization this proposal belongs to is only known once it has
  // loaded, so it is held in a ref rather than resubscribing on every fetch.
  const organizationId = useRef<string | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  useAuthCompleted(refresh);

  useEffect(
    () =>
      onOrganizationInvalidated((changed) => {
        if (changed === organizationId.current) refresh();
      }),
    [refresh]
  );

  useEffect(() => {
    if (!id) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchProposal(id)
      .then((result) => {
        if (cancelled) return;
        organizationId.current = result.organizationId;
        setData(result);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  return { data, loading, error, refresh };
}
