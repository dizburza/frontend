"use client"

import { useState } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const banks = [
  "Access Bank",
  "ALAT by Wema",
  "Carbon",
  "Ecobank Nigeria",
  "FCMB (First City Monument Bank)",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Ibile Bank",
]

interface BankSelectionModalProps {
  onSelect: (bank: string) => void
  onClose: () => void
}

export function BankSelectionModal({ onSelect, onClose }: BankSelectionModalProps) {
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState("Access Bank")

  const filtered = banks.filter((bank) => bank.toLowerCase().includes(search.toLowerCase()))

  return (
    <TransactionModal title="Send to Bank Account" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Select Bank</h3>
          <p className="text-sm text-gray-600 mb-4">
            Choose the recipient&apos;s bank and review the details before proceeding.
          </p>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Enter bank name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filtered.map((bank) => (
            <label key={bank} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="radio"
                name="bank"
                value={bank}
                checked={selected === bank}
                onChange={() => setSelected(bank)}
                className="w-4 h-4"
              />
              <span className="text-sm">{bank}</span>
            </label>
          ))}
        </div>
      </div>
    </TransactionModal>
  )
}
