"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard/header"
import WalletGuard from "@/components/WalletGuard"
import RealtimeProvider from "@/components/RealtimeProvider"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletGuard>
      <RealtimeProvider />
      <div className="min-h-screen bg-surface-canvas px-4 pb-10 pt-5 sm:px-6 lg:px-5">
        <DashboardHeader />
        <main>{children}</main>
      </div>
    </WalletGuard>
  )
}
