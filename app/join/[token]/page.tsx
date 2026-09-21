"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { useActiveAccount } from "thirdweb/react"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import { ClaimError, claimInvite, fetchInvite, type InviteDetails } from "@/lib/api/invite"
import { fetchSessionProfile } from "@/lib/session"

type State =
  | { kind: "loading" }
  | { kind: "invalid"; message: string }
  | { kind: "ready"; invite: InviteDetails }

export default function JoinPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = params.token

  const account = useActiveAccount()

  const [state, setState] = useState<State>({ kind: "loading" })
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    let live = true

    void fetchInvite(token)
      .then((invite) => {
        if (live) setState({ kind: "ready", invite })
      })
      .catch((error: unknown) => {
        if (!live) return
        setState({
          kind: "invalid",
          message:
            error instanceof Error ? error.message : "This invitation link is no longer valid",
        })
      })

    return () => {
      live = false
    }
  }, [token])

  // Every detour leaves this page, so the token rides along and whatever sent
  // them away brings them back here to finish.
  const leaveFor = (path: string) => {
    try {
      sessionStorage.setItem("pendingInvite", token)
    } catch {
      // ignore
    }
    setIsClaiming(true)
    router.push(path)
  }

  const handleAccept = async () => {
    if (isClaiming) return

    if (!account?.address) {
      leaveFor("/sign-in")
      return
    }

    const profile = await fetchSessionProfile()
    if (!profile) {
      leaveFor("/sign-in")
      return
    }

    // The invitation is matched on email, and the roster shows the rest against
    // a salary, so the claim is refused without them.
    if (!profile.email || !profile.surname || !profile.firstname || !profile.phoneNumber) {
      toast.message("Add your details first, then we will finish joining.")
      leaveFor("/organization-setup/your-details")
      return
    }

    try {
      setIsClaiming(true)
      await claimInvite(token)
      try {
        sessionStorage.removeItem("pendingInvite")
      } catch {
        // ignore
      }
      toast.success("You have joined the organization")
      // Stays busy until the wallet page takes over, for the same reason the
      // onboarding steps do.
      router.push("/personal/wallet")
    } catch (error) {
      // Not on the staff list is a dead end, not a retry: pressing this again
      // asks the same question and gets the same answer.
      if (error instanceof ClaimError && error.isNotInvited) {
        const organization = state.kind === "ready" ? state.invite.organizationName : null
        router.push(
          organization
            ? `/join/not-found-invitation?organization=${encodeURIComponent(organization)}`
            : "/join/not-found-invitation"
        )
        return
      }

      toast.error(error instanceof Error ? error.message : "Could not accept this invitation")
      setIsClaiming(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] px-6 sm:px-10 py-12 rounded-[40px] shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-gray-200 flex flex-col items-center gap-8">
        <Image src="/logo.svg" alt="Dizburza" width={169} height={33} priority />

        {state.kind === "loading" ? (
          <p className="text-neutral-500 text-sm font-inter">Checking this invitation...</p>
        ) : null}

        {state.kind === "invalid" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-blue-950 text-2xl font-normal font-nohemi">Invitation unavailable</h1>
            <p className="text-neutral-500 text-sm font-inter">{state.message}</p>
            <p className="text-neutral-500 text-sm font-inter">
              Ask your organization to send you a new link.
            </p>
          </div>
        ) : null}

        {state.kind === "ready" ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <h1 className="text-blue-950 text-3xl font-normal font-nohemi">
                Join {state.invite.organizationName}
              </h1>
              <p className="text-neutral-500 text-sm font-semibold font-inter max-w-80">
                You have been invited to join {state.invite.organizationName} on Dizburza. Accepting
                links your account to the record they have already set up for you.
              </p>
            </div>

            {/* Not gated on the wallet's connection status: with no stored
                wallet thirdweb stays at "unknown", which left this permanently
                disabled for exactly the people the link is for. */}
            <OnboardingButton
              className="self-stretch justify-center"
              onClick={handleAccept}
              disabled={isClaiming}
            >
              {(() => {
                if (!isClaiming) {
                  return account?.address ? "Accept invitation" : "Sign in to accept"
                }
                // Busy covers being sent away to sign in as well as the claim
                // itself, so it must not claim to be joining when it is not.
                return account?.address ? "Joining..." : "Please wait..."
              })()}
            </OnboardingButton>
          </>
        ) : null}
      </div>
    </div>
  )
}
