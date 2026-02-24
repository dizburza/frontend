"use client"

import { useState } from "react"
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
  
  // Refresh proposals when a new one is created
  const handleProposalCreated = () => {
    setProposals(getSessionProposals())
  }

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
    <div className="p-8  space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">Dashboard › Proposals</p>
          <h1 className="text-3xl font-bold">Proposals</h1>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          + Create a Proposal
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <ProposalStatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Proposal History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Proposal History</h3>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <Input placeholder="Search for proposals" className="pl-10" />
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter size={16} />
            Filters: Recent Transaction
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <ArrowUpDown size={16} />
            Sort: Date
          </Button>
        </div>

        <ProposalTable proposals={proposals} />
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
