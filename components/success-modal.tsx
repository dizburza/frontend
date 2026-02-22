"use client"

import { CheckCircle, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransactionModal } from "@/components/transaction-modal"
import { TransactionSummary } from "@/components/transaction-summary"

interface SuccessModalProps {
  title: string
  icon?: "check" | "thumbs"
  summary: Array<{ label: string; value: string }>
  onClose: () => void
}

export function SuccessModal({ title, icon = "check", summary, onClose }: Readonly<SuccessModalProps>) {
  return (
    <TransactionModal title={title} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          {icon === "check" ? (
            <CheckCircle size={64} className="text-blue-600" />
          ) : (
            <ThumbsUp size={64} className="text-blue-600" />
          )}
          <p className="text-lg font-semibold text-blue-600">Successful</p>
        </div>

        <TransactionSummary items={summary} />

        <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700">
          Back Home
        </Button>
      </div>
    </TransactionModal>
  )
}
