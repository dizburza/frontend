"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useTransactionSummary } from "@/lib/api/organization";

export function IncomeExpenseCards() {
  const account = useActiveAccount();
  const address = account?.address ?? null;
  const { data, loading: isLoading } = useTransactionSummary(address);

  const { incomingTotal, outgoingTotal } = useMemo(() => {
    const incoming = Number.parseFloat(String(data?.inflowAmount || "0"));
    const outgoing = Number.parseFloat(String(data?.outflowAmount || "0"));
    return {
      incomingTotal: Number.isFinite(incoming) ? incoming : 0,
      outgoingTotal: Number.isFinite(outgoing) ? outgoing : 0,
    };
  }, [data?.inflowAmount, data?.outflowAmount]);

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
