"use client"

import type { ReactNode } from "react"

interface TransactionSummaryProps {
  id?: string
  label: string
  value: string | ReactNode
}

export function TransactionSummary({ items }: Readonly<{ items: TransactionSummaryProps[] }>) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id ?? item.label}
          className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <span className="text-gray-600">{item.label}:</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}
