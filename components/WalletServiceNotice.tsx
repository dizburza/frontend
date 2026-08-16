"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  WALLET_SERVICE_FAILURE_EVENT,
  installWalletServiceRetry,
  type WalletServiceFailure,
} from "@/lib/wallet-service-health";

/**
 * Nothing here mentions wallets, fetching or networks by name. Someone who has
 * never heard of a wallet still has to know what happened and what to do next,
 * and the failure path is where this stops looking like an ordinary app.
 */
const MESSAGES: Record<WalletServiceFailure, { title: string; description: string }> = {
  offline: {
    title: "You appear to be offline",
    description: "Check your internet connection, then try signing in again.",
  },
  unreachable: {
    title: "We could not reach the sign-in service",
    description: "This is usually temporary. Please try again in a moment.",
  },
};

export default function WalletServiceNotice() {
  useEffect(() => {
    installWalletServiceRetry();

    const onFailure = (event: Event) => {
      const reason = (event as CustomEvent<WalletServiceFailure>).detail;
      const copy = MESSAGES[reason] ?? MESSAGES.unreachable;

      // One id, so a burst of failed calls collapses into a single message
      // rather than stacking a toast per request.
      toast.error(copy.title, { description: copy.description, id: "wallet-service" });
    };

    globalThis.addEventListener(WALLET_SERVICE_FAILURE_EVENT, onFailure);
    return () => globalThis.removeEventListener(WALLET_SERVICE_FAILURE_EVENT, onFailure);
  }, []);

  return null;
}
