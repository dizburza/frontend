"use client"

import { useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search, MoreVertical } from "lucide-react"
import useCngnTransferActivity from "@/hooks/ERC20/useCngnTransferActivity"
import useAddressUsernames from "@/hooks/useAddressUsernames"
import { QRScanModal } from "@/components/qr-scan-modal"
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow"

export default function PersonalPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showScan, setShowScan] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [scanRecipient, setScanRecipient] = useState<string | undefined>(undefined)

  const { rows, outgoingTotal, isLoading, error, toShortAddress, lastUpdatedAt } = useCngnTransferActivity()

  const lastUpdatedDisplay = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : undefined

  // Treat outgoing cNGN transfers as "payments" for this page.
  const payments = rows.filter((r) => r.direction === "outgoing")

  const filtered = (() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return payments

    return payments.filter((p) => {
      const counterparty = p.counterparty.toLowerCase()
      const txHash = p.transactionHash.toLowerCase()
      return counterparty.includes(q) || txHash.includes(q)
    })
  })()

  const { getUsername } = useAddressUsernames(filtered.map((p) => p.counterparty))

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
          lastUpdated={isLoading ? "Updating..." : lastUpdatedDisplay}
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

                return filtered.map((payment, idx) => (
                  <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{idx + 1}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">
                      {(() => {
                        const username = getUsername(payment.counterparty)
                        const name = username?.trim()
                        return name || toShortAddress(payment.counterparty)
                      })()}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                      {payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {payment.timestamp ? new Date(payment.timestamp * 1000).toLocaleDateString() : "--"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {payment.timestamp ? new Date(payment.timestamp * 1000).toLocaleTimeString() : ""}
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
