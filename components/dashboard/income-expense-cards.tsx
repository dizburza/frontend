"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import useCngnTransferActivity from "@/hooks/ERC20/useCngnTransferActivity";

const asHexAddress = (value: string | null | undefined) => {
  const v = (value || "").trim();
  if (!v) return undefined;
  return /^0x[a-fA-F0-9]{40}$/.test(v) ? (v as `0x${string}`) : undefined;
};

export function IncomeExpenseCards(props?: Readonly<{ address?: string | null }>) {
  const account = useActiveAccount();
  const address = props?.address ?? account?.address ?? null;
  const { latestIncomingAmount, latestOutgoingAmount, isLoading } = useCngnTransferActivity({
    walletAddress: asHexAddress(address),
  });

  const { incoming, outgoing } = useMemo(() => {
    const i = Number(latestIncomingAmount || 0);
    const o = Number(latestOutgoingAmount || 0);
    return {
      incoming: Number.isFinite(i) ? i : 0,
      outgoing: Number.isFinite(o) ? o : 0,
    };
  }, [latestIncomingAmount, latestOutgoingAmount]);

  const [lastIncomingAmount, setLastIncomingAmount] = useState<number | null>(null);
  const [lastOutgoingAmount, setLastOutgoingAmount] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    setLastIncomingAmount(incoming);
    setLastOutgoingAmount(outgoing);
  }, [isLoading, incoming, outgoing]);

  const incomingToDisplay =
    isLoading && lastIncomingAmount !== null ? lastIncomingAmount : incoming;
  const outgoingToDisplay =
    isLoading && lastOutgoingAmount !== null ? lastOutgoingAmount : outgoing;

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
