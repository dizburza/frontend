"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F9F9FE] px-16">
      <DashboardHeader />
      <main className="pt-20 ">{children}</main>
    </div>
  )
}
