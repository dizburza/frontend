"use client"

import { TransactionModal } from "@/components/transaction-modal"
import { Button } from "@/components/ui/button"
import { Check, Copy, Share2 } from "lucide-react"
import { useActiveAccount } from "thirdweb/react"
import { useEffect, useMemo, useState } from "react"
import QRCode from "react-qr-code"
import { toast } from "sonner"

interface QRCodeModalProps {
  onClose: () => void
}

export function QRCodeModal({ onClose }: Readonly<QRCodeModalProps>) {
  const account = useActiveAccount()
  const address = account?.address || ""

  const appOrigin = (process.env.NEXT_PUBLIC_APP_ORIGIN) || ""

  const username = useMemo(() => {
    if (!address) return ""
    try {
      const raw = localStorage.getItem(`authCheck:${address}`)
      if (!raw) return ""
      const parsed = JSON.parse(raw) as { username?: string }
      return parsed.username || ""
    } catch {
      return ""
    }
  }, [address])

  const [selected, setSelected] = useState<"address" | "username">("address")
  const [copied, setCopied] = useState<"address" | "username" | null>(null)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(null), 1500)
    return () => clearTimeout(t)
  }, [copied])

  const shortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 4)}...${value.slice(-4)}`
  }

  const [origin, setOrigin] = useState("")

  useEffect(() => {
    try {
      setOrigin(globalThis.location.origin)
    } catch {
      setOrigin("")
    }
  }, [])

  const deepLink = useMemo(() => {
    const base = appOrigin || origin
    if (!base) return ""

    const url = new URL("/receive", base)
    const addressParam = selected === "address" ? address : ""
    const usernameParam = selected === "username" ? username : ""
    if (addressParam) url.searchParams.set("address", addressParam)
    if (usernameParam) url.searchParams.set("username", usernameParam)

    const dappTarget = `${url.host}${url.pathname}${url.search}`
    return `https://metamask.app.link/dapp/${dappTarget}`
  }, [address, appOrigin, origin, selected, username])

  const qrValue = deepLink

  const shareValue = useMemo(() => {
    return deepLink
  }, [deepLink])

  const copyToClipboard = async (value: string, key: "address" | "username") => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
    } catch {
      toast.error("Could not copy")
      return
    }
  }

  const share = async () => {
    if (!shareValue) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Dizburza Receive",
          text: `Send cNGN to: ${shareValue}`,
        })
        toast.success("Shared")
        return
      }

      await navigator.clipboard.writeText(shareValue)
      setCopied(selected)
      toast.success("Copied")
    } catch {
      toast.error("Could not share")
      return
    }
  }

  return (
    <TransactionModal title="Receive from others" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-white rounded flex items-center justify-center border border-gray-200 p-3">
            {qrValue ? (
              <QRCode value={qrValue} size={180} />
            ) : (
              <div className="text-sm text-gray-500">Connect wallet</div>
            )}
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-semibold mb-2">Scan Your QR Code</h3>
          <p className="text-sm text-gray-600">
            Use this code to receive payments instantly from other Dizburza users.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600">OR</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelected("address")}
              className={`p-3 bg-gray-50 rounded text-center text-sm font-mono border ${
                selected === "address" ? "border-blue-500" : "border-transparent"
              }`}
            >
              {shortAddress(address)}
            </button>
            <button
              type="button"
              onClick={() => setSelected("username")}
              className={`p-3 bg-gray-50 rounded text-center text-sm border ${
                selected === "username" ? "border-blue-500" : "border-transparent"
              }`}
            >
              {username ? `@${username}` : "--"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => copyToClipboard(address, "address")}
              disabled={!address}
            >
              {copied === "address" ? <Check size={16} /> : <Copy size={16} />}
              Copy address
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent"
              onClick={() => copyToClipboard(username ? `@${username}` : "", "username")}
              disabled={!username}
            >
              {copied === "username" ? <Check size={16} /> : <Copy size={16} />}
              Copy username
            </Button>
          </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2" onClick={share} disabled={!shareValue}>
          <Share2 size={18} />
          Share
        </Button>
      </div>
    </TransactionModal>
  )
}
