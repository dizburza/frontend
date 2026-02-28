"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Copy, MoreVertical } from "lucide-react"
import useOrgSlug from "@/hooks/useOrgSlug"
import { useOrganizationBySlug, useTransactionHistory } from "@/lib/api/organization"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const orgSlug = useOrgSlug()
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const {
    data: history,
    loading: transactionsLoading,
    error,
    refresh,
  } = useTransactionHistory(organization?.contractAddress || null, { limit: 100 })

  const transactions = history?.transactions || []

  const toShortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!transactionsLoading && history) {
      setLastUpdatedAt(new Date())
    }
  }, [transactionsLoading, history])

  let lastUpdatedText = "-"
  if (transactionsLoading) {
    lastUpdatedText = "updating ..."
  } else if (lastUpdatedAt) {
    lastUpdatedText = lastUpdatedAt.toLocaleString()
  }

  const pendingTransactions = transactions.filter(tx => tx.status === "pending").length
  const confirmedTransactions = transactions.filter(tx => tx.status === "confirmed")
  const totalTransactions = history?.pagination?.total ?? transactions.length

  const outflow = confirmedTransactions.reduce((sum, tx) => {
    const value = Number.parseFloat(tx.displayAmount || "0")
    return value < 0 ? sum + Math.abs(value) : sum
  }, 0)

  const inflow = confirmedTransactions.reduce((sum, tx) => {
    const value = Number.parseFloat(tx.displayAmount || "0")
    return value > 0 ? sum + value : sum
  }, 0)

  const getStatusColor = (status: string) => {
    if (status === "confirmed") return "bg-green-100 text-green-700"
    if (status === "pending") return "bg-yellow-100 text-yellow-700"
    return "bg-red-100 text-red-700"
  }

  const getStatusLabel = (status: string) => {
    if (status === "confirmed") return "Completed"
    if (status === "pending") return "Pending"
    return "Failed"
  }

  const getTypeColor = (type: string) => {
    return type === "Inflow" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }

  const filteredTransactions = transactions.filter((tx) => {
    const description = (tx.description || tx.batchName || "").toLowerCase()
    const addresses = `${tx.fromAddress} ${tx.toAddress} ${tx.txHash}`.toLowerCase()
    const q = searchTerm.toLowerCase()
    return description.includes(q) || addresses.includes(q)
  })

  if (error) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load transactions: {error}</p>
          <button onClick={refresh} className="mt-2 text-sm text-gray-700 underline">Try Again</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span>Transaction History</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Transaction History</h1>
        <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
          Export
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={totalTransactions.toString()}
          lastUpdated={lastUpdatedText}
        />
        <StatCard
          label="Outflow (cNGN)"
          value={outflow.toFixed(2)}
        />
        <StatCard 
          label="Inflow (cNGN)" 
          value={inflow.toFixed(2)} 
        />
        <StatCard
          label="Pending Transactions"
          value={pendingTransactions.toString()}
          lastUpdated={transactionsLoading ? "updating ..." : undefined}
        />
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, index) => {
                  const amountNumber = Number.parseFloat(tx.displayAmount || "0")
                  const isInflow = amountNumber > 0
                  const txType = isInflow ? "Inflow" : "Outflow"

                  const description = tx.description || tx.batchName || "Transaction"

                  const createdAt = new Date(tx.timestamp)
                  const txDate = createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  const txTime = createdAt.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })

                  const txHashShort = tx.txHash
                    ? `${tx.txHash.slice(0, 6)}...${tx.txHash.slice(-4)}`
                    : "--"

                  return (
                    <tr key={tx._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">
                        {description}
                        <div className="text-xs text-gray-500 mt-0.5">
                          {txType === "Inflow" ? "Inflow from" : "Outflow to"} {toShortAddress(txType === "Inflow" ? tx.fromAddress : tx.toAddress)}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                        {Math.abs(amountNumber).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${getTypeColor(txType)}`}>
                          {txType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {txDate}
                        <br />
                        <span className="text-xs text-gray-500">{txTime}</span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                          {getStatusLabel(tx.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-2">
                        {txHashShort}
                        <button
                          type="button"
                          onClick={() => void copyToClipboard(tx.txHash)}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Copy transaction hash"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
