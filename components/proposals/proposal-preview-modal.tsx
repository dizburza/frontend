"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft } from "lucide-react"
import { ProposalSuccessModal } from "./proposal-success-modal"
import { createProposal } from "@/lib/api/proposals"
import { useToken } from "@/hooks/useToken"
import { toast } from "sonner"

interface ProposalPreviewModalProps {
  formData: {
    title: string
    amount: string
    closesAt: string
    description: string
  }
  organizationId?: string
  onBack: () => void
  onClose: () => void
  onProposalCreated?: () => void
}

export function ProposalPreviewModal({
  formData,
  organizationId,
  onBack,
  onClose,
  onProposalCreated,
}: Readonly<ProposalPreviewModalProps>) {
  const { symbol } = useToken()
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (isSubmitting) return

    if (!organizationId) {
      toast.error("Organization not loaded yet. Try again in a moment.")
      return
    }

    try {
      setIsSubmitting(true)

      await createProposal({
        organizationId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: formData.amount.trim() || undefined,
        // End of the chosen day, so a proposal closing "today" still has today.
        closesAt: new Date(`${formData.closesAt}T23:59:59`).toISOString(),
      })

      onProposalCreated?.()
      setShowSuccess(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not raise the proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return <ProposalSuccessModal onClose={onClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-semibold">Proposal Preview</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600">Enter the details of your new proposal for review and approval.</p>

          <div>
            <h3 className="text-2xl font-bold mb-4">{formData.title}</h3>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-600">Amount requested:</p>
                <p className="font-medium">
                  {formData.amount ? `${symbol} ${formData.amount}` : "None"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Signing closes:</p>
                <p className="font-medium">
                  {new Date(formData.closesAt).toLocaleDateString()}
                </p>
              </div>

            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <p className="text-gray-700 leading-relaxed">{formData.description}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  )
}
