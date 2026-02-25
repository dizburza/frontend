"use client";

import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { QuickActions } from "./quick-actions";
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow";
import { SendToBankFlow } from "@/components/send-to-bank-flow";
import { ReceiveFlow } from "@/components/receive-flow";
import { QRScanModal } from "@/components/qr-scan-modal";
import Image from "next/image";
import { useActiveAccount } from "thirdweb/react";
import useGetTokenBalance from "@/hooks/ERC20/useGetBalance";
import useCngnTransferActivity from "@/hooks/ERC20/useCngnTransferActivity";

export function BalanceCard() {
  const account = useActiveAccount();
  const balance = useGetTokenBalance();
  const { monthly, lastUpdatedAt, isLoading } = useCngnTransferActivity();
  const [showBalance, setShowBalance] = useState(true);
  const [showSendToCNGN, setShowSendToCNGN] = useState(false);
  const [showSendToBank, setShowSendToBank] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanRecipient, setScanRecipient] = useState<string | undefined>(undefined);

  const lastUpdatedDisplay = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : " ";

  const address = account?.address;
  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "--";

  const balanceDisplay = (() => {
    if (!showBalance) return "••••••";
    if (balance === null) {
      return account ? "Loading..." : "0.00";
    }
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  })();

  const changeDisplay = (() => {
    if (!monthly || monthly.length < 2) return " ";
    const current = monthly.at(-1);
    const previous = monthly.at(-2);
    const currentNet = (current?.incoming || 0) - (current?.outgoing || 0);
    const previousNet = (previous?.incoming || 0) - (previous?.outgoing || 0);
    if (previousNet === 0) return " ";
    const pct = (Math.abs(currentNet - previousNet) / Math.abs(previousNet)) * 100;
    return `${pct.toFixed(2)}% than last month`;
  })();

  return (
    <Card className="p-6 bg-white h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-gray-600">Total Balance</h2>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="text-gray-400 hover:text-gray-600"
          >
            {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
        <span className="text-sm text-gray-500">Wallet: {shortAddress}</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {balanceDisplay}
          </span>
          <div className="flex">
          <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
          <span className="text-gray-600">cNGN</span></div>
        </div>
        <p className="text-sm text-green-600"> {changeDisplay}</p>
        <p className="text-xs text-gray-500">Last updated: {isLoading ? "Updating..." : lastUpdatedDisplay}</p>
      </div>

      <div className="py-2">
        <QuickActions
          onSendToCNGN={() => {
            setScanRecipient(undefined);
            setShowSendToCNGN(true);
          }}
          onSendToBank={() => setShowSendToBank(true)}
          onReceive={() => setShowReceive(true)}
          onScan={() => setShowScan(true)}
        />
      </div>

      <SendToCNGNFlow
        isOpen={showSendToCNGN}
        onClose={() => setShowSendToCNGN(false)}
        initialRecipient={scanRecipient}
      />
      <SendToBankFlow
        isOpen={showSendToBank}
        onClose={() => setShowSendToBank(false)}
      />
      <ReceiveFlow isOpen={showReceive} onClose={() => setShowReceive(false)} />

      <QRScanModal
        isOpen={showScan}
        onClose={() => setShowScan(false)}
        onDetected={({ recipient }) => {
          setScanRecipient(recipient);
          setShowSendToCNGN(true);
        }}
      />
    </Card>
  );
}
