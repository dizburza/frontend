"use client"

import { useState } from "react"
import Image from "next/image"
import type { Proposal } from "@/lib/api/proposals"
import { voteOnProposal } from "@/lib/api/proposals"
import { VoteConfirmModal } from "./vote-confirm-modal"
import { toast } from "sonner"

interface VotingPanelProps {
  proposal: Proposal
  canSign: boolean
  hasSigned: boolean
  voterAddress: string
  onVoteSubmitted: () => void
}

/**
 * Cast Your Vote and Voting Result, together: the vote a signer is about to
 * cast and the tally it joins are the same number, so splitting them into
 * separate cards would mean re-deriving the cast-vs-quorum math twice.
 */
export function VotingPanel({
  proposal,
  canSign,
  hasSigned,
  voterAddress,
  onVoteSubmitted,
}: Readonly<VotingPanelProps>) {
  const [pendingChoice, setPendingChoice] = useState<"for" | "against" | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The signer's own vote isn't in `proposal.votes` until a refresh comes
  // back, so the submitted panel shows the choice just made in the meantime
  // rather than waiting on a round trip to know what it should say.
  const [justVoted, setJustVoted] = useState<"for" | "against" | null>(null)

  const canCastVote = canSign && !hasSigned && proposal.status === "open"

  const handleConfirm = async () => {
    if (!pendingChoice || isSubmitting) return

    try {
      setIsSubmitting(true)
      await voteOnProposal(proposal.id, pendingChoice)
      toast.success("Vote recorded")
      setJustVoted(pendingChoice)
      setPendingChoice(null)
      onVoteSubmitted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit your vote")
    } finally {
      setIsSubmitting(false)
    }
  }

  const ownVote = proposal.votes.find((v) => v.voterAddress.toLowerCase() === voterAddress)
  const submittedChoice = justVoted ?? ownVote?.choice ?? null

  return (
    <>
      {hasSigned ? (
        <VoteSubmittedCard proposal={proposal} choice={submittedChoice} />
      ) : (
        <div className="self-stretch bg-white rounded-lg flex flex-col justify-start items-start gap-4 overflow-hidden">
          <div className="self-stretch flex flex-col justify-start items-center">
            <div className="self-stretch h-14 p-4 bg-neutral-50 rounded-tl-lg rounded-tr-lg flex flex-col justify-start items-start gap-2.5">
              <div className="self-stretch flex justify-between items-center">
                <div className="text-neutral-600 text-xl font-normal font-nohemi leading-6">
                  Cast Your Vote
                </div>
                <div className="flex items-center gap-1">
                  <QuorumIcon />
                  <span className="flex items-baseline gap-2">
                    <span className="text-gray-500 text-sm font-normal font-nohemi">Quorum :</span>
                    <span className="text-indigo-950 text-base font-bold font-bricolage">
                      {proposal.votesRequired}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="self-stretch px-4 flex flex-col justify-start items-start gap-3">
              <div className="self-stretch px-2 py-4 bg-white border-t border-b border-gray-200 flex items-center gap-2.5">
                <div className="flex-1 text-neutral-800 text-base font-medium">
                  {proposal.status !== "open"
                    ? "Signing has closed for this proposal."
                    : "Make your decision on this proposal. Once submitted, your vote cannot be changed."}
                </div>
              </div>

              <div className="self-stretch py-8 flex flex-col justify-start items-start gap-12 overflow-hidden">
                <div className="self-stretch px-6 flex flex-col justify-start items-start gap-2.5">
                  <div className="self-stretch flex flex-col justify-start items-start gap-6">
                    <div className="self-stretch flex flex-col sm:flex-row justify-start items-stretch sm:items-start gap-3">
                      <VoteButton
                        label="Vote For"
                        icon="/icons/vuesax/linear/like.svg"
                        disabled={!canCastVote}
                        onClick={() => setPendingChoice("for")}
                      />
                      <VoteButton
                        label="Vote Against"
                        icon="/icons/vuesax/linear/dislike.svg"
                        disabled={!canCastVote}
                        onClick={() => setPendingChoice("against")}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <VotingResultCard proposal={proposal} />

      {pendingChoice ? (
        <VoteConfirmModal
          choice={pendingChoice}
          isSubmitting={isSubmitting}
          onCancel={() => setPendingChoice(null)}
          onConfirm={handleConfirm}
        />
      ) : null}
    </>
  )
}

function VoteButton({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string
  icon: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 p-4 bg-neutral-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-zinc-200 flex justify-between items-center transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-neutral-50"
    >
      <span className="flex items-center gap-2">
        <Image src={icon} alt="" width={16} height={16} className="size-4" />
        <span className="text-zinc-800 text-base font-medium">{label}</span>
      </span>
    </button>
  )
}

function VoteSubmittedCard({
  proposal,
  choice,
}: {
  proposal: Proposal
  choice: "for" | "against" | null
}) {
  const isFor = choice !== "against"
  const toneClasses = isFor
    ? "outline-lime-500 text-lime-950"
    : "outline-red-400 text-red-600"

  return (
    <div className="self-stretch bg-white rounded-lg flex flex-col justify-start items-start gap-4 overflow-hidden">
      <div className="self-stretch flex flex-col justify-start items-center">
        <div className="self-stretch h-14 p-4 bg-neutral-50 rounded-tl-lg rounded-tr-lg flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch flex justify-between items-center">
            <div className="text-neutral-600 text-xl font-normal font-nohemi leading-6">
              Vote Submitted
            </div>
            <div className="flex items-center gap-1">
              <QuorumIcon />
              <span className="flex items-baseline gap-2">
                <span className="text-gray-500 text-sm font-normal font-nohemi">Quorum :</span>
                <span className="text-indigo-950 text-base font-bold font-bricolage">
                  {proposal.votesRequired}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="self-stretch px-4 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch px-2 py-4 bg-white border-t border-b border-gray-200 flex items-center gap-2.5">
            <div
              className={`flex-1 h-12 px-6 py-3 rounded-sm outline outline-1 flex justify-center items-center gap-2 ${toneClasses}`}
            >
              <Image
                src={isFor ? "/icons/vuesax/bold/like.svg" : "/icons/vuesax/bold/dislike.svg"}
                alt=""
                width={16}
                height={16}
                className="size-4"
              />
              <span className="text-base font-medium">{isFor ? "Voted For" : "Voted Against"}</span>
            </div>
          </div>

          <div className="self-stretch py-6 text-gray-600 text-xl font-normal">
            You have voted {isFor ? "for" : "against"} this proposal and your vote has been recorded
            successfully.
          </div>
        </div>
      </div>
    </div>
  )
}

function VotingResultCard({ proposal }: { proposal: Proposal }) {
  const cast = proposal.votesFor + proposal.votesAgainst
  const forShare = cast === 0 ? 0 : proposal.votesFor / cast
  const againstShare = cast === 0 ? 0 : proposal.votesAgainst / cast

  return (
    <div className="self-stretch bg-white rounded-lg flex flex-col justify-start items-start gap-4 overflow-hidden">
      <div className="self-stretch flex flex-col justify-start items-center">
        <div className="self-stretch h-14 p-4 bg-neutral-50 rounded-tl-lg rounded-tr-lg flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch flex justify-between items-center">
            <div className="text-neutral-600 text-xl font-normal font-nohemi leading-6">
              Voting Result
            </div>
          </div>
        </div>

        <div className="self-stretch px-4 flex flex-col justify-start items-start gap-3">
          <div className="self-stretch py-4 flex flex-col sm:flex-row justify-start items-center gap-4 overflow-hidden">
            <VoteDonut
              votesFor={proposal.votesFor}
              votesAgainst={proposal.votesAgainst}
              forShare={forShare}
              againstShare={againstShare}
            />

            <div className="flex-1 self-stretch px-2 py-4 flex flex-col justify-start items-start gap-2.5">
              <div className="self-stretch p-1 bg-neutral-50 rounded-lg flex flex-col justify-start items-start">
                <div className="self-stretch px-2.5 py-2 bg-white rounded-sm flex justify-start items-center gap-2.5 overflow-hidden">
                  <span className="text-zinc-600 text-xs font-semibold font-bricolage">
                    Voting Result
                  </span>
                </div>
                <div className="self-stretch flex flex-col justify-start items-start">
                  <ResultRow dotClassName="bg-red-600" label="Against" value={proposal.votesAgainst} />
                  <ResultRow dotClassName="bg-lime-500" label="For" value={proposal.votesFor} />
                  <div className="self-stretch px-1 py-2 flex justify-between items-center overflow-hidden">
                    <span className="flex items-center gap-1">
                      <QuorumIcon />
                      <span className="flex items-center gap-1">
                        <span className="text-neutral-600 text-base font-medium">Quorum</span>
                        <InfoIcon />
                      </span>
                    </span>
                    <span className="text-zinc-600 text-base font-extrabold font-bricolage">
                      {proposal.votesRequired}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  dotClassName,
  label,
  value,
}: {
  dotClassName: string
  label: string
  value: number
}) {
  return (
    <div className="self-stretch px-1 py-2 border-b-[0.30px] border-zinc-200 flex justify-between items-center overflow-hidden">
      <span className="flex items-center gap-1">
        <span className={`size-2 rounded-full ${dotClassName}`} />
        <span className="text-zinc-600 text-sm font-semibold">{label}</span>
      </span>
      <span className="text-zinc-600 text-base font-extrabold font-bricolage">{value}</span>
    </div>
  )
}

/** Two arcs sharing one ring, each sized to its share of the votes cast. */
function VoteDonut({
  votesFor,
  votesAgainst,
  forShare,
  againstShare,
}: {
  votesFor: number
  votesAgainst: number
  forShare: number
  againstShare: number
}) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const forLength = circumference * forShare
  const againstLength = circumference * againstShare
  const cast = votesFor + votesAgainst

  return (
    <div className="relative size-44 shrink-0">
      <svg className="size-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#EEF0FC" strokeWidth="10" />
        {cast > 0 ? (
          <>
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#84CC16"
              strokeWidth="10"
              strokeDasharray={`${forLength} ${circumference}`}
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#DC2626"
              strokeWidth="10"
              strokeDasharray={`${againstLength} ${circumference}`}
              strokeDashoffset={-forLength}
              strokeLinecap="round"
            />
          </>
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="text-2xl font-bold font-bricolage text-indigo-950">{cast}</span>
        <span className="text-[10px] text-gray-500">vote{cast === 1 ? "" : "s"} cast</span>
      </div>

      {votesFor > 0 ? (
        <Badge
          className="absolute left-2 bottom-6"
          tone="lime"
          label="Votes For"
          percent={Math.round(forShare * 100)}
        />
      ) : null}
      {votesAgainst > 0 ? (
        <Badge
          className="absolute right-0 top-8"
          tone="rose"
          label="Votes Against"
          percent={Math.round(againstShare * 100)}
        />
      ) : null}
    </div>
  )
}

function Badge({
  className,
  tone,
  label,
  percent,
}: {
  className: string
  tone: "lime" | "rose"
  label: string
  percent: number
}) {
  const toneClasses =
    tone === "lime"
      ? "bg-green-50 outline-lime-500 text-lime-950"
      : "bg-rose-50 outline-red-600 text-red-950"
  const pillClasses = tone === "lime" ? "bg-lime-950 outline-lime-500" : "bg-red-950 outline-red-600"

  return (
    <div
      className={`${className} px-1.5 py-0.5 rounded-xl outline outline-1 outline-offset-[-1px] ${toneClasses} flex items-center gap-1.5`}
    >
      <span className="text-[9px] font-normal font-bricolage whitespace-nowrap">{label}</span>
      <span
        className={`size-4 rounded-full outline outline-1 outline-offset-[-1px] flex items-center justify-center ${pillClasses}`}
      >
        <span className="text-[7px] font-bold text-white">{percent}%</span>
      </span>
    </div>
  )
}

function QuorumIcon() {
  return <Image src="/icons/vuesax/bold/verify.svg" alt="" width={16} height={16} className="size-4" />
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-3">
      <circle cx="6" cy="6" r="5" stroke="#737373" strokeWidth="0.75" />
      <path d="M6 5.5v3M6 4v.01" stroke="#737373" strokeWidth="0.75" strokeLinecap="round" />
    </svg>
  )
}

