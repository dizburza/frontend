"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import useCngnTransferActivity from "@/hooks/ERC20/useCngnTransferActivity";

export function IncomeExpenseCards() {
  const { latestIncomingAmount, latestOutgoingAmount, isLoading } = useCngnTransferActivity();

  const incomingDisplay = isLoading
    ? "Loading..."
    : latestIncomingAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  const outgoingDisplay = isLoading
    ? "Loading..."
    : latestOutgoingAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Inflow</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{incomingDisplay}</span>
              <div className="flex items-center">
                <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                <span className="text-gray-600">cNGN</span>
              </div>
            </div>
            <p className="text-red-600 text-xs mt-2"> </p>
          </div>
          <ArrowDownLeft className="text-green-600" size={24} />
        </div>
      </Card>

      <Card className="p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Outflow</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{outgoingDisplay}</span>
               <div className="flex items-center">
                <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                <span className="text-gray-600">cNGN</span>
              </div>
            </div>
            <p className="text-red-600 text-xs mt-2"> </p>
          </div>
          <ArrowUpRight className="text-red-600" size={24} />
        </div>
      </Card>
    </div>
  );
}
