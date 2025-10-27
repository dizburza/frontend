"use client"

import { useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, MoreVertical } from "lucide-react"

const paymentHistory = [
  {
    id: 1,
    recipient: "John Doe",
    amount: "50,000",
    date: "25 Oct, 2025",
    time: "At 7:45 AM",
    type: "Sent",
    status: "Completed",
  },
  {
    id: 2,
    recipient: "Jane Smith",
    amount: "75,000",
    date: "24 Oct, 2025",
    time: "At 3:20 PM",
    type: "Sent",
    status: "Completed",
  },
  {
    id: 3,
    recipient: "Tech Company Ltd",
    amount: "150,000",
    date: "23 Oct, 2025",
    time: "At 10:15 AM",
    type: "Sent",
    status: "Completed",
  },
  {
    id: 4,
    recipient: "Sarah Johnson",
    amount: "30,000",
    date: "22 Oct, 2025",
    time: "At 2:30 PM",
    type: "Sent",
    status: "Failed",
  },
  {
    id: 5,
    recipient: "Mike Wilson",
    amount: "100,000",
    date: "21 Oct, 2025",
    time: "At 9:00 AM",
    type: "Sent",
    status: "Completed",
  },
]

export default function PersonalPaymentsPage() {
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
        <span>Payments</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Payments" value="5" trend={{ value: "+1 this month", direction: "up" }} />
        <StatCard label="Total Sent" value="405,000 cNGN" lastUpdated="1 min ago" />
        <StatCard label="Completed" value="4" trend={{ value: "+1 this month", direction: "up" }} />
        <StatCard label="Failed" value="1" lastUpdated="1 min ago" />
      </div>

      {/* Payment History Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment History</h2>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
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
              {paymentHistory.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 text-sm text-gray-900">{payment.id}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">{payment.recipient}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-gray-900">{payment.amount}</td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {payment.date}
                    <br />
                    <span className="text-xs text-gray-500">{payment.time}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{payment.type}</td>
                  <td className="py-4 px-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
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
