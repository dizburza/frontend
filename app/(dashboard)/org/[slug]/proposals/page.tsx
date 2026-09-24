"use client"

import { useState } from "react"
import Link from "next/link"
import { ProposalTable } from "@/components/proposals/proposal-table"
import { CreateProposalModal } from "@/components/proposals/create-proposal-modal"
import { useOrganizationBySlug } from "@/lib/api/organization"
import { useOrganizationProposals } from "@/lib/api/proposals"
import useOrgSlug from "@/hooks/useOrgSlug"

export default function ProposalsPage() {
  const orgSlug = useOrgSlug()
  const base = orgSlug ? `/org/${orgSlug}` : "/"
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const {
    data: proposalData,
    loading,
    error,
    refresh,
  } = useOrganizationProposals(organization?.id ?? null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState("")

  const allProposals = proposalData?.proposals ?? []
  const stats = proposalData?.stats

  const query = search.trim().toLowerCase()
  const proposals = query
    ? allProposals.filter((p) => p.title.toLowerCase().includes(query))
    : allProposals

  return (
    <div className="w-full flex flex-col justify-start items-end gap-6 px-1 lg:px-10">
      <div className="self-stretch flex flex-col justify-start items-start">
        <div className="py-2 flex flex-col justify-start items-start gap-2.5">
          <div className="flex justify-start items-center">
            <Link href={base} className="px-1 flex justify-center items-center gap-2.5">
              <span className="text-gray-400 text-xs font-normal hover:underline">Dashboard</span>
            </Link>
            <BreadcrumbChevron />
            <div className="px-1 flex justify-center items-center gap-2.5">
              <span className="text-gray-400 text-xs font-normal">Proposals</span>
            </div>
          </div>
        </div>

        <div className="self-stretch flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-gray-600 text-3xl lg:text-4xl font-normal font-nohemi">Proposals</div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 rounded-sm shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)] outline outline-2 outline-indigo-400 flex justify-start items-center gap-2 overflow-hidden transition-[filter] hover:brightness-[1.04]"
          >
            <PlusIcon />
            <span className="text-white text-base font-medium">Create Proposal</span>
          </button>
        </div>
      </div>

      <div className="self-stretch h-[835px] bg-white rounded-lg flex flex-col justify-start items-start gap-4 overflow-hidden">
        <div className="self-stretch flex-1 min-h-0 flex flex-col justify-start items-center">
          <div className="self-stretch h-14 shrink-0 p-4 bg-neutral-50 rounded-tl-lg rounded-tr-lg flex flex-col justify-start items-start gap-2.5 overflow-x-auto">
            <div className="flex justify-start items-center">
              <Stat label="Total Proposals Created" value={stats?.total ?? 0} icon={<DocumentIcon />} />
              <Stat label="Approved Proposals" value={stats?.passed ?? 0} icon={<ApprovedIcon />} />
              <Stat label="Rejected Proposals" value={stats?.rejected ?? 0} icon={<RejectedIcon />} last />
            </div>
          </div>

          <div className="self-stretch flex-1 min-h-0 px-4 flex flex-col justify-start items-start gap-3">
            <div className="self-stretch shrink-0 py-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="w-full sm:w-96 h-9 px-2 bg-slate-50 rounded-lg outline outline-[0.30px] outline-offset-[-0.30px] outline-indigo-200 flex justify-start items-center gap-2">
                <SearchIcon />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for proposals"
                  className="flex-1 bg-transparent text-gray-500 text-xs font-normal outline-none placeholder:text-gray-500"
                />
              </div>

              <div className="flex justify-start items-center gap-6">
                <div className="p-2 bg-slate-50 rounded-lg flex justify-start items-center gap-4">
                  <div className="flex justify-start items-center gap-1">
                    <FilterIcon />
                    <span className="text-gray-600 text-sm font-normal">Filters :</span>
                  </div>
                  <div className="flex justify-start items-center gap-1">
                    <span className="text-zinc-800 text-sm font-medium">Recent Transaction</span>
                    <CaretDownIcon />
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg flex justify-start items-center gap-4">
                  <div className="flex justify-start items-center gap-1">
                    <SortIcon />
                    <span className="text-gray-600 text-base font-normal">Sort :</span>
                  </div>
                  <div className="flex justify-start items-center gap-1">
                    <span className="text-zinc-800 text-sm font-medium">Date</span>
                    <CaretDownIcon />
                  </div>
                </div>
              </div>
            </div>

            {error ? (
              <p className="w-full py-8 text-center text-sm text-red-600">{error}</p>
            ) : (
              <div className="self-stretch flex-1 min-h-0 overflow-auto pb-4">
                <ProposalTable
                  proposals={proposals}
                  loading={loading && allProposals.length === 0}
                  emptyLabel={query ? "No proposals match your search." : "No proposals yet."}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <CreateProposalModal
          organizationId={organization?.id}
          onClose={() => setShowCreateModal(false)}
          onProposalCreated={refresh}
        />
      ) : null}
    </div>
  )
}

