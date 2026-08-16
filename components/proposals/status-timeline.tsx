"use client"

import { Card } from "@/components/ui/card"
import { CheckCircle2, Circle } from "lucide-react"
import type { Proposal } from "@/lib/api/proposals"
import { statusLabel } from "@/lib/proposal-format"

const formatMoment = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : ""

/**
 * The proposal's own history. There is no "disbursed" step: a proposal records
 * a decision, and paying it out is a separate payroll batch with its own quorum
 * on chain.
 */
export function StatusTimeline({ proposal }: Readonly<{ proposal: Proposal }>) {
  const decided = proposal.status !== "open"
  const windowClosed = decided || new Date(proposal.closesAt).getTime() < Date.now()

  const statuses = [
    {
      id: "created",
      label: "Proposal raised",
      timestamp: formatMoment(proposal.createdAt),
      completed: true,
    },
    {
      id: "signing-open",
      label: "Signing opened",
      timestamp: formatMoment(proposal.opensAt),
      completed: true,
    },
    {
      id: "signing-closed",
      label: "Signing closes",
      timestamp: formatMoment(proposal.closesAt),
      completed: windowClosed,
    },
    {
      id: "decided",
      label: decided ? statusLabel[proposal.status] : "Awaiting quorum",
      timestamp: formatMoment(proposal.decidedAt),
      completed: decided,
    },
  ]

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Status</h3>

      <div className="space-y-4">
        {statuses.map((status, index) => (
          <div key={status.id} className="flex gap-4">
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

            <div className="pb-4">
              {status.timestamp && (
                <p className="text-sm text-gray-500">{status.timestamp}</p>
              )}
              <p className="font-semibold text-gray-900">{status.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
