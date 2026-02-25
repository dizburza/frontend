"use client"

import { useState } from "react"
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
}

type Step = "recipient" | "amount" | "success"

export function SendToCNGNFlow({ isOpen, onClose }: Readonly<SendToCNGNFlowProps>) {
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

  if (!isOpen) return null

  const isHexAddress = (value: string): value is `0x${string}` => {
    return /^0x[a-fA-F0-9]{40}$/.test(value)
  }

  const isUsername = (value: string) => {
    return value.trim().startsWith("@")
  }

  const resolveRecipient = async () => {
    const input = recipient.trim()
    if (!input) return

    if (isHexAddress(input)) {
      setResolvedRecipient(input)
      setResolvedUsername(null)
      return
    }

    if (!isUsername(input)) {
      toast.error("Enter a wallet address (0x...) or a username (@...)")
      return
    }

    const cleaned = input.slice(1).trim()
    if (cleaned.length < 3) {
      toast.error("Username must be at least 3 characters")
      return
    }

    try {
      showLoading("Resolving username...")
      const backend = process.env.BACKEND_URL
      if (!backend) {
        toast.error("Backend URL not configured")
        return
      }

      const res = await fetch(`${backend}/api/users/resolve/${encodeURIComponent(cleaned)}`)
      const body = (await res.json()) as { success?: boolean; data?: { username?: string; walletAddress?: string }; error?: string }

      if (!res.ok || !body?.data?.walletAddress) {
        toast.error(body?.error || "Could not resolve username")
        return
      }

      const addr = body.data.walletAddress.trim()
      if (!isHexAddress(addr)) {
        toast.error("Resolved address is invalid")
        return
      }

      setResolvedRecipient(addr)
      setResolvedUsername(body.data.username || cleaned.toLowerCase())
    } catch (e) {
      console.error(e)
      toast.error("Could not resolve username")
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

      await resolveRecipient()
      if (!resolvedRecipient) return
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
            value: "Base",
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
                onChange={(e) => setRecipient(e.target.value)}
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
