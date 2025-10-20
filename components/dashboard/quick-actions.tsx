"use client"

import { Button } from "@/components/ui/button"
import { Send, ArrowDownLeft, ArrowUpRight } from "lucide-react"

interface QuickActionsProps {
  onSendToCNGN: () => void
  onSendToBank: () => void
  onReceive: () => void
}

export function QuickActions({ onSendToCNGN, onSendToBank, onReceive }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onSendToCNGN}
      >
        <Send size={24} className="text-blue-600" />
        <span className="text-sm">To cNGN</span>
      </Button>
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onSendToBank}
      >
        <ArrowUpRight size={24} className="text-blue-600" />
        <span className="text-sm">To Bank</span>
      </Button>
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onReceive}
      >
        <ArrowDownLeft size={24} className="text-blue-600" />
        <span className="text-sm">Receive</span>
      </Button>
    </div>
  )
}
