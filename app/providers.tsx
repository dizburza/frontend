"use client"

import type React from "react"
import { Toaster } from "sonner"
import { GlobalLoadingProvider } from "@/lib/global-loading"

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GlobalLoadingProvider>
      {children}
      <Toaster richColors closeButton />
    </GlobalLoadingProvider>
  )
}
