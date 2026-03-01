"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, MoreVertical } from "lucide-react"
import { BatchPaymentCreationModal } from "@/components/payments/batch-payment-creation-modal"
import { 
  useOrganizationBySlug, 
  useOrganizationBatches,
  useTransactionHistory,
  mapApiBatchToPaymentBatch 
} from "@/lib/api/organization"
import useOrgSlug from "@/hooks/useOrgSlug"

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showBatchModal, setShowBatchModal] = useState(false)
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

  const orgSlug = useOrgSlug()
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const { data: batchesData, loading: batchesLoading, error, refresh } = useOrganizationBatches(organization?._id || null)
  const { data: transactionsData } = useTransactionHistory(
    organization?.contractAddress || null,
    { limit: 200 }
  )

  const paymentBatches = batchesData?.batches?.map(mapApiBatchToPaymentBatch) || []
  const stats = batchesData?.stats || { pending: 0, approved: 0, executed: 0, cancelled: 0 }
  const totalBatches = batchesData?.totalBatches || 0

  const transactions = transactionsData?.transactions ?? []

  const outflow = transactions
    .filter((t) => t.direction === "sent")
    .reduce((acc, t) => {
      const amt = Number.parseFloat(String(t.displayAmount || "0").replaceAll("-", ""))
      return acc + (Number.isFinite(amt) ? amt : 0)
    }, 0)

  const inflow = transactions
    .filter((t) => t.direction === "received")
    .reduce((acc, t) => {
      const amt = Number.parseFloat(String(t.displayAmount || "0").replaceAll("+", ""))
      return acc + (Number.isFinite(amt) ? amt : 0)
    }, 0)

  const handlePaymentCreated = () => {
    refresh()
    setShowBatchModal(false)
  }

  // Format amount for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(3)}M`
    }
    return amount.toLocaleString()
  }

  let totalBatchesUpdatedText = "--"
  const latestBatchUpdatedAt = batchesData?.batches?.[0]?.updatedAt
  if (batchesLoading) {
    totalBatchesUpdatedText = "updating ..."
  } else if (latestBatchUpdatedAt) {
    totalBatchesUpdatedText = new Date(latestBatchUpdatedAt).toLocaleString()
  }

  const filteredBatches = paymentBatches.filter(batch =>
    batch.batchName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    setPage(1)
  }, [organization?._id, searchTerm, limit])

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * limit
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + limit)
  const pageItems = getPageItems(safePage, totalPages)

  if (error) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load payment batches: {error}</p>
          <Button onClick={refresh} className="mt-2" variant="outline">Try Again</Button>
        </div>
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "executed") return "bg-green-100 text-green-700";
    if (normalizedStatus === "pending") return "bg-yellow-100 text-yellow-700";
    if (normalizedStatus === "approved") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const toShortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span>Treasury Payments</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Treasury Payments</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-700">Org Treasury</span>
            <span>Address:</span>
            <span className="font-mono text-gray-800">
              {organization?.contractAddress ? toShortAddress(organization.contractAddress) : "--"}
            </span>
          </div>
        </div>
        <Button onClick={() => setShowBatchModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Create New Batch
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Batches"
          value={totalBatches.toString()}
          lastUpdated={totalBatchesUpdatedText}
        />
        <StatCard label="Pending Approval" value={stats.pending.toString()} />
        <StatCard
          label="Outflow (cNGN)"
          value={outflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        />
        <StatCard
          label="Inflow (cNGN)"
          value={inflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        />
      </div>

      {/* Payment Batches Table */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Batches</h2>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Search batches"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filters:</span>
              <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                Recent Batches
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort:</span>
              <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                Date
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">BATCH NAME</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">INITIATED BY</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TOTAL AMOUNT (cNGN)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DATE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">EMPLOYEES</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TRANSACTION HASH</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    No payment batches yet. Create your first batch to get started.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((batch, index) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{batch.batchName}</td>
                    <td className="py-4 px-4 text-sm text-gray-600">{(batch.creatorJobRole || "").trim() || toShortAddress(batch.creatorAddress)}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                      {formatAmount(batch.totalAmount)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{batch.date}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{batch.employees}</td>
                    <td className="py-4 px-4 text-sm">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusStyle(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">{batch.txHash ? toShortAddress(batch.txHash) : "--"}</td>
                    <td className="py-4 px-4 text-sm">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
                disabled={batchesLoading}
                className="h-9 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 disabled:opacity-50"
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
                disabled={safePage <= 1 || batchesLoading}
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
                        disabled={batchesLoading}
                        className={`h-9 min-w-9 rounded border text-sm disabled:opacity-50 ${
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
                disabled={safePage >= totalPages || batchesLoading}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>

      {showBatchModal && (
        <BatchPaymentCreationModal 
          organizationId={organization?._id}
          onClose={() => setShowBatchModal(false)} 
          onPaymentCreated={handlePaymentCreated}
        />
      )}
    </div>
  )
}
