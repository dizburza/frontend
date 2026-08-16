"use client"

import Link from "next/link"
import useOrgSlug from "@/hooks/useOrgSlug"
import type { Proposal } from "@/lib/api/proposals"
import { statusClasses, statusLabel, timeLeftLabel } from "@/lib/proposal-format"

interface ProposalTableProps {
  proposals: Proposal[]
  startIndex?: number
}

const shortAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address

export function ProposalTable({ proposals, startIndex = 0 }: Readonly<ProposalTableProps>) {
  const orgSlug = useOrgSlug()
  const proposalBase = orgSlug ? `/org/${orgSlug}/proposals` : "/org"

  if (proposals.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">No proposals yet.</p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">PROPOSAL</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">INITIATED BY</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">TIME LEFT</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">STATUS</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">SIGNATURES</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">VOTES FOR</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">VOTES AGAINST</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal, index) => (
            <tr key={proposal.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">{startIndex + index + 1}</td>
              <td className="py-4 px-4">
                <Link
                  href={`${proposalBase}/${proposal.id}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {proposal.title}
                </Link>
              </td>
              <td className="py-4 px-4">{shortAddress(proposal.createdByAddress)}</td>
              <td className="py-4 px-4">
                {timeLeftLabel(proposal.closesAt, proposal.status)}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${statusClasses[proposal.status]}`}
                >
                  {statusLabel[proposal.status]}
                </span>
              </td>
              <td className="py-4 px-4">
                {proposal.votesFor + proposal.votesAgainst} of {proposal.votesRequired}
              </td>
              <td className="py-4 px-4 text-center">{proposal.votesFor}</td>
              <td className="py-4 px-4 text-center">{proposal.votesAgainst}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
