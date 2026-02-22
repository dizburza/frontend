"use client"

import { QRCodeModal } from "@/components/qr-code-modal"

interface ReceiveFlowProps {
  isOpen: boolean
  onClose: () => void
}

export function ReceiveFlow({ isOpen, onClose }: Readonly<ReceiveFlowProps>) {
  if (!isOpen) return null

  return <QRCodeModal onClose={onClose} />
}
