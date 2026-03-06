"use client";

import Image from "next/image";
import type React from "react";
import Link from "next/link";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { clearAuthStorage } from "@/hooks/useAutoAuthenticate";
import { useRouter } from "next/navigation";

const formatAddress = (address?: string) => {
  const a = (address || "").trim();
  if (!a) return "";
  if (a.length <= 12) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  const handleDisconnect = async () => {
    clearAuthStorage();
    try {
      if (wallet) {
        await Promise.resolve(disconnect(wallet));
      }
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <div className="h-screen bg-[#F9F9FE] relative overflow-hidden overflow-y-auto">

      {/* Header */}
      <header className="relative z-10 bg-white flex items-center h-[80px] justify-between px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex cursor-pointer">
            <Image src="/logo.svg" alt="Logo" width="150" height="200"/>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{formatAddress(account?.address) || "--"}</span>
          {account ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Disconnect
            </button>
          ) : null}
          <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg">👤</span>
          </button>
        </div>
      </header>


       {/* Diagonal geometric background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1600 900">
           <defs>
            <pattern id="diagonals" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" strokeWidth="3" />
            <line x1="200" y1="0" x2="0" y2="200" stroke="currentColor" strokeWidth="3" />
            </pattern>
        </defs>
          <rect width="1600" height="900" fill="url(#diagonals)" />
        </svg>              
      </div>

      

      {/* Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] h-fit">{children}</main>
    </div>
)
}
