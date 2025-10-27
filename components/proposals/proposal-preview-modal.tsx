"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft } from "lucide-react"
import { ProposalSuccessModal } from "./proposal-success-modal"

interface ProposalPreviewModalProps {
  formData: {
    title: string
    amount: string
    startDate: string
    endDate: string
    description: string
  }
  onBack: () => void
  onClose: () => void
}

export function ProposalPreviewModal({ formData, onBack, onClose }: ProposalPreviewModalProps) {
  const [showSuccess, setShowSuccess] = useState(false)

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
            <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-600">Created by:</p>
                <p className="font-medium">CEO</p>
              </div>
              <div>
                <p className="text-gray-600">Created on:</p>
                <p className="font-medium">Oct 7, 2025</p>
              </div>
              <div>
                <p className="text-gray-600">Amount Requested:</p>
                <p className="font-medium">cNGN{formData.amount}</p>
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
          <Button onClick={() => setShowSuccess(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
