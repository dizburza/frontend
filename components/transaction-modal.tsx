"use client"

import { X, ChevronLeft } from "lucide-react"
import type { ReactNode } from "react"

interface TransactionModalProps {
  title: string
  onClose: () => void
  onBack?: () => void
  children: ReactNode
}

export function TransactionModal({ title, onClose, onBack, children }: TransactionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="text-gray-600 hover:text-gray-900">
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
