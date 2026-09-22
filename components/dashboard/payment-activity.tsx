"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ApiPaymentBatch, ApiTransaction } from "@/lib/api/organization";
import { useToken } from "@/hooks/useToken";
import { SectionCard, StatusPill } from "@/components/dashboard/section-card";

type PaymentActivityProps = {
  transactions: ApiTransaction[];
  /** Keyed lookup for the batch a transfer belongs to, for recipients and signatures. */
  batches: ApiPaymentBatch[];
  viewAllHref: string;
};

const shortHash = (value: string) => (value ? `${value.slice(0, 8)}...` : "--");

export function PaymentActivity({ transactions, batches, viewAllHref }: PaymentActivityProps) {
  const { symbol } = useToken();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 1500);
    } catch {
      // The hash is still on screen, and there is nothing useful to say here.
    }
  };

  const batchFor = (tx: ApiTransaction) =>
    batches.find((batch) => batch.id === tx.batchId || batch.txHash === tx.txHash);

  return (
    <SectionCard title="Payment Activity" viewAllHref={viewAllHref}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left">
          <thead>
            <tr className="border-y border-gray-100 bg-neutral-100">
              <Th>#</Th>
              <Th>TNX HASH</Th>
              <Th>BATCH NAME</Th>
              <Th>INITIATED BY</Th>
              <Th className="text-right">AMOUNT ({symbol || "--"})</Th>
              <Th>TYPE</Th>
              <Th className="text-center">RECIPIENTS</Th>
              <Th className="text-center">SIGNATURES</Th>
              <Th className="text-center">STATUS</Th>
              <Th>DATE</Th>
              <Th className="text-right">GAS FEE ({symbol || "--"})</Th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-center text-sm text-gray-500">
                  No payment activity yet.
                </td>
              </tr>
            ) : (
              transactions.map((tx, index) => {
                const batch = batchFor(tx);
                const inflow = tx.direction === "received";
                const amount = Number.parseFloat(
                  String(tx.displayAmount || "0").replaceAll(/[+-]/g, "")
                );

                // Formatted server side from the token's decimals. A fee of
                // zero is a real figure and prints as one; only a transfer
                // that recorded no fee at all is a dash.
                const gas = Number.parseFloat(tx.feeFormatted ?? "");
                const fee = Number.isFinite(gas)
                  ? gas.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "-";

                const when = new Date(tx.timestamp);

                return (
                  <tr key={tx.id} className="border-b border-gray-100 transition-colors hover:bg-surface-canvas">
                    <Td className="text-gray-500">{index + 1}</Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-neutral-800">{shortHash(tx.txHash)}</span>
                        <button
                          type="button"
                          onClick={() => copyHash(tx.txHash)}
                          aria-label="Copy transaction hash"
                          className="text-gray-400 transition-colors hover:text-gray-700"
                        >
                          {copiedHash === tx.txHash ? (
                            <Check className="size-3.5 text-green-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </span>
                    </Td>
                    <Td className="font-medium text-neutral-800">
                      {tx.batchName || tx.description || "Transfer"}
                    </Td>
                    <Td className="text-neutral-600">{batch?.creatorJobRole || "--"}</Td>
                    <Td className="text-right font-semibold text-neutral-800">
                      {Number.isFinite(amount)
                        ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
                        : "--"}
                    </Td>
                    <Td className="text-neutral-600">{inflow ? "Inflow" : "Outflow"}</Td>
                    <Td className="text-center text-neutral-600">
                      {batch ? batch.recipients.length : "-"}
                    </Td>
                    <Td className="text-center text-neutral-600">
                      {batch ? batch.approvalCount : "-"}
                    </Td>
                    <Td className="text-center">
                      <StatusPill status={tx.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-neutral-600">
                      <span className="block">
                        {when.toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        At {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-right text-neutral-600">{fee}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-4 text-xs font-normal tracking-wide text-neutral-600 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-4 text-xs ${className}`}>{children}</td>;
}
