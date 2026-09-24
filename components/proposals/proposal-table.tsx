"use client"

import Link from "next/link"
import useOrgSlug from "@/hooks/useOrgSlug"
import type { Proposal, ProposalStatus } from "@/lib/api/proposals"
import { statusLabel, timeLeftLabel } from "@/lib/proposal-format"

interface ProposalTableProps {
  proposals: Proposal[]
  loading?: boolean
  emptyLabel?: string
}

const shortAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address

/** Open is an outline pill; everything settled is filled. */
const statusPill: Record<ProposalStatus, string> = {
  open: "bg-white text-yellow-600 outline-orange-400",
  passed: "bg-green-50 text-lime-900 outline-lime-500",
  rejected: "bg-red-50 text-red-600 outline-red-400",
  expired: "bg-gray-100 text-gray-600 outline-gray-300",
  cancelled: "bg-gray-100 text-gray-600 outline-gray-300",
}

export function ProposalTable({
  proposals,
  loading = false,
  emptyLabel = "No proposals yet.",
}: Readonly<ProposalTableProps>) {
  const orgSlug = useOrgSlug()
  const proposalBase = orgSlug ? `/org/${orgSlug}/proposals` : "/org"
  const isEmpty = !loading && proposals.length === 0

  return (
    <table className="w-full min-w-[720px] table-fixed text-left">
      {/* Percentage widths so the table fills whatever viewport it loads on,
          rather than the design's absolute pixel layout. Only the # column is
          a fixed width; the rest share the remaining space proportionally. */}
      <colgroup>
        <col className="w-10" />
        <col className="w-[26%]" />
        <col className="w-[15%]" />
        <col className="w-[15%]" />
        <col className="w-[13%]" />
        <col className="w-[13%]" />
        <col className="w-[18%]" />
      </colgroup>
      <thead className="sticky top-0 z-10">
        <tr className="h-14 bg-zinc-200 border-t border-b border-gray-100">
          <th className="w-10 p-2 text-zinc-800 text-sm font-semibold">#</th>
          <Th>PROPOSAL</Th>
          <Th>INITIATED BY</Th>
          <Th>TIME LEFT</Th>
          <Th>SIGNATURE</Th>
          <Th>STATUS</Th>
          <th className="px-2 py-1.5">
            <div className="flex flex-col justify-start items-center gap-1">
              <span className="text-zinc-800 text-sm font-normal tracking-wide">VOTES</span>
              <div className="flex justify-start items-start">
                <span className="w-1/2 px-2 border-r-[0.30px] border-gray-500 text-center text-gray-600 text-[10px] font-medium">
                  FOR
                </span>
                <span className="w-1/2 px-2 text-center text-gray-600 text-[10px] font-medium tracking-tight">
                  AGAINST
                </span>
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {loading ? (
          <tr>
            <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
              Loading proposals…
            </td>
          </tr>
        ) : isEmpty ? (
          <tr>
            <td colSpan={7} className="py-8 text-center text-sm text-gray-500">
              {emptyLabel}
            </td>
          </tr>
        ) : (
          proposals.map((proposal, index) => (
          <tr
            key={proposal.id}
            className={`h-20 border-b ${
              index === 0 ? "bg-slate-50 border-indigo-50" : "border-gray-100"
            } hover:bg-surface-canvas`}
          >
            <td className="p-2 text-center text-gray-500 text-sm font-semibold">{index + 1}</td>
            <td className="p-2 text-center">
              <Link
                href={`${proposalBase}/${proposal.id}`}
                className="text-indigo-800 text-base font-medium font-nohemi hover:underline"
              >
                {proposal.title}
              </Link>
            </td>
            <td className="p-2 text-center text-neutral-500 text-base font-semibold leading-5">
              {shortAddress(proposal.createdByAddress)}
            </td>
            <td className="p-2 text-center text-neutral-800 text-base font-semibold leading-5">
              {timeLeftLabel(proposal.closesAt, proposal.status)}
            </td>
            <td className="p-2 text-center text-neutral-800 text-base font-semibold leading-5">
              {proposal.votesFor + proposal.votesAgainst}
            </td>
            <td className="p-2">
              <div className="flex justify-center">
                <span
                  className={`w-24 px-3 py-1.5 rounded-3xl outline outline-[0.50px] outline-offset-[-0.50px] flex justify-center items-center gap-1 overflow-hidden text-sm font-medium whitespace-nowrap ${statusPill[proposal.status]}`}
                >
                  {statusLabel[proposal.status]}
                </span>
              </div>
            </td>
            <td className="p-2">
              <div className="flex justify-center items-start">
                <span className="w-1/2 px-2 border-r-[0.30px] border-gray-500 text-center text-gray-600 text-base font-medium font-nohemi">
                  {proposal.votesFor}
                </span>
                <span className="w-1/2 px-2 text-center text-gray-600 text-base font-medium font-nohemi">
                  {proposal.votesAgainst}
                </span>
              </div>
            </td>
          </tr>
          ))
        )}
      </tbody>
    </table>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-2 text-center text-zinc-800 text-sm font-normal tracking-wide">{children}</th>
  )
}
