"use client";

import Link from "next/link";
import type { Proposal } from "@/lib/api/proposals";
import { statusClasses, statusLabel, timeLeftLabel } from "@/lib/proposal-format";
import { SectionCard } from "@/components/dashboard/section-card";

type ProposalHistoryProps = {
  proposals: Proposal[];
  viewAllHref: string;
};

export function ProposalHistory({ proposals, viewAllHref }: ProposalHistoryProps) {
  return (
    <SectionCard title="Proposal History" viewAllHref={viewAllHref} className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-left">
          <thead>
            <tr className="border-y border-gray-100 bg-neutral-100">
              <th className="w-8 px-1.5 py-2 text-sm font-semibold text-gray-800">#</th>
              <th className="px-1.5 py-2 text-xs font-normal tracking-wide text-neutral-600">
                PROPOSAL
              </th>
              <th className="px-1.5 py-2 text-xs font-normal tracking-wide text-neutral-600">
                TIME LEFT
              </th>
              <th className="px-1.5 py-2 text-center text-xs font-normal tracking-wide text-neutral-600">
                STATUS
              </th>
              <th
                className="px-1.5 py-2 text-xs font-normal tracking-wide text-neutral-600"
                colSpan={2}
              >
                <span className="block text-center">VOTES</span>
                <span className="mt-1 flex items-center justify-between text-[8px] font-medium">
                  <span>FOR</span>
                  <span>AGAINST</span>
                </span>
              </th>
              <th className="px-1.5 py-2 text-center text-xs font-normal tracking-wide text-neutral-600">
                SIGNATURES
              </th>
            </tr>
          </thead>
          <tbody>
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
                  No proposals raised yet.
                </td>
              </tr>
            ) : (
              proposals.map((proposal, index) => (
                <tr key={proposal.id} className="border-b border-gray-100 transition-colors hover:bg-surface-canvas">
                  <td className="px-1.5 py-3 text-center text-sm font-semibold text-gray-500">
                    {index + 1}
                  </td>
                  <td className="max-w-[140px] px-1.5 py-3">
                    <Link
                      href={`${viewAllHref}/${proposal.id}`}
                      title={proposal.title}
                      className="block truncate text-xs font-semibold leading-4 text-indigo-800 hover:underline"
                    >
                      {proposal.title}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-3 text-xs font-semibold leading-4 text-neutral-800">
                    {timeLeftLabel(proposal.closesAt, proposal.status)}
                  </td>
                  <td className="px-1.5 py-3 text-center">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1.5 text-[11px] font-medium leading-3 ${statusClasses[proposal.status]}`}
                    >
                      {statusLabel[proposal.status]}
                    </span>
                  </td>
                  <td className="px-1.5 py-3 text-center text-xs font-medium text-neutral-600">
                    {proposal.votesFor}
                  </td>
                  <td className="px-1.5 py-3 text-center text-xs font-medium text-neutral-600">
                    {proposal.votesAgainst}
                  </td>
                  <td className="px-1.5 py-3 text-center text-xs font-semibold leading-4 text-neutral-800">
                    {proposal.votesFor + proposal.votesAgainst}/{proposal.votesRequired}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
