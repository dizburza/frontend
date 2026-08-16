"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";
import useTransactionActivity from "@/hooks/useTransactionActivity";
import { useToken } from "@/hooks/useToken"

const formatAmount = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function IncomeExpenseCards(props?: Readonly<{ address?: string | null }>) {
  const { symbol, logoUrl } = useToken()
  const account = useActiveAccount();
  const address = props?.address ?? account?.address ?? null;

  // Totals, not the single most recent transfer. These cards say Inflow and
  // Outflow, and the summary endpoint aggregates them server-side.
  const { incomingTotal, outgoingTotal, isLoading, isValidating } =
    useTransactionActivity({ walletAddress: address ?? undefined });

  // The cache layer hands back persisted values on mount, so a reload shows
  // real numbers immediately and only ever renders "Loading..." on first visit.
  const incomingDisplay = isLoading ? "Loading..." : formatAmount(incomingTotal);
  const outgoingDisplay = isLoading ? "Loading..." : formatAmount(outgoingTotal);
  const statusLabel = !isLoading && isValidating ? "Updating..." : " ";

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-4 sm:p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Inflow</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold">{incomingDisplay}</span>
              <div className="flex items-center">
                <Image src={logoUrl} alt={symbol} width={24} height={24} />
                <span className="text-gray-600">{symbol}</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">{statusLabel}</p>
          </div>
          <ArrowDownLeft className="text-green-600" size={24} />
        </div>
      </Card>

      <Card className="p-4 sm:p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Outflow</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold">{outgoingDisplay}</span>
              <div className="flex items-center">
                <Image src={logoUrl} alt={symbol} width={24} height={24} />
                <span className="text-gray-600">{symbol}</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">{statusLabel}</p>
          </div>
          <ArrowUpRight className="text-red-600" size={24} />
        </div>
      </Card>
    </div>
  );
}
