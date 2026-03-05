"use client"

import { useEffect, useMemo, useRef } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type BarcodeDetectorLike = {
  detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

const getBarcodeDetector = (): (new (opts: { formats: string[] }) => BarcodeDetectorLike) | null => {
  const w = globalThis as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike }
  return w.BarcodeDetector ?? null
}

const isHexAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value)

const recipientFromParams = (
  addressRaw: string,
  usernameRaw: string,
): { address?: string; username?: string; recipient: string } | null => {
  const address = addressRaw.trim()
  const username = usernameRaw.trim().replace(/^@/, "")

  if (username) {
    const u = username.toLowerCase()
    return { username: u, recipient: `@${u}`, address: address || undefined }
  }

  if (isHexAddress(address)) {
    return { address, recipient: address }
  }

  return null
}

const parseMetamaskDeepLinkUrl = (url: URL): { address?: string; username?: string; recipient: string } | null => {
  const dappTarget = url.pathname.slice("/dapp/".length)
  const dappUrl = new URL(`https://${dappTarget}${url.search}`)
  return recipientFromParams(dappUrl.searchParams.get("address") || "", dappUrl.searchParams.get("username") || "")
}

const parseReceiveLinkUrl = (url: URL): { address?: string; username?: string; recipient: string } | null => {
  return recipientFromParams(url.searchParams.get("address") || "", url.searchParams.get("username") || "")
}

const parseScannedValueToRecipient = (raw: string): { address?: string; username?: string; recipient: string } | null => {
  const input = raw.trim()
  if (!input) return null

  if (isHexAddress(input)) {
    return { address: input, recipient: input }
  }

  if (input.startsWith("@")) {
    const u = input.slice(1).trim().toLowerCase()
    if (!u) return null
    return { username: u, recipient: `@${u}` }
  }

  try {
    const url = new URL(input)

    // Handle MetaMask deep link: https://metamask.app.link/dapp/<host>/<path>?...
    if (url.host === "metamask.app.link" && url.pathname.startsWith("/dapp/")) {
      return parseMetamaskDeepLinkUrl(url)
    }

    // Handle direct app receive link (web): https://yourapp.com/receive?address=...&username=...
    return parseReceiveLinkUrl(url)
  } catch {
    return null
  }
}

interface QRScanModalProps {
  isOpen: boolean
  onClose: () => void
  onDetected: (payload: { recipient: string; address?: string; username?: string }) => void
}

export function QRScanModal({ isOpen, onClose, onDetected }: Readonly<QRScanModalProps>) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)

  const Detector = useMemo(() => getBarcodeDetector(), [])
  const canScan = Boolean(Detector)

  const stop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    const stream = streamRef.current
    streamRef.current = null
    if (stream) {
      for (const t of stream.getTracks()) t.stop()
    }

    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null
      } catch {
        // ignore
      }
    }

    // state cleanup handled by stream/raf teardown
  }

  const handleClose = () => {
    stop()
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      stop()
      return
    }

    if (!canScan) {
      toast.error("QR scanning not supported on this device/browser")
      return
    }

    let cancelled = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })

        if (cancelled) {
          for (const t of stream.getTracks()) t.stop()
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) return

        video.srcObject = stream
        await video.play()

        const detector = new Detector!({ formats: ["qr_code"] })

        const loop = async () => {
          if (!videoRef.current) return
          if (cancelled) return

          try {
            const results = await detector.detect(videoRef.current)
            const rawValue = results?.[0]?.rawValue?.trim() || ""
            if (rawValue) {
              const parsed = parseScannedValueToRecipient(rawValue)
              if (parsed) {
                stop()
                onDetected({ recipient: parsed.recipient, address: parsed.address, username: parsed.username })
                onClose()
                return
              }
            }
          } catch {
            // ignore detection errors
          }

          rafRef.current = requestAnimationFrame(rafTick)
        }

        const rafTick: FrameRequestCallback = () => {
          void loop()
        }

        void loop()
      } catch {
        toast.error("Could not access camera")
      }
    }

    void start()

    return () => {
      cancelled = true
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, canScan])

  if (!isOpen) return null

  return (
    <TransactionModal title="Scan QR" onClose={handleClose}>
      <div className="space-y-4">
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-black">
          <video ref={videoRef} className="w-full h-72 object-cover" playsInline muted />
        </div>

        <p className="text-sm text-gray-600">
          Point your camera at a Dizburza QR code. We support MetaMask deep links and receive links.
        </p>

        <Button variant="outline" className="bg-transparent w-full" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </TransactionModal>
  )
}
