"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

const transactions = [
  {
    id: 1,
    type: "Transfer from",
    recipient: "@eze_adeeze_hg54",
    amount: "234 cNGN",
    gasFee: "0.02 cNGN",
    date: "25 Oct 2025",
    time: "At 7:45 AM",
    status: "Completed",
    hash: "0x7j228hg...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=eze",
  },
  {
    id: 2,
    type: "Transfer to",
    recipient: "@pope_rika_ye28",
    amount: "450 cNGN",
    gasFee: "0.00 cNGN",
    date: "19 Oct 2025",
    time: "At 12:45 PM",
    status: "Completed",
    hash: "0x9aa43df...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pope",
  },
  {
    id: 3,
    type: "Transfer from",
    recipient: "@Jahid_eric_6aaf",
    amount: "234 cNGN",
    gasFee: "0.02 cNGN",
    date: "10 Oct 2025",
    time: "At 7:45 AM",
    status: "Failed",
    hash: "0x5fe23bc...",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jahid",
  },
]

export function TransactionHistory({ viewAllHref = "/" }: Readonly<{ viewAllHref?: string }>) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <Link href={viewAllHref} className="text-blue-600 text-sm font-medium">
          View all
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <Input placeholder="Search for proposals" className="pl-10" />
        </div>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Filter size={16} />
          Filters
        </Button>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <ArrowUpDown size={16} />
          Sort
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">OPERATION TYPE</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">RECIPIENT</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">AMOUNT</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">GAS FEE</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">DATE</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">STATUS</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">TRANSACTION HASH</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">{tx.id}</td>
                <td className="py-4 px-4">{tx.type}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={tx.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{tx.recipient[0]}</AvatarFallback>
                    </Avatar>
                    <span>{tx.recipient}</span>
                  </div>
                </td>
                <td className="py-4 px-4">{tx.amount}</td>
                <td className="py-4 px-4">{tx.gasFee}</td>
                <td className="py-4 px-4">
                  <div>
                    <p>{tx.date}</p>
                    <p className="text-gray-500 text-xs">{tx.time}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      tx.status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-blue-600">{tx.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
