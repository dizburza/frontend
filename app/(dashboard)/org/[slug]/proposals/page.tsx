"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { ProposalStatCard } from "@/components/proposals/proposal-stat-card"
import { ProposalTable } from "@/components/proposals/proposal-table"
import { CreateProposalModal } from "@/components/proposals/create-proposal-modal"
import { getSessionProposals } from "@/lib/localStorage"
import type { Proposal } from "@/lib/types/payloads"

export default function ProposalsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>(getSessionProposals())
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const getPageItems = (currentPage: number, total: number) => {
    const safeTotalPages = Math.max(1, total)
    const safeCurrent = Math.min(Math.max(1, currentPage), safeTotalPages)
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1)
    }

    const items: Array<number | "..."> = [1]
    const start = Math.max(2, safeCurrent - 1)
    const end = Math.min(safeTotalPages - 1, safeCurrent + 1)

    if (start > 2) items.push("...")
    for (let p = start; p <= end; p++) items.push(p)
    if (end < safeTotalPages - 1) items.push("...")
    items.push(safeTotalPages)

    return items
  }
  
  // Refresh proposals when a new one is created
  const handleProposalCreated = () => {
    setProposals(getSessionProposals())
  }

  useEffect(() => {
    setPage(1)
  }, [limit, proposals.length])

  const totalPages = Math.max(1, Math.ceil(proposals.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * limit
  const paginatedProposals = proposals.slice(startIndex, startIndex + limit)
  const pageItems = getPageItems(safePage, totalPages)

  const totalProposals = proposals.length
  const approvedProposals = proposals.filter((p: Proposal) => p.status === "Completed").length
  const rejectedProposals = proposals.filter((p: Proposal) => p.status === "Rejected").length

  const stats = [
    { label: "Total Proposals Created", value: totalProposals.toString(), lastUpdated: "1 min ago" },
    { label: "Approved Proposals", value: approvedProposals.toString(), lastUpdated: "1 min ago" },
    { label: "Rejected Proposals", value: rejectedProposals.toString(), lastUpdated: "1 min ago" },
    { label: "My Proposals", value: "1", link: "View proposal" },
  ]

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Dashboard › Proposals</p>
          <h1 className="text-2xl sm:text-3xl font-bold">Proposals</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          + Create a Proposal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <ProposalStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Proposal History */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Proposal History</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <Input placeholder="Search for proposals" className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Filter size={16} />
              Filters: Recent Transaction
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <ArrowUpDown size={16} />
              Sort: Date
            </Button>
          </div>
        </div>

        <ProposalTable proposals={paginatedProposals} />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  let ellipsisCount = 0
                  return pageItems.map((item) => {
                    if (item === "...") {
                      ellipsisCount += 1
                      const side = ellipsisCount === 1 ? "left" : "right"
                      return (
                        <span key={`ellipsis-${side}`} className="px-2 text-gray-500">
                          ...
                        </span>
                      )
                    }

                    const isActive = item === safePage
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`h-9 min-w-9 rounded border text-sm ${
                          isActive
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })
                })()}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={safePage >= totalPages}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <CreateProposalModal 
          onClose={() => setShowCreateModal(false)} 
          onProposalCreated={handleProposalCreated}
        />
      )}
    </div>
  )
}
