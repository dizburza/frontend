"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useActiveAccount } from "thirdweb/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SignaturesComponent } from "@/components/proposals/signatures-component"
import { StatusTimeline } from "@/components/proposals/status-timeline"
import { SignProposalModal } from "@/components/proposals/sign-proposal-modal"
import { CreateProposalModal } from "@/components/proposals/create-proposal-modal"
import { cancelProposal, useProposal } from "@/lib/api/proposals"
import { useOrganizationBySlug } from "@/lib/api/organization"
import { statusClasses, statusLabel } from "@/lib/proposal-format"
import useOrgSlug from "@/hooks/useOrgSlug"
import { toast } from "sonner"

const shortAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address

const formatMoment = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

export default function ProposalDetailsPage() {
  const params = useParams()
  const proposalId = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  const orgSlug = useOrgSlug()
  const account = useActiveAccount()
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const { data: proposal, loading, error, refresh } = useProposal(proposalId ?? null)

  const [showSignModal, setShowSignModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const wallet = account?.address?.toLowerCase() ?? ""

  // Signing is a governance action, so only an active signer of this
  // organization may do it. The server enforces this too; this only keeps the
  // button honest.
  const isSigner = Boolean(
    wallet &&
      organization?.signers?.some((s) => s.isActive && s.address.toLowerCase() === wallet)
  )
  const hasSigned = Boolean(
    proposal?.votes.some((v) => v.voterAddress.toLowerCase() === wallet)
  )
  const isCreator = Boolean(proposal && proposal.createdByAddress.toLowerCase() === wallet)

  const handleCancel = async () => {
    if (!proposal || isCancelling) return

    try {
      setIsCancelling(true)
      await cancelProposal(proposal.id)
      toast.success("Proposal withdrawn")
      refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not withdraw the proposal")
    } finally {
      setIsCancelling(false)
    }
  }

  if (loading && !proposal) {
    return <div className="p-8 text-gray-500">Loading proposal...</div>
  }

  if (error || !proposal) {
    return (
      <div className="p-8">
        <p className="text-gray-500 mb-4">{error ?? "Proposal not found"}</p>
        <Button variant="outline" onClick={refresh}>
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">Dashboard › Proposals › Proposal Details</p>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded text-xs font-medium ${statusClasses[proposal.status]}`}
            >
              {statusLabel[proposal.status]}
            </span>
            <h1 className="text-3xl font-bold">{proposal.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isCreator && proposal.status === "open" && (
            <Button variant="outline" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? "Withdrawing..." : "Withdraw"}
            </Button>
          )}
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            + Create a Proposal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Raised by:</p>
          <p className="font-medium">{shortAddress(proposal.createdByAddress)}</p>
        </div>
        <div>
          <p className="text-gray-600">Raised on:</p>
          <p className="font-medium">{new Date(proposal.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-gray-600">Amount requested:</p>
          <p className="font-medium">
            {proposal.amountFormatted
              ? `${proposal.currency ?? ""} ${Number(proposal.amountFormatted).toLocaleString()}`.trim()
              : "None"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-8">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            {proposal.description ? (
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {proposal.description}
              </p>
            ) : (
              <p className="text-gray-500">No description was given.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Voting log</h2>
              <span className="text-sm text-gray-500">
                {proposal.votes.length} of {proposal.signerCountAtCreation} signers
              </span>
            </div>

            {proposal.votes.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No signatures yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">SIGNER</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">DECISION</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.votes.map((vote, index) => (
                      <tr
                        key={vote.voterAddress}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">{index + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {vote.voterName.slice(0, 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{vote.voterName}</p>
                              <p className="text-xs text-gray-500">
                                {shortAddress(vote.voterAddress)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={
                              vote.choice === "for"
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            {vote.choice === "for" ? "For" : "Against"}
                          </span>
                        </td>
                        <td className="py-4 px-4">{formatMoment(vote.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {proposal.pendingSigners && proposal.pendingSigners.length > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                Awaiting: {proposal.pendingSigners.map((s) => s.name).join(", ")}
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SignaturesComponent
            proposal={proposal}
            canSign={isSigner}
            hasSigned={hasSigned}
            onSignClick={() => setShowSignModal(true)}
          />
          <StatusTimeline proposal={proposal} />
        </div>
      </div>

      {showSignModal && (
        <SignProposalModal
          proposalId={proposal.id}
          onClose={() => setShowSignModal(false)}
          onVoteSubmitted={refresh}
        />
      )}

      {showCreateModal && (
        <CreateProposalModal
          organizationId={organization?.id}
          onClose={() => setShowCreateModal(false)}
          onProposalCreated={refresh}
        />
      )}
    </div>
  )
}
