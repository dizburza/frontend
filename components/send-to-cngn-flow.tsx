"use client"

import { useEffect, useState } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { SuccessModal } from "@/components/success-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"
import { useActiveAccount, useSendTransaction, useWalletBalance } from "thirdweb/react"
import { getContract } from "thirdweb"
import { prepareContractCall } from "thirdweb/transaction"
import { baseSepolia } from "thirdweb/chains"
import { thirdwebClient } from "@/app/client"
import { parseUnits } from "viem"

interface SendToCNGNFlowProps {
  isOpen: boolean
  onClose: () => void
  initialRecipient?: string
}

type Step = "recipient" | "amount" | "success"

export function SendToCNGNFlow({ isOpen, onClose, initialRecipient }: Readonly<SendToCNGNFlowProps>) {
  const [step, setStep] = useState<Step>("recipient")
  const [recipient, setRecipient] = useState("")
  const [resolvedRecipient, setResolvedRecipient] = useState<`0x${string}` | null>(null)
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { showLoading, hideLoading } = useGlobalLoading()

  const account = useActiveAccount()
  const { mutateAsync: sendTx } = useSendTransaction()

  const tokenAddress = process.env.NEXT_PUBLIC_CNGN_ADDRESS as `0x${string}` | undefined
  const contract = tokenAddress
    ? getContract({
        address: tokenAddress,
        chain: baseSepolia,
        client: thirdwebClient,
      })
    : null

  const { data: balanceData } = useWalletBalance({
    address: account?.address,
    chain: baseSepolia,
    client: thirdwebClient,
    tokenAddress,
  })

  useEffect(() => {
    if (!isOpen) return

    setStep("recipient")
    setAmount("")
    setResolvedRecipient(null)
    setResolvedUsername(null)

    if (typeof initialRecipient === "string") {
      const value = initialRecipient.trim()
      setRecipient(value)
      if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
        setResolvedRecipient(value as `0x${string}`)
        setResolvedUsername(null)
        setStep("amount")
      }
    } else {
      setRecipient("")
    }
  }, [initialRecipient, isOpen])

  if (!isOpen) return null

  const isHexAddress = (value: string): value is `0x${string}` => {
    return /^0x[a-fA-F0-9]{40}$/.test(value)
  }

  const parseUsername = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return null

    if (trimmed.startsWith("@@")) {
      return null
    }

    if (trimmed.startsWith("@") && (trimmed.length === 1 || /\s/.test(trimmed[1] ?? ""))) {
      return null
    }

    const cleaned = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed
    const username = cleaned.trim().toLowerCase()
    if (!username) return null

    // Keep it simple + compatible with existing generated usernames (letters/numbers/underscore)
    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      return null
    }

    return username
  }

  const resolveRecipient = async (): Promise<
    | { address: `0x${string}`; username: string | null }
    | null
  > => {
    const input = recipient.trim()
    if (!input) return null

    if (isHexAddress(input)) {
      return { address: input, username: null }
    }

    const username = parseUsername(input)
    if (!username) {
      toast.error("Enter a valid @username or 0x address")
      return null
    }

    try {
      showLoading("Resolving username...")
      const res = await fetch(`/api/users/resolve/${encodeURIComponent(username)}`)
      const body = (await res.json()) as { success?: boolean; data?: { username?: string; walletAddress?: string }; error?: string }

      if (!res.ok || !body?.data?.walletAddress) {
        toast.error(body?.error || "Could not resolve username")
        return null
      }

      const addr = body.data.walletAddress.trim()
      if (!isHexAddress(addr)) {
        toast.error("Resolved address is invalid")
        return null
      }

      return {
        address: addr,
        username: body.data.username || username,
      }
    } catch (e) {
      console.error(e)
      toast.error("Could not resolve username")
      return null
    } finally {
      hideLoading()
    }
  }

  const submitTransfer = async () => {
    try {
      if (!account?.address) {
        toast.error("Connect wallet to continue")
        return
      }

      if (!contract) {
        toast.error("Token contract not configured")
        return
      }

      if (!resolvedRecipient) {
        toast.error("Recipient not resolved")
        return
      }

      const parsedAmount = Number.parseFloat(amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Enter a valid amount")
        return
      }

      setIsLoading(true)
      showLoading("Confirming transfer...")

      const tx = prepareContractCall({
        contract,
        method: "function transfer(address to, uint256 value)",
        params: [resolvedRecipient, parseUnits(amount, 6)],
      })

      await sendTx(tx)

      toast.success("Transfer submitted")
      globalThis.dispatchEvent(new Event("cngn:activity:refresh"))
      setStep("success")
    } catch (error) {
      console.error(error)
      toast.error("Could not send. Please try again.")
    } finally {
      hideLoading()
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    if (step === "recipient") {
      if (!recipient) return
      if (isLoading) return

      const result = await resolveRecipient()
      if (!result) return

      setResolvedRecipient(result.address)
      setResolvedUsername(result.username)
      setStep("amount")
      return
    }

    if (step !== "amount" || !amount) return
    if (isLoading) return

    await submitTransfer()
  }

  const handleBack = () => {
    if (step === "amount") {
      setStep("recipient")
      setResolvedRecipient(null)
      setResolvedUsername(null)
    } else if (step === "success") {
      setStep("amount")
    }
  }

  if (step === "success") {
    return (
      <SuccessModal
        title="Send cNGN"
        icon="check"
        summary={[
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
          {
            label: "To",
            value: resolvedUsername ? `@${resolvedUsername}` : resolvedRecipient || recipient,
          },
          {
            label: "Network",
            value: "Base Sepolia",
          },
          {
            label: "Gas Fee",
            value: "0.0000001 ETH",
          },
        ]}
        onClose={onClose}
      />
    )
  }

  return (
    <TransactionModal
      title="Send cNGN"
      onClose={onClose}
      onBack={step === "recipient" ? undefined : handleBack}
    >
      <div className="space-y-6">
        {step === "recipient" && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Recipient Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the recipient&apos;s Dizburza username (@username) or wallet address (0x...) to send cNGN.
              </p>
              <Input
                placeholder="Enter @username or 0x address"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value)
                  setResolvedRecipient(null)
                  setResolvedUsername(null)
                }}
              />
            </div>
            <Button onClick={handleNext} disabled={!recipient || isLoading} className="w-full">
              Next
            </Button>
          </>
        )}

        {step === "amount" && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Enter Amount</h3>
              <p className="text-sm text-gray-600 mb-4">Specify the amount you want to send to this account.</p>
              <div className="text-sm text-gray-600 mb-4">
                Sending to: <span className="font-semibold">{resolvedUsername ? `@${resolvedUsername}` : resolvedRecipient || "--"}</span>
              </div>
              <Input
                placeholder="Enter amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="mt-4 text-sm text-gray-600">
                Available balance: <span className="font-semibold">{balanceData?.displayValue || "--"} cNGN</span>
              </div>
            </div>
            <Button onClick={handleNext} disabled={!amount || isLoading} className="w-full">
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </>
        )}
      </div>
    </TransactionModal>
  )
}
