"use client"

import { useState } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { SuccessModal } from "@/components/success-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SendToCNGNFlowProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "recipient" | "amount" | "success"

export function SendToCNGNFlow({ isOpen, onClose }: SendToCNGNFlowProps) {
  const [step, setStep] = useState<Step>("recipient")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")

  if (!isOpen) return null

  const handleNext = () => {
    if (step === "recipient" && recipient) {
      setStep("amount")
    } else if (step === "amount" && amount) {
      setStep("success")
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
            <Button onClick={handleNext} disabled={!recipient} className="w-full">
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
            <Button onClick={handleNext} disabled={!amount} className="w-full">
              Send
            </Button>
          </>
        )}
      </div>
    </TransactionModal>
  )
}
