"use client"

import { useState } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { SuccessModal } from "@/components/success-modal"
import { BankSelectionModal } from "@/components/bank-selection-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"

interface SendToBankFlowProps {
  isOpen: boolean
  onClose: () => void
}

type Step = "account" | "bank" | "amount" | "success"

export function SendToBankFlow({ isOpen, onClose }: Readonly<SendToBankFlowProps>) {
  const [step, setStep] = useState<Step>("account")
  const [accountNumber, setAccountNumber] = useState("")
  const [selectedBank, setSelectedBank] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { showLoading, hideLoading } = useGlobalLoading()

  if (!isOpen) return null

  const handleNext = async () => {
    if (step === "account" && accountNumber) {
      setStep("bank")
    } else if (step === "bank" && selectedBank) {
      setStep("amount")
    } else if (step === "amount" && amount) {
      if (isLoading) return

      try {
        setIsLoading(true)
        showLoading("Confirming bank transfer...")
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
    if (step === "bank") {
      setStep("account")
    } else if (step === "amount") {
      setStep("bank")
    } else if (step === "success") {
      setStep("amount")
    }
  }

  if (step === "success") {
    return (
      <SuccessModal
        title="Send to Bank Account"
        icon="check"
        summary={[
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
          {
            label: "To",
            value: accountNumber,
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

  if (step === "bank") {
    return (
      <BankSelectionModal
        onSelect={(bank) => {
          setSelectedBank(bank)
          setStep("amount")
        }}
        onClose={onClose}
      />
    )
  }

  return (
    <TransactionModal
      title="Send to Bank Account"
      onClose={onClose}
      onBack={step === "account" ? undefined : handleBack}
    >
      <div className="space-y-6">
        {step === "account" && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Recipient Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the recipient&apos;s bank account number to send money securely. Confirm details before proceeding.
              </p>
              <Input
                placeholder="Enter account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <Button onClick={handleNext} disabled={!accountNumber} className="w-full">
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
