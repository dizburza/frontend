"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useTransactionHistory } from "@/lib/api/organization";

export function IncomeExpenseCards() {
  const account = useActiveAccount();
  const address = account?.address ?? null;
  const { data, loading: isLoading } = useTransactionHistory(address, { limit: 100, page: 1 });

  const { incomingTotal, outgoingTotal } = useMemo(() => {
    const txs = data?.transactions ?? [];

    const outgoing = txs
      .filter((t) => t.direction === "sent")
      .reduce((acc, t) => {
        const amt = Number.parseFloat(
          String(t.displayAmount || "0").replaceAll("-", "")
        );
        return acc + (Number.isFinite(amt) ? amt : 0);
      }, 0);

    const incoming = txs
      .filter((t) => t.direction === "received")
      .reduce((acc, t) => {
        const amt = Number.parseFloat(
          String(t.displayAmount || "0").replaceAll("+", "")
        );
        return acc + (Number.isFinite(amt) ? amt : 0);
      }, 0);

    return { incomingTotal: incoming, outgoingTotal: outgoing };
  }, [data?.transactions]);

  const [lastIncomingAmount, setLastIncomingAmount] = useState<number | null>(null);
  const [lastOutgoingAmount, setLastOutgoingAmount] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    setLastIncomingAmount(incomingTotal);
    setLastOutgoingAmount(outgoingTotal);
  }, [isLoading, incomingTotal, outgoingTotal]);

  const incomingToDisplay =
    isLoading && lastIncomingAmount !== null ? lastIncomingAmount : incomingTotal;
  const outgoingToDisplay =
    isLoading && lastOutgoingAmount !== null ? lastOutgoingAmount : outgoingTotal;

  const showUpdating = Boolean(isLoading && (lastIncomingAmount !== null || lastOutgoingAmount !== null));
  const showInitialLoading = Boolean(isLoading && lastIncomingAmount === null && lastOutgoingAmount === null);

  const incomingDisplay = showInitialLoading
    ? "Loading..."
    : incomingToDisplay.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const outgoingDisplay = showInitialLoading
    ? "Loading..."
    : outgoingToDisplay.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-4 sm:p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Inflow</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold">{incomingDisplay}</span>
              <div className="flex items-center">
                <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                <span className="text-gray-600">cNGN</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">{showUpdating ? "Updating..." : " "}</p>
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
                <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                <span className="text-gray-600">cNGN</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2">{showUpdating ? "Updating..." : " "}</p>
          </div>
          <ArrowUpRight className="text-red-600" size={24} />
        </div>
      </Card>
    </div>
  );
}
