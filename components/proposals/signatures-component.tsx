"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import type { Proposal } from "@/lib/api/proposals"

interface SignaturesComponentProps {
  proposal: Proposal
  canSign: boolean
  hasSigned: boolean
  onSignClick: () => void
}

const CIRCUMFERENCE = 2 * Math.PI * 45

export function SignaturesComponent({
  proposal,
  canSign,
  hasSigned,
  onSignClick,
}: Readonly<SignaturesComponentProps>) {
  const cast = proposal.votesFor + proposal.votesAgainst
  const progress = proposal.votesRequired === 0 ? 0 : Math.min(1, cast / proposal.votesRequired)
  const dash = `${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`

  let buttonLabel = "Sign Proposal"
  if (hasSigned) buttonLabel = "You have signed"
  else if (proposal.status !== "open") buttonLabel = "Signing closed"
  else if (!canSign) buttonLabel = "Signers only"

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Signatures</h3>

      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#16a34a"
              strokeWidth="8"
              strokeDasharray={dash}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{cast}</span>
          </div>
        </div>
        <p className="text-center text-sm">
          <span className="font-semibold">
            {cast} Signature{cast === 1 ? "" : "s"}
          </span>
          <span className="text-gray-600"> Obtained</span>
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>FOR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span>AGAINST</span>
        </div>
      </div>

      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-sm">For</span>
          </div>
          <span className="font-semibold">{proposal.votesFor}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-sm">Against</span>
          </div>
          <span className="font-semibold">{proposal.votesAgainst}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-blue-600" />
          <span className="text-sm font-medium">Quorum</span>
        </div>
        <span className="font-semibold">{proposal.votesRequired}</span>
      </div>

      {proposal.votes.length > 0 && (
        <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
          {proposal.votes.map((vote) => (
            <div key={vote.voterAddress} className="flex items-center justify-between text-sm">
              <span className="truncate text-gray-700">{vote.voterName}</span>
              <span
                className={vote.choice === "for" ? "text-green-600" : "text-red-600"}
              >
                {vote.choice === "for" ? "For" : "Against"}
              </span>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={onSignClick}
        disabled={!canSign || hasSigned || proposal.status !== "open"}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        {buttonLabel}
      </Button>
    </Card>
  )
}
