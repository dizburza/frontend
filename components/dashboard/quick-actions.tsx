"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

interface QuickActionsProps {
  onSendToCNGN: () => void
  onSendToBank: () => void
  onReceive: () => void
}

export function QuickActions({ onSendToCNGN, onSendToBank, onReceive }: Readonly<QuickActionsProps>) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onSendToCNGN}
      >
       <Image src={"/send-to-cngn.svg"} alt="Send to cNGN" width={54} height={54} />
        <span className="text-sm">To cNGN</span>
      </Button>
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onSendToBank}
      >
        <Image src={"/send-to-bank.svg"} alt="Send to Bank" width={54} height={54} />
        <span className="text-sm">To Bank</span>
      </Button>
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onReceive}
      >
        <Image src={"/receive.svg"} alt="Receive" width={54} height={54} />
        <span className="text-sm">Receive</span>
      </Button>
    </div>
  )
}
