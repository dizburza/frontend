"use client"

import Image from "next/image"
import type { Proposal } from "@/lib/api/proposals"
import type { Organization } from "@/lib/api/organization"

interface VotingLogProps {
  proposal: Proposal
  organization: Organization | null
}

const formatMoment = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

/**
 * One row per signer, voted or not, so a proposal still waiting on quorum
 * shows who it is waiting on rather than only who has already answered.
 */
export function VotingLog({ proposal, organization }: Readonly<VotingLogProps>) {
  const employeeByAddress = new Map(
    (organization?.employees ?? []).map((e) => [e.walletAddress.toLowerCase(), e])
  )
  const signerByAddress = new Map(
    (organization?.signers ?? []).map((s) => [s.address.toLowerCase(), s])
  )
  const voteByAddress = new Map(
    proposal.votes.map((v) => [v.voterAddress.toLowerCase(), v])
  )

  const rows = (organization?.signers ?? []).map((signer) => {
    const key = signer.address.toLowerCase()
    const employee = employeeByAddress.get(key)
    const vote = voteByAddress.get(key)

    return {
      address: signer.address,
      name: employee?.fullName || signer.name,
      handle: employee?.username || null,
      role: employee ? null : signer.role,
      avatar: employee?.avatar || null,
      vote,
    }
  })

  // A voter who has since left the signer roster still shows in the log,
  // since the vote they cast is part of the record even if their standing
  // changed afterwards.
  for (const vote of proposal.votes) {
    const key = vote.voterAddress.toLowerCase()
    if (!signerByAddress.has(key)) {
      const employee = employeeByAddress.get(key)
      rows.push({
        address: vote.voterAddress,
        name: employee?.fullName || vote.voterName,
        handle: employee?.username || null,
        role: null,
        avatar: employee?.avatar || null,
        vote,
      })
    }
  }

  return (
    <div className="self-stretch bg-white rounded-lg flex flex-col justify-start items-start gap-4 overflow-hidden">
      <div className="self-stretch flex flex-col justify-start items-center">
        <div className="self-stretch h-14 p-4 bg-neutral-50 rounded-tl-lg rounded-tr-lg flex flex-col justify-start items-start gap-2.5">
          <div className="self-stretch flex justify-between items-center">
            <div className="text-neutral-600 text-xl font-normal font-nohemi leading-6">
              Voting Log
            </div>
          </div>
        </div>

        <div className="self-stretch min-h-0 flex flex-col justify-start items-start gap-3">
          {rows.length === 0 ? (
            <p className="w-full py-8 text-center text-sm text-gray-500">No signers yet.</p>
          ) : (
            <div className="self-stretch overflow-x-auto">
              <table className="w-full min-w-[520px] table-fixed text-left">
                <colgroup>
                  <col className="w-10" />
                  <col className="w-[42%]" />
                  <col className="w-[29%]" />
                  <col className="w-[29%]" />
                </colgroup>
                <thead>
                  <tr className="h-14 bg-neutral-100 border-t border-b border-gray-100">
                    <th className="p-2 text-gray-800 text-sm font-semibold">#</th>
                    <th className="p-2 text-left text-neutral-600 text-xs font-normal tracking-wide">
                      SIGNERS
                    </th>
                    <th className="p-2 text-center text-neutral-600 text-xs font-normal tracking-wide">
                      DECISION
                    </th>
                    <th className="p-2 text-center text-neutral-600 text-xs font-normal tracking-wide">
                      TIMESTAMP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.address} className="border-b border-gray-100">
                      <td className="p-2 text-center text-gray-500 text-sm font-semibold">
                        {index + 1}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <div className="relative size-8 shrink-0 overflow-hidden rounded-sm border-[0.82px] border-gray-200 bg-indigo-50">
                            {row.avatar ? (
                              <Image src={row.avatar} alt="" fill className="object-cover" />
                            ) : null}
                          </div>
                          <div className="flex min-w-0 flex-col items-start gap-1">
                            <span className="truncate text-indigo-900 text-sm font-medium">
                              {row.name}
                            </span>
                            <span className="truncate text-neutral-500 text-xs font-normal">
                              {row.handle ? `@${row.handle}` : row.address.slice(0, 8)}
                              {row.role ? ` - ${row.role}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-center text-neutral-500 text-xs font-semibold leading-4">
                        {row.vote
                          ? row.vote.choice === "for"
                            ? "Voted For"
                            : "Voted Against"
                          : "Awaiting Vote"}
                      </td>
                      <td className="p-2 text-center text-neutral-800 text-xs font-semibold leading-4">
                        {row.vote ? formatMoment(row.vote.createdAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
