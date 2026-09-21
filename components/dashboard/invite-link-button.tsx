"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { createOrganizationInvite, fetchOrganizationInvite } from "@/lib/api/invite"

/**
 * The link staff use to claim the records already entered for them.
 *
 * One live link per organization, so generating a new one invalidates the old,
 * which is how a link that has been forwarded too widely gets closed.
 */
export function InviteLinkButton({ organizationId }: Readonly<{ organizationId?: string }>) {
  const [isWorking, setIsWorking] = useState(false)

  const copy = async (token: string) => {
    const url = `${globalThis.location.origin}/join/${token}`

    try {
      await navigator.clipboard.writeText(url)
      toast.success("Invitation link copied")
    } catch {
      // Clipboard access is refused in some browsers, so the link is still
      // shown rather than lost.
      toast.message(url)
    }
  }

  const handleClick = async () => {
    if (!organizationId || isWorking) return

    try {
      setIsWorking(true)
      const existing = await fetchOrganizationInvite(organizationId)
      await copy(existing ?? (await createOrganizationInvite(organizationId)))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not get the invitation link")
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="gap-2 bg-transparent"
      disabled={!organizationId || isWorking}
      onClick={() => void handleClick()}
    >
      {isWorking ? "Working..." : "Copy invite link"}
    </Button>
  )
}
