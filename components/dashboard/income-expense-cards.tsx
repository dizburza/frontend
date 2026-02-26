"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import useCngnTransferActivity from "@/hooks/ERC20/useCngnTransferActivity";
import { useEffect, useState } from "react";

export function IncomeExpenseCards() {
  const { latestIncomingAmount, latestOutgoingAmount, isLoading } = useCngnTransferActivity();

  const [lastIncomingAmount, setLastIncomingAmount] = useState<number | null>(null);
  const [lastOutgoingAmount, setLastOutgoingAmount] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    setLastIncomingAmount(latestIncomingAmount);
    setLastOutgoingAmount(latestOutgoingAmount);
  }, [isLoading, latestIncomingAmount, latestOutgoingAmount]);

  const incomingToDisplay = isLoading && lastIncomingAmount !== null ? lastIncomingAmount : latestIncomingAmount;
  const outgoingToDisplay = isLoading && lastOutgoingAmount !== null ? lastOutgoingAmount : latestOutgoingAmount;

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
