"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

const BASE_SEPOLIA_CHAIN_ID_DEC = 84532
const BASE_SEPOLIA_CHAIN_ID_HEX = "0x14A34"

const getEthereum = (): EthereumProvider | null => {
  const w = globalThis as unknown as { ethereum?: EthereumProvider }
  return w.ethereum ?? null
}

async function ensureBaseSepolia() {
  const ethereum = getEthereum()
  if (!ethereum) throw new Error("No wallet provider found")

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    })
  } catch (err) {
    const e = err as { code?: number; message?: string }
    if (e?.code !== 4902) throw err

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_SEPOLIA_CHAIN_ID_HEX,
          chainName: "Base Sepolia",
          nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
          rpcUrls: ["https://sepolia.base.org"],
          blockExplorerUrls: ["https://sepolia.basescan.org"],
        },
      ],
    })

    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_SEPOLIA_CHAIN_ID_HEX }],
    })
  }
}

async function watchCngnToken() {
  const ethereum = getEthereum()
  if (!ethereum) throw new Error("No wallet provider found")

  const tokenAddress = process.env.NEXT_PUBLIC_CNGN_ADDRESS
  if (!tokenAddress) throw new Error("Missing NEXT_PUBLIC_CNGN_ADDRESS")

  await ethereum.request({
    method: "wallet_watchAsset",
    params: [
      {
        type: "ERC20",
        options: {
          address: tokenAddress,
          symbol: "cNGN",
          decimals: 6,
        },
      },
    ],
  })
}

const shortAddress = (value: string) => {
  if (!value) return "--"
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

export default function ReceivePage() {
  return (
    <Suspense>
      <ReceivePageContent />
    </Suspense>
  )
}

function ReceivePageContent() {
  const params = useSearchParams()
  const address = (params.get("address") || "").trim()
  const username = (params.get("username") || "").trim().replace(/^@/, "")

  const [isPrompting, setIsPrompting] = useState(false)

  const displayUsername = username ? `@${username}` : ""

  const canCopy = Boolean(address || displayUsername)

  const title = useMemo(() => {
    if (displayUsername) return `Send cNGN to ${displayUsername}`
    if (address) return `Send cNGN to ${shortAddress(address)}`
    return "Receive"
  }, [address, displayUsername])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setIsPrompting(true)
      try {
        await ensureBaseSepolia()
        if (cancelled) return
        await watchCngnToken()
      } catch {
        // ignore; user may reject prompts
      } finally {
        if (!cancelled) setIsPrompting(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [])

  const copy = async (value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Copied")
    } catch {
      toast.error("Could not copy")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="max-w-md mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        <Card className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Network</p>
            <p className="font-medium text-gray-900">Base Sepolia ({BASE_SEPOLIA_CHAIN_ID_DEC})</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Token</p>
            <p className="font-medium text-gray-900">cNGN</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">Recipient</p>
            <div className="rounded-md border bg-white p-3">
              <p className="text-sm font-mono break-all text-gray-900">{address || "--"}</p>
              {displayUsername ? <p className="text-sm text-gray-700 mt-1">{displayUsername}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="bg-transparent" onClick={() => void copy(address)} disabled={!address}>
              Copy address
            </Button>
            <Button
              variant="outline"
              className="bg-transparent"
              onClick={() => void copy(displayUsername)}
              disabled={!displayUsername}
            >
              Copy username
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                void (async () => {
                  setIsPrompting(true)
                  try {
                    await ensureBaseSepolia()
                    toast.success("Base Sepolia ready")
                  } catch {
                    toast.error("Could not add/switch network")
                  } finally {
                    setIsPrompting(false)
                  }
                })()
              }}
              disabled={isPrompting}
            >
              Add network
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                void (async () => {
                  setIsPrompting(true)
                  try {
                    await watchCngnToken()
                    toast.success("cNGN added")
                  } catch {
                    toast.error("Could not add token")
                  } finally {
                    setIsPrompting(false)
                  }
                })()
              }}
              disabled={isPrompting}
            >
              Add token
            </Button>
          </div>

          {canCopy ? null : <p className="text-xs text-gray-500">Missing recipient info in QR link.</p>}
        </Card>

        <p className="text-xs text-gray-500">
          If prompts don’t appear, open this page inside your wallet browser (MetaMask) and tap “Add network” and “Add
          token”.
        </p>
      </div>
    </div>
  )
}
