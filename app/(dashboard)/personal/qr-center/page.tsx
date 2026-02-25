"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ReceiveFlow } from "@/components/receive-flow"

export default function PersonalQRCenterPage() {
  const [showReceive, setShowReceive] = useState(false)

  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">QR Center</h1>

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

      <ReceiveFlow isOpen={showReceive} onClose={() => setShowReceive(false)} />
    </div>
  )
}
