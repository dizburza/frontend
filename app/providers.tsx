"use client"

import type React from "react"
import { Toaster } from "sonner"
import { GlobalLoadingProvider } from "@/lib/global-loading"
import BackendSyncQueueFlusher from "@/components/BackendSyncQueueFlusher"

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GlobalLoadingProvider>
      {children}
      <BackendSyncQueueFlusher />
      <Toaster richColors closeButton />
    </GlobalLoadingProvider>
  )
}
