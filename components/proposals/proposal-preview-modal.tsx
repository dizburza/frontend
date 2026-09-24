"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ModalChrome } from "./modal-chrome"
import { formatAmountInput } from "./create-proposal-modal"
import { ProposalSuccessModal } from "./proposal-success-modal"
import { createProposal } from "@/lib/api/proposals"
import { fetchSessionProfile } from "@/lib/session"
import { useToken } from "@/hooks/useToken"
import useOrgSlug from "@/hooks/useOrgSlug"
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

const formatDate = (value: Date) =>
  value.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

export function ProposalPreviewModal({
  formData,
  organizationId,
  onBack,
  onClose,
  onProposalCreated,
}: Readonly<ProposalPreviewModalProps>) {
  const router = useRouter()
  const orgSlug = useOrgSlug()
  const { symbol } = useToken()
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Nothing is created yet, so the byline is whoever is about to raise it.
  const [author, setAuthor] = useState("You")

  useEffect(() => {
    const controller = new AbortController()

    fetchSessionProfile(controller.signal).then((profile) => {
      const name = profile?.fullName?.trim() || profile?.username?.trim()
      if (name) setAuthor(name)
    })

    return () => controller.abort()
  }, [])

  const handleSubmit = async () => {
    if (isSubmitting) return

    if (!organizationId) {
      toast.error("Organization not loaded yet. Try again in a moment.")
      return
    }

    try {
      setIsSubmitting(true)

      const proposal = await createProposal({
        organizationId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        amount: formData.amount.trim() || undefined,
        // End of the chosen day, so a proposal closing "today" still has today.
        closesAt: new Date(`${formData.closesAt}T23:59:59`).toISOString(),
      })

      onProposalCreated?.()
      setCreatedId(proposal.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not raise the proposal")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (createdId) {
    return (
      <ProposalSuccessModal
        onViewProposal={() => {
          onClose()
          if (orgSlug) router.push(`/org/${orgSlug}/proposals/${createdId}`)
        }}
      />
    )
  }

  return (
    <ModalChrome title="Proposal Preview" onBack={onBack} onClose={onClose}>
      <div className="self-stretch flex flex-col justify-start items-start gap-8">
        <div className="self-stretch flex flex-col justify-start items-center gap-5">
          <div className="self-stretch text-neutral-600 text-3xl sm:text-5xl font-semibold font-nohemi leading-tight sm:leading-[57.60px]">
            {formData.title}
          </div>
          <div className="self-stretch px-2 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Fact label="Created by:" value={author} />
            <Fact label="Created on:" value={formatDate(new Date())} />
            <Fact
              label="Amount Requested:"
              value={formData.amount ? `${symbol}${formatAmountInput(formData.amount)}` : "None"}
            />
          </div>
        </div>

        <div className="self-stretch flex flex-col justify-start items-start gap-4">
          <div className="self-stretch text-neutral-500 text-base font-medium">Description</div>
          <div className="self-stretch text-neutral-800 text-lg sm:text-xl font-medium leading-8 whitespace-pre-line">
            {formData.description || "No description provided."}
          </div>
        </div>
      </div>

      <div className="self-stretch flex justify-between items-start">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-violet-50 rounded-sm shadow-[0px_2px_9px_-1.5px_rgba(240,241,253,0.25),inset_0px_-6px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_-2px_1px_0.5px_rgba(240,241,253,0.60),inset_0px_11px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_3px_1px_0px_rgba(240,241,253,0.22)] outline outline-2 outline-indigo-50 flex justify-center items-center gap-2.5 overflow-hidden text-blue-950 text-base font-medium transition-[filter] hover:brightness-[1.04]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-indigo-600 rounded-sm shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)] outline outline-2 outline-indigo-400 flex justify-center items-center gap-2.5 overflow-hidden text-white text-base font-medium transition-[filter] hover:brightness-[1.04] disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </ModalChrome>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-start items-center gap-1">
      <div className="text-neutral-500 text-sm font-normal leading-4">{label}</div>
      <div className="text-neutral-800 text-sm font-semibold leading-4">{value}</div>
    </div>
  )
}
