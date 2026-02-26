"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard/header"
import WalletGuard from "@/components/WalletGuard"
import { useAutoAuthenticate } from "@/hooks/useAutoAuthenticate"

function AutoAuthenticate() {
  useAutoAuthenticate()
  
  // Hook runs silently in background to auto-authenticate on wallet connect
  return null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletGuard>
      <AutoAuthenticate />
      <div className="min-h-screen bg-[#F9F9FE] px-4 sm:px-6 lg:px-16">
        <DashboardHeader />
        <main className="pt-16 sm:pt-20">{children}</main>
      </div>
    </WalletGuard>
  )
}
