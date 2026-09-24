"use client"

import type React from "react"

import { useState } from "react"
import { ModalChrome } from "./modal-chrome"
import { ProposalPreviewModal } from "./proposal-preview-modal"
import { useToken } from "@/hooks/useToken"
import { toast } from "sonner"

interface CreateProposalModalProps {
  organizationId?: string
  onClose: () => void
  onProposalCreated?: () => void
}

// The schema's description column is unbounded text; this is a soft cap
// against runaway pasting, not a constraint the backend enforces.
const DESCRIPTION_LIMIT = 1000

/** Voting runs for a week unless the raiser picks another closing date. */
const defaultClosesAt = () => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().slice(0, 10)
}

/** Thousands separators for display only; the stored value stays plain digits. */
export const formatAmountInput = (raw: string): string => {
  if (!raw) return ""
  const [whole, decimal] = raw.split(".")
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return decimal !== undefined ? `${withCommas}.${decimal}` : withCommas
}

export function CreateProposalModal({
  organizationId,
  onClose,
  onProposalCreated,
}: Readonly<CreateProposalModalProps>) {
  const { symbol } = useToken()
  const [step, setStep] = useState<"form" | "preview">("form")
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    closesAt: defaultClosesAt(),
    description: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // The backend takes a plain decimal string (no thousands separators), so
  // typed commas are stripped before they reach state. Only one decimal point
  // survives, and everything past it is kept intact rather than parsed, since
  // this is a string the amount is formatted from, not a number to round.
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^\d.]/g, "")
    const [whole, ...rest] = digits.split(".")
    const cleaned = rest.length > 0 ? `${whole}.${rest.join("")}` : whole
    setFormData((prev) => ({ ...prev, amount: cleaned }))
  }

  const handlePreview = () => {
    if (!formData.title.trim()) {
      toast.error("Give the proposal a title")
      return
    }
    if (new Date(formData.closesAt).getTime() <= Date.now()) {
      toast.error("The expiry date must be in the future")
      return
    }
    setStep("preview")
  }

  if (step === "preview") {
    return (
      <ProposalPreviewModal
        formData={formData}
        organizationId={organizationId}
        onBack={() => setStep("form")}
        onClose={onClose}
        onProposalCreated={onProposalCreated}
      />
    )
  }

  return (
    <ModalChrome title="Create New Proposal" onBack={onClose} onClose={onClose}>
      <div className="self-stretch flex flex-col justify-start items-start gap-10">
        <div className="self-stretch text-neutral-600 text-xs font-normal">
          Enter the details of your new proposal for review and approval.
        </div>
      </div>

      <div className="self-stretch flex flex-col justify-start items-start gap-6">
        <div className="self-stretch flex flex-col justify-start items-start gap-5">
          <Field label="Title">
            <input
              name="title"
              placeholder="Enter proposal title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full bg-transparent text-gray-600 text-sm font-normal outline-none placeholder:text-gray-600"
            />
          </Field>

          <Field label={`Request Amount (${symbol})`}>
            <input
              name="amount"
              inputMode="decimal"
              placeholder="Enter required amount"
              value={formatAmountInput(formData.amount)}
              onChange={handleAmountChange}
              className="w-full bg-transparent text-gray-600 text-sm font-normal outline-none placeholder:text-gray-600"
            />
          </Field>

          <Field label="Expiry Date">
            <input
              name="closesAt"
              type="date"
              value={formData.closesAt}
              onChange={handleInputChange}
              className="w-full bg-transparent text-gray-600 text-sm font-normal outline-none"
            />
          </Field>
        </div>

        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            <label htmlFor="description" className="text-neutral-500 text-xs font-normal">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter brief description about the proposal"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={DESCRIPTION_LIMIT}
              className="self-stretch h-48 px-4 py-3 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-indigo-200 text-gray-600 text-sm font-normal resize-none placeholder:text-gray-600"
            />
          </div>
          <div className="text-neutral-500 text-[10px] font-normal">
            {formData.description.length}/{DESCRIPTION_LIMIT}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePreview}
          className="self-stretch px-6 py-3 bg-indigo-600 rounded-sm shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)] outline outline-2 outline-indigo-400 flex justify-center items-center gap-2.5 overflow-hidden text-white text-base font-medium transition-[filter] hover:brightness-[1.04]"
        >
          Preview
        </button>
      </div>
    </ModalChrome>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="self-stretch flex flex-col justify-start items-start gap-2">
      <div className="self-stretch text-neutral-500 text-xs font-normal">{label}</div>
      <div className="self-stretch p-4 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-indigo-200 flex justify-start items-center gap-4">
        {children}
      </div>
    </div>
  )
}
