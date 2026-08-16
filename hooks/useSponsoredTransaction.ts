"use client";

import { useCallback } from "react";
import type { Abi } from "abitype";
import type { PreparedTransaction } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";

export type SendResult = {
  transactionHash: string;
  /** False when the user paid for it themselves. */
  sponsored: boolean;
};

/**
 * Send a write without the user needing gas.
 *
 * Every account here is an ERC-4337 smart account, so the account is the sender
 * and the paymaster pays for whatever it does, cNGN `transfer` and `approve`
 * included. That is the whole reason for 4337: ERC-2771 could only sponsor
 * contracts written to unwrap the sender, and cNGN reads `msg.sender`.
 *
 * Returns as soon as the transaction is submitted rather than mined, so the
 * caller can apply its optimistic effect and close. The signing prompt is the
 * only wait.
 *
 * There is deliberately no fallback to the user paying. An account that cannot
 * be sponsored cannot pay either, having never held ETH, so retrying at the
 * user's expense would turn a clear error into a stuck one.
 */
export function useSponsoredTransaction() {
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();

  const send = useCallback(
    async <abi extends Abi>(tx: PreparedTransaction<abi>): Promise<SendResult> => {
      if (!account) throw new Error("Wallet not connected");

      const { transactionHash } = await sendTx(tx);
      return { transactionHash, sponsored: true };
    },
    [account, sendTx]
  );

  return { send, sponsored: true };
}
