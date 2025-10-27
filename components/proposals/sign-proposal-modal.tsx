"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SignProposalModalProps {
  onClose: () => void
}

export function SignProposalModal({ onClose }: SignProposalModalProps) {
  const [vote, setVote] = useState<"for" | "against" | null>(null)

  const handleSubmit = () => {
    if (vote) {
      // Handle submission
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Sign Proposal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Make your decision on this proposal.</p>
            <p className="text-sm text-gray-500">Once submitted, your vote cannot be changed.</p>
          </div>

          {/* Vote Options */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => setVote("for")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
                vote === "for"
                  ? "bg-green-100 border-2 border-green-600"
                  : "bg-gray-100 border-2 border-transparent hover:bg-gray-200"
              }`}
            >
              <span className="text-4xl">{vote === "for" ? "👍" : "👍"}</span>
              <span className={`text-sm font-medium ${vote === "for" ? "text-green-600" : "text-gray-600"}`}>For</span>
            </button>

            <button
              onClick={() => setVote("against")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
                vote === "against"
                  ? "bg-red-100 border-2 border-red-600"
                  : "bg-gray-100 border-2 border-transparent hover:bg-gray-200"
              }`}
            >
              <span className="text-4xl">{vote === "against" ? "👎" : "👎"}</span>
              <span className={`text-sm font-medium ${vote === "against" ? "text-red-600" : "text-gray-600"}`}>
                Against
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button
            onClick={handleSubmit}
            disabled={!vote}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  )
}
