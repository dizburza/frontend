"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import useOrgSlug from "@/hooks/useOrgSlug"
import useAddressUsernames from "@/hooks/useAddressUsernames"
import { useActiveAccount } from "thirdweb/react"
import { useTransactionHistory } from "@/lib/api/organization"

export function TransactionHistory({
  viewAllHref = "/",
  limit = 10,
}: Readonly<{ viewAllHref?: string; limit?: number }>) {
  const pathname = usePathname()

  const account = useActiveAccount()
  const address = account?.address ?? null
  const { data, loading: isLoading, error } = useTransactionHistory(address, { limit })

  const transactions = data?.transactions ?? []
  const recent = transactions.slice(0, limit)

  const toShortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const { getUsername } = useAddressUsernames(
    recent.map((r) => (r.direction === "received" ? r.fromAddress : r.toAddress))
  )

  const orgSlug = useOrgSlug()

  let resolvedViewAllHref = viewAllHref
  if (viewAllHref === "/") {
    if (orgSlug) {
      resolvedViewAllHref = `/org/${orgSlug}/transactions`
    } else if (pathname.startsWith("/personal")) {
      resolvedViewAllHref = "/personal/transactions"
    }
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

    if (error) {
      const errorMessage = typeof error === "string" ? error : ""
      return (
        <tr>
          <td colSpan={8} className="py-8 text-center text-gray-500">
            Could not load transactions{errorMessage ? `: ${errorMessage}` : "."}
          </td>
        </tr>
      )
    }

    if (recent.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="py-8 text-center text-gray-500">
            No transactions yet.
          </td>
        </tr>
      )
    }

    return recent.map((tx, idx) => {
      const counterparty = tx.direction === "received" ? tx.fromAddress : tx.toAddress
      const amountAbs = Number.parseFloat(String(tx.displayAmount || "0").replace(/[+-]/g, ""))

      return (
        <tr key={tx._id} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-4 px-4">{idx + 1}</td>
        <td className="py-4 px-4">{tx.direction === "received" ? "Inflow" : "Outflow"}</td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={"/placeholder.svg"} />
              <AvatarFallback>{counterparty[2] || "?"}</AvatarFallback>
            </Avatar>
            <span>
              {(() => {
                const username = getUsername(counterparty)
                return username ? `@${username}` : toShortAddress(counterparty)
              })()}
            </span>
          </div>
        </td>
        <td className="py-4 px-4">
          {amountAbs.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} cNGN
        </td>
        <td className="py-4 px-4">--</td>
        <td className="py-4 px-4">
          <div>
            <p>{tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : "--"}</p>
            <p className="text-gray-500 text-xs"> </p>
          </div>
        </td>
        <td className="py-4 px-4">
          <span className="px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Completed</span>
        </td>
        <td className="py-4 px-4">
          <a
            href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 cursor-pointer hover:underline"
          >
            {toShortAddress(tx.txHash)}
          </a>
        </td>
        </tr>
      )
    })
  })()

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <Link href={resolvedViewAllHref} className="text-blue-600 text-sm font-medium">
          View all
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="flex-1 relative w-full sm:w-auto">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <Input placeholder="Search transactions" className="pl-10" />
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
            {tableBody}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
