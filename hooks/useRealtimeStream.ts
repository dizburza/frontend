"use client";

import { useEffect, useRef } from "react";
import { invalidateAddress, invalidateOrganization } from "@/lib/cache-bus";

type StreamEvent =
  | { type: "transaction"; address: string; txHash: string; direction: "sent" | "received" }
  | { type: "balance"; address: string; raw: string; decimals: number }
  | {
      type: "proposal";
      address: string;
      organizationId: string;
      proposalId: string;
      action: string;
    }
  // Arrives on the sender's own address. A settled link did move money, so the
  // default invalidation is the right one.
  | { type: "cashlink"; address: string; claimAddress: string; status: string };

/**
 * Holds one SSE connection for the whole app and turns pushes into cache
 * invalidations.
 *
 * Without this the UI can only learn about new activity by refetching on
 * mount, which is what made every navigation feel like a page reload. With it,
 * a screen that's already open updates in place the moment the indexer writes.
 */
export function useRealtimeStream(addresses: Array<string | null | undefined>) {
  const sourceRef = useRef<EventSource | null>(null);

  // Sorted + joined so the effect only re-runs when the set genuinely changes,
  // not on every render that rebuilds the array.
  const key = addresses
    .filter((a): a is string => Boolean(a))
    .map((a) => a.toLowerCase())
    .sort((a, b) => a.localeCompare(b))
    .join(",");

  useEffect(() => {
    if (!key) return;

    // EventSource reconnects on its own, including after the backend restarts,
    // so there's no manual retry loop here.
    const source = new EventSource(
      `/api/events/stream?addresses=${encodeURIComponent(key)}`
    );
    sourceRef.current = source;

    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as StreamEvent;

        // A proposal arrives on the treasury address because that is how the
        // stream is authorized, but it changes no money, so it must not
        // invalidate balances and history.
        if (event.type === "proposal") invalidateOrganization(event.organizationId);
        else if (event.address) invalidateAddress(event.address);
      } catch {
        // Keep-alive comments and malformed frames are safe to ignore.
      }
    };

    source.onerror = () => {
      // Browser handles backoff and reconnection; closing here would stop it.
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [key]);
}

export default useRealtimeStream;
