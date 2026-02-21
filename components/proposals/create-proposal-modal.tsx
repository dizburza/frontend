"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { ProposalPreviewModal } from "./proposal-preview-modal"

interface CreateProposalModalProps {
  onClose: () => void
  onProposalCreated?: () => void
}

export function CreateProposalModal({ onClose, onProposalCreated }: Readonly<CreateProposalModalProps>) {
  const [step, setStep] = useState<"form" | "preview">("form")
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    startDate: "Oct 21,2025",
    endDate: "Oct 21,2025",
    description: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePreview = () => {
    setStep("preview")
  }

  const handleBack = () => {
    setStep("form")
  }

  if (step === "preview") {
    return <ProposalPreviewModal formData={formData} onBack={handleBack} onClose={onClose} onProposalCreated={onProposalCreated} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Create New Proposal</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600">Enter the details of your new proposal for review and approval.</p>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <Input
              id="title"
              name="title"
              placeholder="Enter proposal title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          {/* Request Amount */}
          <div>
            <label htmlFor="requestAmount" className="block text-sm font-medium text-gray-700 mb-2">Request Amount (cNGN)</label>
            <Input
              id="requestAmount"
              name="amount"
              placeholder="Enter required amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <Input id="startDate" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <Input id="endDate" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter brief description about the proposal"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-2">{formData.description.length}/700</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePreview} className="bg-blue-600 hover:bg-blue-700 text-white">
            Preview
          </Button>
        </div>
      </div>
    </div>
  )
}
