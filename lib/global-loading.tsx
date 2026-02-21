"use client"

import type React from "react"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

type GlobalLoadingState = {
  isOpen: boolean
  message?: string
}

type GlobalLoadingApi = {
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const GlobalLoadingContext = createContext<GlobalLoadingApi | null>(null)

export function useGlobalLoading(): GlobalLoadingApi {
  const ctx = useContext(GlobalLoadingContext)
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within GlobalLoadingProvider")
  }
  return ctx
}

function GlobalLoadingOverlay({ state }: Readonly<{ state: GlobalLoadingState }>) {
  if (!state.isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{state.message ?? "Processing..."}</p>
            <p className="mt-1 text-xs text-gray-500">Please keep this tab open.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GlobalLoadingProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<GlobalLoadingState>({ isOpen: false })

  const showLoading = useCallback((message?: string) => {
    setState({ isOpen: true, message })
  }, [])

  const hideLoading = useCallback(() => {
    setState({ isOpen: false })
  }, [])

  const api = useMemo(() => ({ showLoading, hideLoading }), [showLoading, hideLoading])

  return (
    <GlobalLoadingContext.Provider value={api}>
      {children}
      <GlobalLoadingOverlay state={state} />
    </GlobalLoadingContext.Provider>
  )
}
