"use client"

import { useState } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { SuccessModal } from "@/components/success-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"

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

  if (!isOpen) return null

  const handleNext = async () => {
    if (step === "recipient" && recipient) {
      setStep("amount")
    } else if (step === "amount" && amount) {
      if (isLoading) return

      try {
        setIsLoading(true)
        showLoading("Confirming transfer...")
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
                Available balance: <span className="font-semibold">25 cNGN</span>
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
