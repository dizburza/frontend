"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useActiveAccount } from "thirdweb/react"
import { OnboardingShell } from "@/components/organization-setup/onboarding-shell"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import { fetchInvite, type InviteDetails } from "@/lib/api/invite"

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
  const [isLeaving, setIsLeaving] = useState(false)

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

  // Always routed through the details form rather than claimed straight from
  // here, even when the profile already looks complete. That form is the only
  // place to fix a typo'd email or name, and the claim itself only ever
  // matches on whatever the session already holds, so a mistake made once has
  // no other way back short of this detour.
  const handleAccept = () => {
    if (isLeaving) return
    setIsLeaving(true)

    if (!account?.address) {
      // /sign-in has no room for the token in its own URL, so it rides along
      // in session storage and useRedirectOnFirstConnect reads it back once
      // the session exists, to send them straight to the details form.
      try {
        sessionStorage.setItem("pendingInvite", token)
      } catch {
        // ignore
      }
      router.push("/sign-in")
      return
    }

    router.push(`/join/${token}/details`)
  }

  const organizationName = state.kind === "ready" ? state.invite.organizationName : null

  return (
    <OnboardingShell
      image="/images/your-details-image.jpg"
      headline={organizationName ? `Join ${organizationName}` : "Join your team"}
      blurb={
        <>
          You have been invited to {organizationName ?? "an organization"} on Dizburza.
          <br />
          Accepting links your account to the record they have already set up for you.
        </>
      }
    >
      <div className="self-stretch flex flex-col items-center gap-4">
        <div className="px-10 py-5 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-indigo-50">
          <div className="w-96 flex flex-col items-center gap-6">
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
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">
                    Accept invitation
                  </div>
                  <p className="w-96 text-center text-neutral-500 text-sm font-semibold font-inter">
                    Confirm to join {state.invite.organizationName} and link this account to the
                    record they have already set up for you.
                  </p>
                </div>

                {/* Not gated on the wallet's connection status: with no stored
                    wallet thirdweb stays at "unknown", which left this permanently
                    disabled for exactly the people the link is for. */}
                <OnboardingButton
                  className="self-stretch justify-center"
                  onClick={handleAccept}
                  disabled={isLeaving}
                >
                  {(() => {
                    if (isLeaving) return "Please wait..."
                    return account?.address ? "Accept invitation" : "Sign in to accept"
                  })()}
                </OnboardingButton>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </OnboardingShell>
  )
}
