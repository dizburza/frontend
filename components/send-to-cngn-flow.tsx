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

      if (!isHexAddress(recipient.trim())) {
        toast.error("Recipient must be a wallet address (0x...)")
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
        params: [recipient.trim(), parseUnits(amount, 6)],
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
      if (recipient) setStep("amount")
      return
    }

    if (step !== "amount" || !amount) return
    if (isLoading) return

    await submitTransfer()
  }

  const handleBack = () => {
    if (step === "amount") {
      setStep("recipient")
    } else if (step === "success") {
      setStep("amount")
    }
  }

  if (step === "success") {
    return (
      <SuccessModal
        title="Send to cNGN Account"
        icon="check"
        summary={[
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
          {
            label: "To",
            value: recipient,
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
      title="Send to cNGN Account"
      onClose={onClose}
      onBack={step === "recipient" ? undefined : handleBack}
    >
      <div className="space-y-6">
        {step === "recipient" && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Recipient Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the recipient&apos;s Dizburza username or wallet ID to send cNGN securely.
              </p>
              <Input
                placeholder="Enter Username or Wallet Address"
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
