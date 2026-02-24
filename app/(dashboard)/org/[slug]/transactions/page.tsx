"use client"

import { useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Copy, MoreVertical } from "lucide-react"
import { mockTransactions } from "@/lib/static/mock-data"

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const transactions = mockTransactions.list

  const getStatusColor = (status: string) => {
    return status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }

  const getTypeColor = (type: string) => {
    return type === "Inflow" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span>Transaction History</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
          Export
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Transactions" value={mockTransactions.stats.totalTransactions.toString()} trend={{ value: "0.08% than last month", direction: "up" }} />
        <StatCard
          label="Outflow"
          value={`${(mockTransactions.stats.outflow / 1000000).toFixed(1)}M cNGN`}
          trend={{ value: "2.13% than last month", direction: "down" }}
        />
        <StatCard 
          label="Inflow" 
          value={`${(mockTransactions.stats.inflow / 1000000).toFixed(1)}M cNGN`} 
          trend={{ value: "1% than last month", direction: "up" }} 
        />
        <StatCard label="Pending Transactions" value={mockTransactions.stats.pendingTransactions.toString()} lastUpdated="1 min ago" />
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transaction</h2>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by Batch Name or Creator"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filters:</span>
              <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                Recent Transaction
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
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TYPE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DATE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TRANSACTION HASH</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">{index + 1}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{tx.batchName}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{tx.initiatedBy}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">{tx.totalAmount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {tx.date}
                    <br />
                    <span className="text-xs text-gray-500">{tx.time}</span>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 flex items-center gap-2">
                    {tx.transactionHash}
                    <Copy className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
