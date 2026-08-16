"use client"

import type React from "react"
import { Toaster } from "sonner"
import { GlobalLoadingProvider } from "@/lib/global-loading"
import BackendSyncQueueFlusher from "@/components/BackendSyncQueueFlusher"
import WalletServiceNotice from "@/components/WalletServiceNotice"
import { useAutoAuthenticate } from "@/hooks/useAutoAuthenticate"

/**
 * Signing in follows the wallet, not the route.
 *
 * Mounted once at the root because a connected wallet on a page that did not
 * mount this was a deadlock: nothing signed the user in, and the redirect that
 * would have carried them somewhere that did waits for a session that was never
 * coming. Mounting it per layout is what created that gap.
 *
 * Exactly one instance. Two would each hold their own in-progress flag and both
 * ask the wallet to sign, which is two prompts for one sign-in.
 */
function AutoAuthenticate() {
  useAutoAuthenticate()
  return null
}

export default function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GlobalLoadingProvider>
      <WalletServiceNotice />
      <AutoAuthenticate />
      {children}
      <BackendSyncQueueFlusher />
      <Toaster richColors closeButton />
    </GlobalLoadingProvider>
  )
}
