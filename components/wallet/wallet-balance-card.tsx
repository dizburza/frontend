"use client";

import Image from "next/image";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useToken } from "@/hooks/useToken";

type WalletBalanceCardProps = {
  address: string | null;
  /** Null until it has loaded, which renders as a dash rather than a zero. */
  balance: number | null;
  lastUpdatedAt: number | null;
  isLoading: boolean;
};

const shortAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export function WalletBalanceCard({
  address,
  balance,
  lastUpdatedAt,
  isLoading,
}: Readonly<WalletBalanceCardProps>) {
  const { symbol, logoUrl } = useToken();
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard is blocked in some embedded contexts, and the address is
      // still on screen to read.
    }
  };

  const balanceLabel =
    balance === null
      ? "--"
      : balance.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const updatedLabel = (() => {
    if (isLoading) return "Updating...";
    if (!lastUpdatedAt) return "";
    return `Updated ${new Date(lastUpdatedAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  })();

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-lg bg-[#1D1E49] px-6 pb-5 pt-6 outline outline-[1.5px] -outline-offset-[1.5px] outline-[#EEF0FC]">
      <Image
        src="/images/balance-arcs.png"
        alt=""
        width={360}
        height={138}
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-10 opacity-70 mix-blend-overlay"
      />
      <Image
        src="/images/balance-arcs.png"
        alt=""
        width={360}
        height={138}
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-14 -right-16 rotate-180 opacity-70 mix-blend-overlay"
      />

      <div className="relative z-10 flex flex-1 flex-col justify-between gap-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="truncate text-base leading-5 text-amber-300">
              {address ? shortAddress(address) : "--"}
            </span>
            <button
              type="button"
              onClick={copyAddress}
              disabled={!address}
              aria-label="Copy wallet address"
              className="shrink-0 text-orange-200 transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full bg-white/5 px-3 py-2 outline outline-[0.3px] -outline-offset-[0.3px] outline-[#C7C9F7] backdrop-blur-sm">
            {/* The generic mark reads as a missing image at this size, so the
                cNGN artwork stands in for it. A configured logoUrl still wins,
                which is what keeps the token swappable. */}
            <Image
              src={logoUrl === "/token.svg" ? "/images/cNGN.png" : logoUrl}
              alt=""
              width={20}
              height={20}
              className="size-5 rounded-full object-contain"
            />
            <span className="text-sm font-medium text-[#EEF0FC]">{symbol || "--"}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-indigo-300">Available Balance</span>
            <button
              type="button"
              onClick={() => setHidden((value) => !value)}
              aria-label={hidden ? "Show balance" : "Hide balance"}
              aria-pressed={hidden}
              className="text-indigo-300 transition-opacity hover:opacity-70"
            >
              <Image src="/icons/eye.svg" alt="" width={16} height={16} className="size-4" />
            </button>
          </div>
          <p className="font-nohemi text-4xl leading-tight text-white">
            {hidden ? "••••••" : balanceLabel}
          </p>
          <p className="text-xs text-indigo-300">{updatedLabel}</p>
        </div>
      </div>
    </div>
  );
}
