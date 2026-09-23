"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { readSessionHint } from "@/lib/session";

/**
 * Who the user is, before the signing wallet is back.
 *
 * Restoring an ERC-4337 smart account means authenticating with the enclave and
 * re-deriving the account, which takes seconds. Almost nothing on a dashboard
 * needs that: reads are served from the backend against the session cookie, and
 * the address is only wanted to know whose name to show. So the address comes
 * from the session hint immediately and the wallet catches up behind it.
 *
 * `canSign` is the part that genuinely needs the wallet. Keep write actions
 * behind it: the address being known does not mean anything can be signed yet.
 */
export function useSessionIdentity() {
  const account = useActiveAccount();

  // The cookie is not readable during the server render, so this starts empty
  // and fills on mount rather than making the two disagree.
  const [hintedAddress, setHintedAddress] = useState<string | null>(null);

  useEffect(() => {
    const hint = readSessionHint();
    setHintedAddress(
      hint && hint.expiresAt > Date.now() ? hint.walletAddress : null
    );
  }, []);

  return {
    /** Lowercased, since the hint stores it that way and callers compare it. */
    address: account?.address?.toLowerCase() ?? hintedAddress,
    canSign: Boolean(account?.address),
    /** True while the address is known but the wallet has not caught up. */
    isRestoring: Boolean(hintedAddress) && !account?.address,
  };
}
