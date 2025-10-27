"use client"

import { useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, Copy, MoreVertical } from "lucide-react"

const transactions = [
  {
    id: 1,
    description: "Payment to John Doe",
    amount: "50,000",
    type: "Outflow",
    date: "25 Oct, 2025",
    time: "At 7:45 AM",
    status: "Completed",
    hash: "0x7228hg...",
  },
  {
    id: 2,
    description: "Received from Tech Company",
    amount: "200,000",
    type: "Inflow",
    date: "24 Oct, 2025",
    time: "At 3:20 PM",
    status: "Completed",
    hash: "0x1d3fa9b...",
  },
  {
    id: 3,
    description: "Payment to Jane Smith",
    amount: "75,000",
    type: "Outflow",
    date: "23 Oct, 2025",
    time: "At 10:15 AM",
    status: "Completed",
    hash: "0x91a9ff6e...",
  },
  {
    id: 4,
    description: "Received from Sarah Johnson",
    amount: "100,000",
    type: "Inflow",
    date: "22 Oct, 2025",
    time: "At 2:30 PM",
    status: "Completed",
    hash: "0xa4cc91e...",
  },
  {
    id: 5,
    description: "Payment to Mike Wilson",
    amount: "150,000",
    type: "Outflow",
    date: "21 Oct, 2025",
    time: "At 9:00 AM",
    status: "Failed",
    hash: "0x8ae174a...",
  },
  {
    id: 6,
    description: "Received from Partner",
    amount: "300,000",
    type: "Inflow",
    date: "20 Oct, 2025",
    time: "At 5:23 AM",
    status: "Completed",
    hash: "0x83b28a1c...",
  },
]

export default function PersonalTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    return status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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
        <StatCard label="Total Transactions" value="6" trend={{ value: "+2 this month", direction: "up" }} />
        <StatCard
          label="Total Outflow"
          value="275,000 cNGN"
          trend={{ value: "1.5% than last month", direction: "down" }}
        />
        <StatCard label="Total Inflow" value="600,000 cNGN" trend={{ value: "2% than last month", direction: "up" }} />
        <StatCard label="Completed" value="5" lastUpdated="1 min ago" />
      </div>

      {/* Recent Transactions Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
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
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">{tx.id}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{tx.description}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">{tx.amount}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">{tx.type}</td>
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
                    {tx.hash}
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
