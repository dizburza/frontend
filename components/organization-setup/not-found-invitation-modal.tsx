"use client"

import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"

export type InvitationProblem =
  | { reason: "not-invited"; organization?: string | null }
  | { reason: "already-claimed" }

interface NotFoundInvitationModalProps {
  problem: InvitationProblem
  onClose: () => void
}

function content(problem: InvitationProblem) {
  if (problem.reason === "already-claimed") {
    return {
      heading: "This invitation has already been used",
      // Not a retryable error: the same email cannot claim it twice, so the
      // way out is fixing which account is signed in, not trying again.
      body: [
        "Someone has already completed registration with this email address.",
        "If that was you, sign in with that account instead. Otherwise, check the email on your profile and try again.",
      ],
    }
  }

  const { organization } = problem
  return {
    heading: "You are not on the staff list yet",
    // What was matched on is not named. Saying it was the email turns a dead
    // end into a guessing game, with someone trying addresses until one lands.
    body: [
      organization
        ? `${organization} has not added you to their records yet, so there is nothing to join.`
        : "This organization has not added you to their records yet, so there is nothing to join.",
      "Ask whoever handles payroll to add you, then open the invitation link again.",
    ],
  }
}

/**
 * Shown over whichever form was open when a claim came back as a dead end. No
 * retry button: neither reason changes by pressing the same request again, so
 * the X returns to the form rather than sending them anywhere else.
 * "Back to Home" is the one way out that actually leaves.
 */
export function NotFoundInvitationModal({ problem, onClose }: Readonly<NotFoundInvitationModalProps>) {
  const router = useRouter()
  const { heading, body } = content(problem)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[420px] px-6 sm:px-10 py-10 rounded-[24px] bg-white shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-gray-200 flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-14 items-center justify-center rounded-full bg-red-100 transition-colors hover:bg-red-200"
        >
          <X className="size-7 text-red-600" strokeWidth={3} />
        </button>

        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-blue-950 text-2xl font-normal font-nohemi">{heading}</h1>
          {body.map((line) => (
            <p key={line} className="text-neutral-500 text-sm font-inter max-w-80">
              {line}
            </p>
          ))}
        </div>

        <OnboardingButton className="w-full justify-center" onClick={() => router.push("/")}>
          Back to Home
        </OnboardingButton>
      </div>
    </div>
  )
}
