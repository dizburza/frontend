"use client"

import type { ReactNode } from "react"

interface TransactionSummaryProps {
  label: string
  value: string | ReactNode
}

export function TransactionSummary({ items }: { items: TransactionSummaryProps[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <span className="text-gray-600">{item.label}:</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
