"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PersonalQRCenterPage() {
  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">QR Center</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your QR Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <span className="text-gray-500">QR Code</span>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-4">Share this QR code to receive payments</p>
              <Button className="bg-blue-600 hover:bg-blue-700">Download QR Code</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
