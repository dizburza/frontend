"use client"

import { useEffect, useRef } from "react"
import { flushBackendSyncQueue } from "@/lib/backend-sync-queue"

export default function BackendSyncQueueFlusher() {
  const flushingRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      if (cancelled) return
      if (flushingRef.current) return

      try {
        flushingRef.current = true
        await flushBackendSyncQueue({ maxJobs: 5 })
      } finally {
        flushingRef.current = false
      }
    }

    void tick()
    const interval = setInterval(() => {
      void tick()
    }, 10_000)

    const onOnline = () => {
      void tick()
    }

    globalThis.addEventListener("online", onOnline)

    return () => {
      cancelled = true
      clearInterval(interval)
      globalThis.removeEventListener("online", onOnline)
    }
  }, [])

  return null
}
