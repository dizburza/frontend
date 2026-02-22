"use client"

import { TransactionModal } from "@/components/transaction-modal"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface QRCodeModalProps {
  onClose: () => void
}

export function QRCodeModal({ onClose }: Readonly<QRCodeModalProps>) {
  return (
    <TransactionModal title="Receive from others" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-48 h-48 bg-gray-100 rounded flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full p-4">
              <rect x="20" y="20" width="50" height="50" fill="black" />
              <rect x="130" y="20" width="50" height="50" fill="black" />
              <rect x="20" y="130" width="50" height="50" fill="black" />
              <circle cx="100" cy="100" r="15" fill="black" />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-semibold mb-2">Scan Your QR Code</h3>
          <p className="text-sm text-gray-600">
            Use this code to receive payments instantly from other Dizburza users.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600">OR</p>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-gray-50 rounded text-center text-sm font-mono">0xf2...6fad</div>
            <div className="flex-1 p-3 bg-gray-50 rounded text-center text-sm">@bello_dami_6fad</div>
          </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
          <Share2 size={18} />
          Share
        </Button>
      </div>
    </TransactionModal>
  )
}
