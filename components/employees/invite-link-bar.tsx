"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { createOrganizationInvite, fetchOrganizationInvite } from "@/lib/api/invite"
import { useCachedResource } from "@/hooks/useCachedResource"

interface InviteLinkBarProps {
  organizationId: string
}

/**
 * The join link, shown rather than only mailed.
 *
 * Invitation email is not dependable yet, so the link a signer can hand over
 * themselves is the path that actually works. It is one live token for the
 * whole organization, not one per person, which is why this sits above the
 * roster instead of on each row: every row would copy the same string.
 *
 * Holding the link is not authority to join. A claim still has to match an
 * invitation a signer already created, so passing it around admits nobody who
 * was not already on the staff list.
 */
export function InviteLinkBar({ organizationId }: Readonly<InviteLinkBarProps>) {
  const [issued, setIssued] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  // A missing link is the normal empty state rather than a failure, so it
  // resolves to null and the button below offers to create one.
  const cached = useCachedResource<string | null>(
    organizationId ? `organization:invite:${organizationId}` : null,
    () => fetchOrganizationInvite(organizationId).catch(() => null),
    { staleTimeMs: 300_000 }
  )

  // What this component issued wins over the cached read, which is a moment
  // behind after a replace.
  const token = issued ?? cached.data
  const loading = cached.isLoading

  const url = token ? `${globalThis.location?.origin ?? ""}/join/${token}` : ""

  const handleCopy = async () => {
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.")
    }
  }

  const handleIssue = async (replacing: boolean) => {
    setWorking(true)

    try {
      setIssued(await createOrganizationInvite(organizationId))
      toast.success(replacing ? "New link created. The old one no longer works." : "Invitation link created")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create the link")
    } finally {
      setWorking(false)
    }
  }

  if (loading) return null

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-[#F7F8FE] px-4 py-3 outline outline-[0.5px] -outline-offset-[0.5px] outline-indigo-100 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Image src="/icons/linear_copy.svg" alt="" width={16} height={16} className="size-4 shrink-0" />
        <div className="flex min-w-0 flex-col">
          <span className="font-inter text-xs font-medium text-zinc-800">Invitation link</span>
          {token ? (
            <span className="truncate font-inter text-[11px] text-neutral-500" title={url}>
              {url}
            </span>
          ) : (
            <span className="font-inter text-[11px] text-neutral-500">
              Create a link to share with the staff waiting to join.
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {token ? (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-[4px] bg-[#4F51D9] px-4 py-2 font-inter text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="size-3.5" /> : null}
              {copied ? "Copied" : "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => handleIssue(true)}
              disabled={working}
              title="Issuing a new link stops the current one working"
              className="flex items-center gap-1.5 rounded-[4px] bg-white px-3 py-2 font-inter text-xs font-medium text-blue-950 outline outline-1 -outline-offset-1 outline-indigo-100 transition-colors hover:bg-indigo-50 disabled:opacity-50"
            >
              {working ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              Replace
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => handleIssue(false)}
            disabled={working}
            className="flex items-center gap-1.5 rounded-[4px] bg-[#4F51D9] px-4 py-2 font-inter text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {working ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Create link
          </button>
        )}
      </div>
    </div>
  )
}
