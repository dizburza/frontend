"use client";

import { activeChain } from "@/constants/chain";
import { useCallback, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react";
import { getContract, prepareContractCall } from "thirdweb";
import { thirdwebClient } from "@/app/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToken } from "@/hooks/useToken";
import { useSponsoredTransaction } from "@/hooks/useSponsoredTransaction";
import { getTokenConfig, toBaseUnits } from "@/lib/token";
import {
  buildLinkUrl,
  getCashLinkConfig,
  newLinkKey,
  quoteCashLink,
  recordCashLink,
  type CashLinkQuote,
} from "@/lib/cashlink";

type Step = "amount" | "review" | "link";

const MAX_UINT256 = (BigInt(1) << BigInt(256)) - BigInt(1);

/**
 * Making a link.
 *
 * The sender agrees to a total before anything is signed, which is the point of
 * the review step: the amount is what the claimer receives and the fee is the
 * gas for making the link, settling it, and refunding it if nobody comes. It is
 * charged now because a refunded link has nothing left to charge against.
 */
export function CreateCashLinkModal({
  onClose,
  onCreated,
}: Readonly<{ onClose: () => void; onCreated?: () => void }>) {
  const { symbol } = useToken();
  const account = useActiveAccount();
  const { send, canSign } = useSponsoredTransaction();
  const { mutateAsync: sendAndConfirmTx } = useSendAndConfirmTransaction();

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [quote, setQuote] = useState<CashLinkQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReview = useCallback(async () => {
    if (!account?.address) {
      toast.error("Still getting your account ready, try again in a moment");
      return;
    }

    setBusy(true);
    try {
      setQuote(await quoteCashLink(await toBaseUnits(amount)));
      setStep("review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not price this link");
    } finally {
      setBusy(false);
    }
  }, [account?.address, amount]);

  const handleCreate = useCallback(async () => {
    if (!quote || !account?.address) return;

    setBusy(true);
    try {
      const config = await getCashLinkConfig();
      if (!config.contractAddress) throw new Error("Send by link is not available");

      const escrow = getContract({
        client: thirdwebClient,
        address: config.contractAddress,
        chain: activeChain,
      });

      if (quote.needsApproval) {
        const { address: tokenAddress } = await getTokenConfig();

        // Sent by the sender rather than relayed. cNGN reads `msg.sender` and
        // knows nothing about ERC-2771, so a relayed approve would set the
        // allowance for the forwarder and the escrow would still be refused. A
        // smart account is its own sender, so the paymaster covers this one and
        // only an external wallet actually pays.
        //
        // Confirmed rather than fired: `create` pulls the tokens, so it cannot
        // be sent until the allowance is really on chain.
        await sendAndConfirmTx(
          prepareContractCall({
            contract: getContract({
              client: thirdwebClient,
              address: tokenAddress,
              chain: activeChain,
            }),
            method: "function approve(address spender, uint256 amount)",
            params: [config.contractAddress, MAX_UINT256],
          })
        );
      }

      // Generated here and never sent anywhere. The address goes on chain, the
      // key goes into the link.
      const { privateKey, claimAddress } = newLinkKey();

      const { transactionHash } = await send(
        prepareContractCall({
          contract: escrow,
          method:
            "function create(address claimAddress, uint256 amount, uint256 fee, uint48 window)",
          params: [
            claimAddress,
            BigInt(quote.amount),
            BigInt(quote.fee),
            quote.windowSeconds,
          ],
        })
      );

      // Recorded after the escrow exists, so a row can only ever describe money
      // that is really held.
      await recordCashLink({
        claimAddress,
        txHash: transactionHash,
        description: description.trim() || null,
      });

      setLink(buildLinkUrl(privateKey));
      setStep("link");
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create this link");
    } finally {
      setBusy(false);
    }
  }, [account?.address, description, onCreated, quote, send, sendAndConfirmTx]);

  const copy = useCallback(async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [link]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === "link" ? "Your link is ready" : `Send ${symbol} by link`}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "amount" && (
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="cashlink-amount" className="text-sm text-gray-600">
                Amount
              </label>
              <Input
                id="cashlink-amount"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="cashlink-note" className="text-sm text-gray-600">
                Note (only you see this)
              </label>
              <Input
                id="cashlink-note"
                placeholder="What is this for?"
                maxLength={200}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">
                Kept for your own history. It is not shown to whoever opens the link.
              </p>
            </div>

            <Button className="w-full" disabled={!amount || busy} onClick={handleReview}>
              {busy ? "Checking..." : "Continue"}
            </Button>
          </div>
        )}

        {step === "review" && quote && (
          <div className="mt-6 space-y-4">
            <dl className="space-y-2 text-sm">
              <Row label="They receive" value={`${quote.amountFormatted} ${symbol}`} />
              <Row label="Fee" value={`${quote.feeFormatted} ${symbol}`} />
              <div className="border-t border-gray-200 pt-2">
                <Row
                  label="Total from your balance"
                  value={`${quote.totalFormatted} ${symbol}`}
                  strong
                />
              </div>
            </dl>

            <p className="text-xs text-gray-500">
              Anyone with the link can claim it. Unclaimed after{" "}
              {Math.round(quote.windowSeconds / 3600)} hours, it comes back to you.
            </p>

            {quote.needsApproval && (
              <p className="text-xs text-gray-500">
                The first link needs one approval from your wallet. After that they are
                free to send.
              </p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={busy || !canSign}
                title={canSign ? undefined : "Still getting your account ready"}
                onClick={handleCreate}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create link"}
              </Button>
            </div>
          </div>
        )}

        {step === "link" && link && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              Share this with whoever you are paying. Anyone holding it can claim it, so
              send it the way you would send cash.
            </p>

            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <span className="flex-1 truncate text-xs text-gray-700">{link}</span>
              <button onClick={copy} aria-label="Copy link" className="text-gray-500">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Copy it now. It cannot be shown again, because the part that claims it is
              never stored.
            </p>

            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-600">{label}</dt>
      <dd className={strong ? "font-semibold text-gray-900" : "text-gray-900"}>{value}</dd>
    </div>
  );
}
