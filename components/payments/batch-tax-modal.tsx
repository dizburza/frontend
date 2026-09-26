"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PillButton } from "@/components/ui/pill-button"
import { Input } from "@/components/ui/input"
import { fetchTaxLinesForBatch, markTaxLineRemitted, type TaxLine } from "@/lib/api/organization"
import { useToken } from "@/hooks/useToken"

interface BatchTaxModalProps {
  organizationId: string
  batchId: string
  batchName: string
  onClose: () => void
}

/**
 * What was withheld on one executed batch, and whether it has been sent on to
 * the state authority. Marking a line remitted records a bank reference, it
 * never sends a transaction: no state authority accepts on-chain settlement.
 */
export function BatchTaxModal({
  organizationId,
  batchId,
  batchName,
  onClose,
}: Readonly<BatchTaxModalProps>) {
  const { symbol } = useToken()
  const [lines, setLines] = useState<TaxLine[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [remittingId, setRemittingId] = useState<string | null>(null)
  const [reference, setReference] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchTaxLinesForBatch(organizationId, batchId)
      .then((result) => {
        if (!cancelled) setLines(result)
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load tax lines for this batch")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [organizationId, batchId])

  const handleRemit = async (lineId: string) => {
    const trimmed = reference.trim()
    if (!trimmed) {
      toast.error("Enter the bank transfer reference first")
      return
    }

    try {
      setRemittingId(lineId)
      const updated = await markTaxLineRemitted(lineId, trimmed)
      setLines((prev) => prev?.map((l) => (l.id === lineId ? updated : l)) ?? prev)
      setReference("")
      toast.success("Marked as remitted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record remittance")
    } finally {
      setRemittingId(null)
    }
  }

  const regimeVerified = lines?.every((l) => l.breakdown?.regimeVerified !== false) ?? true

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">
      <div className="flex w-full max-w-[720px] flex-col gap-6 rounded-xl bg-white p-8 shadow-[0px_16px_135px_0px_rgba(24,34,57,0.12)] outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-300">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-nohemi text-xl font-medium text-zinc-700">PAYE for {batchName}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              What was withheld from this batch, and what has been sent on.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-zinc-400 transition-colors hover:text-zinc-600"
          >
            ✕
          </button>
        </div>

        {!regimeVerified ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
            One or more lines were computed against an unverified tax table. Treat these figures
            as an estimate.
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-[#4F51D9]" />
          </div>
        ) : !lines || lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No PAYE was recorded for this batch. Tax may not have been enabled when it ran.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-zinc-500">
                  <th className="py-2 font-medium">Employee</th>
                  <th className="py-2 text-right font-medium">Tax ({symbol})</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.id} className="border-b border-gray-50">
                    <td className="py-2 font-medium text-zinc-700">{line.employeeName}</td>
                    <td className="py-2 text-right text-zinc-700">
                      {Number(line.taxFormatted).toLocaleString()}
                    </td>
                    <td className="py-2 text-right">
                      {line.status === "remitted" ? (
                        <span className="text-xs font-medium text-emerald-600">
                          Remitted · {line.remittanceReference}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">Outstanding</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {lines.some((l) => l.status !== "remitted") ? (
              <div className="flex flex-col gap-2 rounded-lg bg-neutral-50 p-4 outline outline-1 -outline-offset-1 outline-zinc-200">
                <p className="text-xs text-zinc-500">
                  Sent the withheld total to the state authority by bank transfer? Record the
                  reference, then mark each line remitted.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Bank transfer reference"
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {lines
                    .filter((l) => l.status !== "remitted")
                    .map((line) => (
                      <PillButton
                        key={line.id}
                        tone="soft"
                        size="sm"
                        disabled={remittingId !== null}
                        onClick={() => void handleRemit(line.id)}
                      >
                        {remittingId === line.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : null}
                        Mark {line.employeeName} remitted
                      </PillButton>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-xs font-medium text-emerald-600">
                Every line on this batch has been remitted.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <PillButton tone="soft" onClick={onClose}>
            Close
          </PillButton>
        </div>
      </div>
    </div>
  )
}
