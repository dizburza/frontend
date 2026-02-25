"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ScanQrCode } from "lucide-react"

interface QuickActionsProps {
  onSendToCNGN: () => void
  onSendToBank: () => void
  onReceive: () => void
  onScan: () => void
}

export function QuickActions({ onSendToCNGN, onSendToBank, onReceive, onScan }: Readonly<QuickActionsProps>) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onSendToCNGN}
      >
       <Image src={"/send-to-cngn.svg"} alt="Send cNGN" width={54} height={54} />
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
      <Button
        variant="outline"
        className="h-24 flex flex-col items-center justify-center gap-2 bg-transparent"
        onClick={onScan}
      >
        <div className="h-[54px] w-[54px] rounded-[4px] bg-[#F9F9FE] flex items-center justify-center">
          <ScanQrCode className="h-8 w-8 text-[#454ADE]" />
        </div>
        <span className="text-sm">Scan</span>
      </Button>
    </div>
  )
}