function Stat({
  label,
  value,
  icon,
  last = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`pl-2 pr-6 ${last ? "border-r" : "border-r border-gray-300"} flex flex-col justify-start items-start gap-2.5 overflow-hidden`}
    >
      <div className="flex justify-start items-start gap-2">
        <div className="size-6 shrink-0 bg-white outline outline-[0.75px] outline-offset-[-0.75px] outline-indigo-50 flex items-center justify-center overflow-hidden">
          {icon}
        </div>
        <div className="flex justify-start items-center gap-1 whitespace-nowrap">
          <span className="text-gray-500 text-[10px] font-normal font-nohemi">{label} :</span>
          <span className="text-indigo-950 text-xl font-bold font-bricolage">{value}</span>
        </div>
      </div>
    </div>
  )
}

function BreadcrumbChevron() {
  return (
    <svg viewBox="0 0 8 8" fill="none" aria-hidden className="size-2">
      <path
        d="M2.97 1.36 5.34 4 2.97 6.64"
        stroke="#6B7280"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path d="M4 8h8M8 4v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5 shrink-0">
      <circle cx="6.42" cy="6.42" r="5.25" stroke="#9CA3AF" strokeLinecap="round" />
      <path d="M11.67 11.67 12.83 12.83" stroke="#9CA3AF" strokeLinecap="round" />
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5">
      <path
        d="M1.75 4.08h10.5M3.5 7h7M5.83 9.92h2.34"
        stroke="#9CA3AF"
        strokeWidth="1.31"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5">
      <path d="M1.17 3.79h2.62M6.42 3.79h6.41" stroke="#9CA3AF" strokeWidth="1.31" strokeLinecap="round" />
      <circle cx="5.25" cy="3.79" r="1.46" stroke="#9CA3AF" strokeWidth="1.31" />
      <path d="M1.17 10.21h6.41M10.5 10.21h2.33" stroke="#9CA3AF" strokeWidth="1.31" strokeLinecap="round" />
      <circle cx="8.75" cy="10.21" r="1.46" stroke="#9CA3AF" strokeWidth="1.31" />
    </svg>
  )
}

function CaretDownIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-3">
      <path d="m2.04 4.47 3.96 3.06 3.96-3.06" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5">
      <path
        d="M12.25 5.83v4.09c0 2.04-1.17 2.92-2.92 2.92H4.67c-1.75 0-2.92-.88-2.92-2.92V4.08c0-2.04 1.17-2.91 2.92-2.91h4.08"
        stroke="#6B7280"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.25 5.83H10.5c-1.17 0-1.75-.58-1.75-1.75V1.17" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.67 7.58h1.16M4.67 9.92h2.33" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ApprovedIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5">
      <path
        d="M9.33 1.17H4.67c-2.04 0-2.92.88-2.92 2.91v6.42c0 2.04.88 2.92 2.92 2.92h4.66c2.04 0 2.92-.88 2.92-2.92V4.08c0-2.03-.88-2.91-2.92-2.91Z"
        stroke="#6B7280"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m4.38 7.58 1.3 1.3 2.62-2.6" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RejectedIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden className="size-3.5">
      <path
        d="M9.33 1.17H4.67c-2.04 0-2.92.88-2.92 2.91v6.42c0 2.04.88 2.92 2.92 2.92h4.66c2.04 0 2.92-.88 2.92-2.92V4.08c0-2.03-.88-2.91-2.92-2.91Z"
        stroke="#6B7280"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m5.54 8.46 2.92-2.92M8.46 8.46 5.54 5.54" stroke="#6B7280" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
