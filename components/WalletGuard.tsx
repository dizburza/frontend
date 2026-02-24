"use client";

import type React from "react";

import { useActiveAccount } from "thirdweb/react";

import ConnectWallet from "@/components/ConnectWallet";

export default function WalletGuard({
  children,
  title = "Connect your wallet",
  description = "You need to connect your wallet to access this page.",
}: Readonly<{
  children: React.ReactNode;
  title?: string;
  description?: string;
}>) {
  const account = useActiveAccount();

  if (!account?.address) {
    return (
      <div className="min-h-screen bg-[#F9F9FE] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-[#454ADE]/10 text-[#454ADE] flex items-center justify-center text-lg font-semibold">
                D
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>
              <p className="mt-2 text-sm text-gray-600 max-w-sm">{description}</p>
            </div>

            <div className="mt-6">
              <div className="flex justify-center">
                <ConnectWallet connectButtonClassName="!cursor-pointer !min-w-[220px] !justify-center !h-11" />
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Your wallet is only used to authenticate and sign transactions when needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
