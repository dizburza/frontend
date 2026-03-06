"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Copy, MoreVertical } from "lucide-react"
import { useActiveAccount } from "thirdweb/react"
import { useTransactionHistory, useTransactionSummary } from "@/lib/api/organization"

export default function PersonalTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const account = useActiveAccount()
  const address = account?.address ?? null
  const { data, loading: isLoading } = useTransactionHistory(address, { page, limit })
  const { data: summaryData, loading: summaryLoading } = useTransactionSummary(address)

  const transactions = data?.transactions ?? []
  const totalPages = data?.pagination?.totalPages ?? 1
  const hasMore = data?.pagination?.hasMore ?? false

  // Reset pagination on wallet switch
  useEffect(() => {
    setPage(1)
  }, [account?.address, limit])

  const pageItems = (() => {
    const safeTotalPages = Math.max(1, totalPages)
    const safePage = Math.min(Math.max(1, page), safeTotalPages)
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1)
    }

    const items: Array<number | "..."> = [1]
    const start = Math.max(2, safePage - 1)
    const end = Math.min(safeTotalPages - 1, safePage + 1)

    if (start > 2) items.push("...")
    for (let p = start; p <= end; p++) items.push(p)
    if (end < safeTotalPages - 1) items.push("...")
    items.push(safeTotalPages)

    return items
  })()

  const toShortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const outgoingTotal = Number.parseFloat(String(summaryData?.outflowAmount || "0")) || 0
  const incomingTotal = Number.parseFloat(String(summaryData?.inflowAmount || "0")) || 0

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // ignore
    }
  }

  const getStatusColor = (status: string) => {
    return status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }

  const tableBody = (() => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan={8} className="py-8 text-center text-gray-500">
            Loading...
          </td>
        </tr>
      )
    }

    if (transactions.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="py-8 text-center text-gray-500">
            No transactions yet.
          </td>
        </tr>
      )
    }

    return transactions.map((tx, idx) => (
      <tr key={tx._id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-4 text-sm text-gray-900">{idx + 1}</td>
        <td className="py-4 px-4 text-sm text-gray-900">
          {tx.direction === "received" ? "Inflow from" : "Outflow to"}{" "}
          {toShortAddress(tx.direction === "received" ? tx.fromAddress : tx.toAddress)}
        </td>
        <td className="py-4 px-4 text-sm font-semibold text-gray-900">
          {Number.parseFloat(
            String(tx.displayAmount || "0")
              .replaceAll("+", "")
              .replaceAll("-", "")
          ).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </td>
        <td className="py-4 px-4 text-sm text-gray-600">{tx.direction === "received" ? "Inflow" : "Outflow"}</td>
        <td className="py-4 px-4 text-sm text-gray-600">
          {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "--"}
        </td>
        <td className="py-4 px-4 text-sm">
          <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor("Completed")}`}>Completed</span>
        </td>
        <td className="py-4 px-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <a
              href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {toShortAddress(tx.txHash)}
            </a>
            <button
              type="button"
              onClick={() => void copyToClipboard(tx.txHash)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Copy transaction hash"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </td>
        <td className="py-4 px-4 text-sm">
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </td>
      </tr>
    ))
  })()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span>Transaction History</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
          Export
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

        {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Transactions" value={String(transactions.length)} />
        <StatCard
          label="Total Outflow (cNGN)"
          value={
            summaryLoading
              ? "--"
              : outgoingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        />
        <StatCard
          label="Total Inflow (cNGN)"
          value={
            summaryLoading
              ? "--"
              : incomingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          }
        />
        <StatCard label="Completed" value={String(transactions.length)} />
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-4">
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
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DESCRIPTION</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">AMOUNT (cNGN)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TYPE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DATE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TRANSACTION HASH</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {tableBody}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={isLoading}
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
                disabled={page <= 1 || isLoading}
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

                  const isActive = item === page
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      disabled={isLoading}
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
              disabled={!hasMore || isLoading}
              className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
