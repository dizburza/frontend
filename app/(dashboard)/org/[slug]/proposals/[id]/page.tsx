"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useActiveAccount } from "thirdweb/react"
import { VotingPanel } from "@/components/proposals/voting-panel"
import { VotingLog } from "@/components/proposals/voting-log"
import { useProposal } from "@/lib/api/proposals"
import { useOrganizationBySlug } from "@/lib/api/organization"
import { statusLabel } from "@/lib/proposal-format"
import useOrgSlug from "@/hooks/useOrgSlug"

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

const shortAddress = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`

/** Same treatment as the list's status pill, reused here beside the title. */
const statusPillClasses: Record<string, string> = {
  open: "bg-white text-yellow-600 outline-orange-400",
  passed: "bg-green-50 text-lime-900 outline-lime-500",
  rejected: "bg-red-50 text-red-600 outline-red-400",
  expired: "bg-gray-100 text-gray-600 outline-gray-300",
  cancelled: "bg-gray-100 text-gray-600 outline-gray-300",
}

export default function ProposalDetailsPage() {
  const params = useParams()
  const proposalId = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  const orgSlug = useOrgSlug()
  const base = orgSlug ? `/org/${orgSlug}` : "/"
  const account = useActiveAccount()
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const { data: proposal, loading, error, refresh } = useProposal(proposalId ?? null)

  const wallet = account?.address?.toLowerCase() ?? ""

  // Signing is a governance action, so only an active signer of this
  // organization may do it. The server enforces this too; this only keeps the
  // buttons honest.
  const isSigner = Boolean(
    wallet &&
      organization?.signers?.some((s) => s.isActive && s.address.toLowerCase() === wallet)
  )
  const hasSigned = Boolean(
    proposal?.votes.some((v) => v.voterAddress.toLowerCase() === wallet)
  )

  // Signers are named directly; an employee's own membership row is the
  // fallback, since a creator need not be an employee to have raised this.
  const creatorName = (() => {
    if (!proposal) return ""
    const key = proposal.createdByAddress.toLowerCase()
    const signer = organization?.signers?.find((s) => s.address.toLowerCase() === key)
    if (signer) return signer.name
    const employee = organization?.employees?.find((e) => e.walletAddress?.toLowerCase() === key)
    return employee?.fullName || shortAddress(proposal.createdByAddress)
  })()

  if (loading && !proposal) {
    return <div className="px-1 py-8 text-sm text-gray-500 lg:px-10">Loading proposal…</div>
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col gap-4 px-1 py-8 lg:px-10">
        <p className="text-sm text-gray-500">{error ?? "Proposal not found"}</p>
        <button
          type="button"
          onClick={refresh}
          className="w-fit rounded-sm border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-1 lg:px-10">
      <div className="flex flex-col">
        <div className="flex items-center py-2 text-xs text-gray-400">
          <Link href={base} className="px-1 hover:underline">
            Dashboard
          </Link>
          <BreadcrumbChevron />
          <Link href={`${base}/proposals`} className="px-1 hover:underline">
            Proposals
          </Link>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <h1 className="font-nohemi text-3xl font-normal text-gray-600 lg:text-4xl">Proposals</h1>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 xl:flex-row">
        <div className="w-full min-w-0 rounded-lg bg-white xl:flex-[3]">
          <div className="flex h-14 items-center justify-between rounded-t-lg bg-neutral-50 p-4">
            <span className="font-nohemi text-xl font-normal leading-6 text-neutral-600">
              Proposal Overview
            </span>
            <span
              className={`flex w-24 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-3xl px-3 py-1.5 text-sm font-medium outline outline-[0.5px] -outline-offset-[0.5px] ${statusPillClasses[proposal.status]}`}
            >
              {statusLabel[proposal.status]}
            </span>
          </div>

          <div className="flex flex-col gap-3 px-4">
            <div className="flex flex-col gap-1 border-t border-b border-gray-200 px-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Fact label="Created by:" value={creatorName} />
              <Fact label="Created on:" value={formatDate(proposal.createdAt)} />
              <Fact
                label="Amount Requested:"
                value={
                  proposal.amountFormatted
                    ? `${proposal.currency ?? ""}${Number(proposal.amountFormatted).toLocaleString()}`
                    : "None"
                }
              />
            </div>

            <div className="flex flex-col gap-12 overflow-hidden py-10">
              <div className="flex flex-col gap-4">
                <div className="text-base font-medium text-neutral-500">Title</div>
                <div className="font-nohemi text-2xl font-semibold leading-[1.2] text-neutral-600 sm:text-4xl sm:leading-[48px]">
                  {proposal.title}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="text-base font-medium text-neutral-500">Description</div>
                <div className="whitespace-pre-line text-lg font-medium leading-8 text-neutral-800 sm:text-xl">
                  {proposal.description || "No description was given."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 xl:flex-[2]">
          <VotingPanel
            proposal={proposal}
            canSign={isSigner}
            hasSigned={hasSigned}
            voterAddress={wallet}
            onVoteSubmitted={refresh}
          />
          <VotingLog proposal={proposal} organization={organization} />
        </div>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-1 text-sm leading-4">
      <span className="font-normal text-neutral-500">{label}</span>
      <span className="font-semibold text-neutral-800">{value}</span>
    </span>
  )
}

function BreadcrumbChevron() {
  return (
    <svg viewBox="0 0 8 8" fill="none" aria-hidden className="size-2">
      <path d="M2.97 1.36 5.34 4 2.97 6.64" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
