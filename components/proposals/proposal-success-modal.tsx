"use client"

import { Button } from "@/components/ui/button"
import { X, CheckCircle } from "lucide-react"

interface ProposalSuccessModalProps {
  onClose: () => void
}

export function ProposalSuccessModal({ onClose }: ProposalSuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Proposal Created</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-blue-600" />
          </div>
          <p className="text-lg font-semibold text-blue-600">Successful</p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Back Home
          </Button>
        </div>
      </div>
    </div>
  )
}
