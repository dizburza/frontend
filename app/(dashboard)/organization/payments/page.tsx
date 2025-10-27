"use client"

import { useState, useEffect } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, MoreVertical } from "lucide-react"
import { BatchPaymentCreationModal } from "@/components/payments/batch-payment-creation-modal"
import { getSessionPaymentBatches } from "@/lib/localStorage"

interface PaymentBatch {
  id: string
  batchName: string
  totalAmount: number
  date: string
  employees: number
  status: string
  recipients: Array<{
    surname: string
    firstName: string
    salary: string
  }>
}

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [paymentBatches, setPaymentBatches] = useState(getSessionPaymentBatches())

  // Refresh batches when modal closes after creating a new one
  const handlePaymentCreated = () => {
    setPaymentBatches(getSessionPaymentBatches())
    setShowBatchModal(false)
  }

  // Load batches on mount
  useEffect(() => {
    setPaymentBatches(getSessionPaymentBatches())
  }, [])

  // Format amount for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(3)}M`
    }
    return amount.toLocaleString()
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
        <Button onClick={() => setShowBatchModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Create New Batch
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Batches" value={paymentBatches.length.toString()} trend={{ value: "+2 than last month", direction: "up" }} />
        <StatCard label="Pending Approval" value="0" lastUpdated="1 min ago" />
        <StatCard label="Executed This Month" value="2" trend={{ value: "+2 than last month", direction: "up" }} />
        <StatCard label="Employees Paid" value="3" lastUpdated="1 min ago" />
      </div>

      {/* Payment Batches Table */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Batches</h2>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400" />
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
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TOTAL AMOUNT (cNGN)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DATE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">EMPLOYEES</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paymentBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No payment batches yet. Create your first batch to get started.
                  </td>
                </tr>
              ) : (
                paymentBatches.map((batch: PaymentBatch, index: number) => (
                  <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="py-4 px-4 text-sm text-gray-900">{batch.batchName}</td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                      {formatAmount(batch.totalAmount)} cNGN
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {batch.date}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900">{batch.employees}</td>
                    <td className="py-4 px-4 text-sm">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {batch.status}
                      </span>
                    </td>
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
      </Card>

      {showBatchModal && (
        <BatchPaymentCreationModal 
          onClose={() => setShowBatchModal(false)} 
          onPaymentCreated={handlePaymentCreated}
        />
      )}
    </div>
  )
}
