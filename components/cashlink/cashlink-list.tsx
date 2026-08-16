"use client";

import { activeChain } from "@/constants/chain";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getContract, prepareContractCall } from "thirdweb";
import { thirdwebClient } from "@/app/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToken } from "@/hooks/useToken";
import { useSponsoredTransaction } from "@/hooks/useSponsoredTransaction";
import {
  getCashLinkConfig,
  listCashLinks,
  recordCashLinkCancelled,
  type SenderLink,
} from "@/lib/cashlink";

const LABELS: Record<SenderLink["status"], string> = {
  open: "Waiting to be claimed",
  claiming: "Being claimed",
  claimed: "Claimed",
  cancelled: "Cancelled",
  reclaimed: "Returned to you",
};

const TONES: Record<SenderLink["status"], string> = {
  open: "bg-blue-100 text-blue-700",
  claiming: "bg-amber-100 text-amber-700",
  claimed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  reclaimed: "bg-gray-100 text-gray-600",
};

/**
 * The sender's own links.
 *
 * This is the only place the note is ever shown, and the only place a link's
 * history is readable at all. The claim page shows an amount and a countdown.
 */
export function CashLinkList({ refreshKey }: Readonly<{ refreshKey?: number }>) {
  const { symbol } = useToken();
  const { send } = useSponsoredTransaction();
  const [links, setLinks] = useState<SenderLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(() => {
    listCashLinks()
      .then(setLinks)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load, refreshKey]);

  const cancel = useCallback(
    async (link: SenderLink) => {
      setCancelling(link.claimAddress);
      try {
        const config = await getCashLinkConfig();
        if (!config.contractAddress) throw new Error("Send by link is not available");

        const { transactionHash } = await send(
          prepareContractCall({
            contract: getContract({
              client: thirdwebClient,
              address: config.contractAddress,
              chain: activeChain,
            }),
            method: "function cancel(address claimAddress)",
            params: [link.claimAddress],
          })
        );

        await recordCashLinkCancelled(link.claimAddress, transactionHash);
        toast.success("Link cancelled, the money is on its way back");
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not cancel this link");
      } finally {
        setCancelling(null);
      }
    },
    [load, send]
  );

  if (loading) return <p className="text-sm text-gray-500">Loading your links...</p>;

  if (links.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No links yet. Send {symbol} to someone who does not have an account.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <Card key={link.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="font-medium text-gray-900">
              {link.amountFormatted} {symbol}
            </p>
            {link.description && (
              <p className="truncate text-sm text-gray-600">{link.description}</p>
            )}
            <p className="text-xs text-gray-500">
              {link.status === "open"
                ? `Expires ${new Date(link.expiresAt).toLocaleString()}`
                : new Date(link.settledAt ?? link.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs ${TONES[link.status]}`}>
              {LABELS[link.status]}
            </span>

            {/* Cancelling is by identity, for a sender who no longer has the link. */}
            {link.status === "open" && (
              <Button
                variant="outline"
                size="sm"
                disabled={cancelling === link.claimAddress}
                onClick={() => cancel(link)}
              >
                {cancelling === link.claimAddress ? "Cancelling..." : "Cancel"}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
