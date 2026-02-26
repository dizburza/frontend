"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard/header"
import WalletGuard from "@/components/WalletGuard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WalletGuard>
      <div className="min-h-screen bg-[#F9F9FE] px-4 sm:px-6 lg:px-16">
        <DashboardHeader />
        <main className="pt-16 sm:pt-20">{children}</main>
      </div>
    </WalletGuard>
  )
}
