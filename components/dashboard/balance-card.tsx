"use client";

import { Card } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { QuickActions } from "./quick-actions";
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow";
import { SendToBankFlow } from "@/components/send-to-bank-flow";
import { ReceiveFlow } from "@/components/receive-flow";
import Image from "next/image";

export function BalanceCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [showSendToCNGN, setShowSendToCNGN] = useState(false);
  const [showSendToBank, setShowSendToBank] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

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
        <span className="text-sm text-gray-500">Wallet: 0x23...6fad</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {showBalance ? "450,000.00" : "••••••"}
          </span>
          <div className="flex">
          <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
          <span className="text-gray-600">cNGN</span></div>
        </div>
        <p className="text-sm text-green-600"> 0.08% than last month</p>
      </div>

      <div className="py-2">
        <QuickActions
          onSendToCNGN={() => setShowSendToCNGN(true)}
          onSendToBank={() => setShowSendToBank(true)}
          onReceive={() => setShowReceive(true)}
        />
      </div>

      <SendToCNGNFlow
        isOpen={showSendToCNGN}
        onClose={() => setShowSendToCNGN(false)}
      />
      <SendToBankFlow
        isOpen={showSendToBank}
        onClose={() => setShowSendToBank(false)}
      />
      <ReceiveFlow isOpen={showReceive} onClose={() => setShowReceive(false)} />
    </Card>
  );
}
