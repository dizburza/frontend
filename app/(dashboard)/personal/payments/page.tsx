"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search, MoreVertical } from "lucide-react"
import useAddressUsernames from "@/hooks/useAddressUsernames"
import { QRScanModal } from "@/components/qr-scan-modal"
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow"
import { useActiveAccount } from "thirdweb/react"
import { useTransactionHistory } from "@/lib/api/organization"

export default function PersonalPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showScan, setShowScan] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [scanRecipient, setScanRecipient] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const account = useActiveAccount()
  const address = account?.address ?? null
  const { data, loading: isLoading, error } = useTransactionHistory(address, { limit: 100, page: 1 })

  const transactions = data?.transactions ?? []

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

  const toShortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  // Treat outgoing transactions as "payments" for this page.
  const payments = transactions.filter((t) => t.direction === "sent")

  const outgoingTotal = payments.reduce((acc, t) => {
    const amt = Number.parseFloat(String(t.displayAmount || "0").replaceAll("-", ""))
    return acc + (Number.isFinite(amt) ? amt : 0)
  }, 0)

  const filtered = (() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return payments

    return payments.filter((p) => {
      const counterparty = (p.toAddress || "").toLowerCase()
      const txHash = (p.txHash || "").toLowerCase()
      return counterparty.includes(q) || txHash.includes(q)
    })
  })()

  useEffect(() => {
    setPage(1)
  }, [searchTerm, limit])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * limit
  const paginated = filtered.slice(startIndex, startIndex + limit)
  const pageItems = getPageItems(safePage, totalPages)

  const { getUsername } = useAddressUsernames(filtered.map((p) => p.toAddress))

  const getStatusColor = (status: string) => {
    return status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span>Payments</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={() => setShowScan(true)}>
          Scan to Send
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Payments"
          value={String(payments.length)}
          lastUpdated={isLoading ? "Updating..." : undefined}
        />
        <StatCard
          label="Total Sent (cNGN)"
          value={`${outgoingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatCard label="Completed" value={String(payments.length)} />
        <StatCard label="Failed" value="0" />
      </div>

      {/* Payment History Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search payments"
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
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">RECIPIENT</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">AMOUNT (cNGN)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DATE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TYPE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                if (isLoading) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  )
                }

                if (error) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Failed to load payments.
                      </td>
                    </tr>
                  )
                }

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No payments yet.
                      </td>
                    </tr>
                  )
                }

                return paginated.map((payment, idx) => (
                  <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{startIndex + idx + 1}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {(() => {
                        const username = getUsername(payment.toAddress)
                        const name = username?.trim()
                        return name || toShortAddress(payment.toAddress)
                      })()}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                      {Number.parseFloat(
                        String(payment.displayAmount || "0").replaceAll("-", "")
                      ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {payment.timestamp ? new Date(payment.timestamp).toLocaleDateString() : "--"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {payment.timestamp ? new Date(payment.timestamp).toLocaleTimeString() : ""}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">Sent</td>
                    <td className="py-4 px-4 text-sm">
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor("Completed")}`}>
                        Completed
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              })()}
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
                disabled={safePage <= 1 || isLoading}
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
                disabled={safePage >= totalPages || isLoading}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>

      <QRScanModal
        isOpen={showScan}
        onClose={() => setShowScan(false)}
        onDetected={({ recipient }) => {
          setScanRecipient(recipient)
          setShowSend(true)
        }}
      />

      <SendToCNGNFlow
        isOpen={showSend}
        onClose={() => setShowSend(false)}
        initialRecipient={scanRecipient}
      />
    </div>
  )
}
