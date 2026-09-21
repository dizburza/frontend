"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"

/**
 * Where someone lands when the invitation link worked but no record was waiting
 * for their email.
 *
 * Deliberately a dead end with no retry: the answer will not change until their
 * employer adds them, so a button here would only let someone hold it down
 * against the server. The organization's name is shown when we have it, because
 * knowing who to contact is the whole point of the page.
 */
function NotFoundInvitationContent() {
  const params = useSearchParams()
  const organization = params.get("organization")

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[520px] px-6 sm:px-10 py-12 rounded-[40px] shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-gray-200 flex flex-col items-center gap-8">
        <Image src="/logo.svg" alt="Dizburza" width={169} height={33} priority />

        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-blue-950 text-2xl sm:text-3xl font-normal font-nohemi">
            You are not on the staff list yet
          </h1>
          {/* What was matched on is not named. Saying it was the email turns a
              dead end into a guessing game, with someone trying addresses until
              one lands. */}
          <p className="text-neutral-500 text-sm font-inter max-w-80">
            {organization
              ? `${organization} has not added you to their records yet, so there is nothing to join.`
              : "This organization has not added you to their records yet, so there is nothing to join."}
          </p>
          <p className="text-neutral-500 text-sm font-inter max-w-80">
            Ask whoever handles payroll to add you, then open the invitation link again.
          </p>
        </div>

        <Link href="/" className="self-stretch">
          <OnboardingButton variant="secondary" className="w-full justify-center">
            Back to homepage
          </OnboardingButton>
        </Link>
      </div>
    </div>
  )
}

export default function NotFoundInvitationPage() {
  return (
    <Suspense fallback={null}>
      <NotFoundInvitationContent />
    </Suspense>
  )
}
