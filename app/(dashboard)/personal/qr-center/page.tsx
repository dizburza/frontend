"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReceiveFlow } from "@/components/receive-flow"
import { QRScanModal } from "@/components/qr-scan-modal"
import { SendToCNGNFlow } from "@/components/send-to-cngn-flow"

export default function PersonalQRCenterPage() {
  const [showReceive, setShowReceive] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [scanRecipient, setScanRecipient] = useState<string | undefined>(undefined)

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">QR Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
        <CardHeader>
          <CardTitle>Your QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Share this QR code to receive payments</p>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowReceive(true)}>
                Open QR Code
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scan to Send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Scan a Dizburza QR code to send cNGN</p>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowScan(true)}>
                  Open Scanner
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ReceiveFlow isOpen={showReceive} onClose={() => setShowReceive(false)} />

      <QRScanModal
        isOpen={showScan}
        onClose={() => setShowScan(false)}
        onDetected={({ recipient }) => {
          setScanRecipient(recipient)
          setShowSend(true)
        }}
      />

      <SendToCNGNFlow
        isOpen={showSend}
        onClose={() => setShowSend(false)}
        initialRecipient={scanRecipient}
      />
    </div>
  )
}
