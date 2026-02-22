"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"

export function StatusTimeline() {
  const statuses = [
    { id: "draft-created", label: "Draft Created", role: "CEO", timestamp: "Wed, Oct 8 - 10:42 AM", completed: true },
    { id: "submitted-for-review", label: "Submitted for Review", role: "", timestamp: "Wed, Oct 8 - 12:42 PM", completed: true },
    { id: "signing-started", label: "Signing Started", role: "", timestamp: "Wed, Oct 10 - 10:42 AM", completed: true },
    { id: "signing-ended", label: "Signing ended", role: "", timestamp: "Wed, Oct 16 - 10:42 AM", completed: false },
    { id: "signed", label: "Signed", role: "", timestamp: "Wed, Oct 16 - 10:43 AM", completed: false },
    { id: "disbursed", label: "Disbursed", role: "", timestamp: "Wed, Oct 16 - 10:44 AM", completed: false },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Status</h3>

      <div className="space-y-4">
        {statuses.map((status, index) => (
          <div key={status.id} className="flex gap-4">
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              {status.completed ? (
                <CheckCircle2 size={24} className="text-blue-600" />
              ) : (
                <Circle size={24} className="text-gray-300" />
              )}
              {index < statuses.length - 1 && (
                <div className={`w-0.5 h-12 ${status.completed ? "bg-blue-600" : "bg-gray-300"}`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-4">
              <p className="text-sm text-gray-500">{status.timestamp}</p>
              <p className="font-semibold text-gray-900">{status.label}</p>
              {status.role && <p className="text-xs text-gray-500">{status.role}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
