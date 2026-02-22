"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface SignaturesComponentProps {
  onSignClick: () => void
}

export function SignaturesComponent({ onSignClick }: Readonly<SignaturesComponentProps>) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Signatures</h3>

      {/* Signature Progress */}
      <div className="flex flex-col items-center justify-center mb-6">
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#16a34a"
              strokeWidth="8"
              strokeDasharray="141.3 282.6"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">1</span>
          </div>
        </div>
        <p className="text-center text-sm">
          <span className="font-semibold">1 Signature</span>
          <span className="text-gray-600"> Obtained</span>
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>FOR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600" />
          <span>AGAINST</span>
        </div>
      </div>

      {/* Signatures Breakdown */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-sm">For</span>
          </div>
          <span className="font-semibold">1</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600" />
            <span className="text-sm">Against</span>
          </div>
          <span className="font-semibold">0</span>
        </div>
      </div>

      {/* Quorum */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={20} className="text-blue-600" />
          <span className="text-sm font-medium">Quorum</span>
        </div>
        <span className="font-semibold">2</span>
      </div>

      {/* Sign Button */}
      <Button onClick={onSignClick} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Sign Proposal
      </Button>
    </Card>
  )
}
