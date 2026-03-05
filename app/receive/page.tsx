"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow"

type EthereumProvider = {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>
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

  const chainId = (await ethereum.request({ method: "eth_chainId" })) as string
  if (chainId?.toLowerCase() !== BASE_SEPOLIA_CHAIN_ID_HEX.toLowerCase()) {
    throw new Error("Switch to Base Sepolia first")
  }

  // Some wallets require an active account connection before allowing wallet_watchAsset.
  await ethereum.request({ method: "eth_requestAccounts" })

  const tokenAddress = (process.env.NEXT_PUBLIC_CNGN_ADDRESS || "").trim()
  if (!tokenAddress) throw new Error("Missing NEXT_PUBLIC_CNGN_ADDRESS")

  if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) {
    throw new Error("NEXT_PUBLIC_CNGN_ADDRESS is not a valid ERC20 contract address")
  }

  const tokenImage = (() => {
    try {
      return new URL("/cngn.svg", globalThis.location.origin).toString()
    } catch {
      return undefined
    }
  })()

  const added = (await ethereum.request({
    method: "wallet_watchAsset",
    params: {
      type: "ERC20",
      options: {
        address: tokenAddress,
        symbol: "cNGN",
        decimals: 6,
        image: tokenImage,
      },
    },
  })) as boolean

  if (!added) {
    throw new Error("Token was not added")
  }
}

const shortAddress = (value: string) => {
  if (!value) return "--"
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const copyText = async (value: string) => {
  if (!value) return
  await navigator.clipboard.writeText(value)
}

const getTokenContractAddress = () => {
  return (process.env.NEXT_PUBLIC_CNGN_ADDRESS || "").trim()
}

const manualImportMessage = "MetaMask mobile may not support auto-add here. Import manually: Assets → Import tokens → Custom token."

const isNotSupportedError = (message: string) => {
  return message.toLowerCase().includes("not supported")
}

const showManualImportToast = (tokenAddress: string) => {
  toast.error(manualImportMessage, {
    action: tokenAddress
      ? {
          label: "Copy contract",
          onClick: () => {
            void (async () => {
              try {
                await copyText(tokenAddress)
                toast.success("Contract copied")
              } catch {
                toast.error("Could not copy")
              }
            })()
          },
        }
      : undefined,
  })
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
  const [showSend, setShowSend] = useState(false)

  const displayUsername = username ? `@${username}` : ""

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

  useEffect(() => {
    setShowSend(false)
  }, [address, username])

  const copy = async (value: string) => {
    if (!value) return
    try {
      await copyText(value)
      toast.success("Copied")
    } catch {
      toast.error("Could not copy")
    }
  }

  const handleAddNetwork = async () => {
    setIsPrompting(true)
    try {
      await ensureBaseSepolia()
      toast.success("Base Sepolia ready")
    } catch {
      toast.error("Could not add/switch network")
    } finally {
      setIsPrompting(false)
    }
  }

  const handleAddToken = async () => {
    setIsPrompting(true)
    try {
      await ensureBaseSepolia()
      await watchCngnToken()
      toast.success("cNGN added")
    } catch (err) {
      const e = err as { message?: string }
      const message = e?.message || ""
      if (isNotSupportedError(message)) {
        showManualImportToast(getTokenContractAddress())
        return
      }
      toast.error(message || "Could not add token")
    } finally {
      setIsPrompting(false)
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
                void handleAddNetwork()
              }}
              disabled={isPrompting}
            >
              Add network
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                void handleAddToken()
              }}
              disabled={isPrompting}
            >
              Add token
            </Button>
          </div>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowSend(true)}
            disabled={isPrompting || (!address && !displayUsername)}
          >
            Send cNGN
          </Button>
        </Card>

        <SendToCNGNFlow
          isOpen={showSend}
          onClose={() => setShowSend(false)}
          initialRecipient={address || (displayUsername || undefined)}
        />
      </div>
    </div>
  )
}
