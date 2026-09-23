"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { OnboardingShell } from "@/components/organization-setup/onboarding-shell"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import {
  NotFoundInvitationModal,
  type InvitationProblem,
} from "@/components/organization-setup/not-found-invitation-modal"
import { FieldInput } from "@/components/organization-setup/field-input"
import { fetchSessionProfile } from "@/lib/session"
import { checkUsernameAvailable, updateOwnProfile } from "@/lib/api/profile"
import { ClaimError, claimInvite, fetchInvite } from "@/lib/api/invite"

type Details = {
  surname: string
  firstname: string
  email: string
  phoneNumber: string
  username: string
}

const empty: Details = {
  surname: "",
  firstname: "",
  email: "",
  phoneNumber: "",
  username: "",
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,40}$/i

const usernameMessage = (state: "idle" | "checking" | "available" | "taken" | "invalid") => {
  if (state === "checking") return "Checking..."
  if (state === "available") return "Available"
  if (state === "invalid") return "3-40 letters, numbers or underscores"
  return "How colleagues find you to send money."
}

/**
 * The details form for someone joining by invite link, kept separate from
 * the organization-creation onboarding it started as a branch of. The token
 * lives in the URL rather than sessionStorage, so this page never has a path
 * back into the creator's flow: there is nothing here to redirect to.
 */
export default function JoinDetailsPage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = params.token

  const [details, setDetails] = useState<Details>(empty)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [invitationProblem, setInvitationProblem] = useState<InvitationProblem | null>(null)
  // What was on the profile when the page loaded, so an untouched username is
  // not resubmitted as a change.
  const [initialUsername, setInitialUsername] = useState("")
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle")

  // Only the name is fetched. The page is already in its joining shape, so
  // this fills a gap rather than changing the layout.
  const [invitedTo, setInvitedTo] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    void fetchInvite(token)
      .then((invite) => {
        if (live) setInvitedTo(invite.organizationName)
      })
      .catch(() => {
        // The link is dead, which the claim on submit will report properly.
        // Nothing to say here beyond leaving the name out.
      })

    return () => {
      live = false
    }
  }, [token])

  // Signing in already made the account, so anything it knows is prefilled and
  // someone coming back to edit sees what they entered rather than blanks.
  useEffect(() => {
    let live = true

    void fetchSessionProfile().then((profile) => {
      if (!live) return
      if (profile) {
        setDetails({
          surname: profile.surname ?? "",
          firstname: profile.firstname ?? "",
          email: profile.email ?? "",
          phoneNumber: profile.phoneNumber ?? "",
          username: profile.username ?? "",
        })
        setInitialUsername(profile.username ?? "")
      }
      setIsLoading(false)
    })

    return () => {
      live = false
    }
  }, [])

  /**
   * Debounced, because this is a directory lookup with a rate limit and typing
   * a username would otherwise spend the whole budget in one field.
   */
  useEffect(() => {
    const candidate = details.username.trim()

    if (!candidate || candidate.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameState("idle")
      return
    }
    if (!USERNAME_PATTERN.test(candidate)) {
      setUsernameState("invalid")
      return
    }

    setUsernameState("checking")
    let live = true

    const timer = setTimeout(() => {
      void checkUsernameAvailable(candidate).then((available) => {
        if (live) setUsernameState(available ? "available" : "taken")
      })
    }, 400)

    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [details.username, initialUsername])

  const isComplete =
    Boolean(details.surname.trim()) &&
    Boolean(details.firstname.trim()) &&
    Boolean(details.email.trim()) &&
    Boolean(details.phoneNumber.trim()) &&
    USERNAME_PATTERN.test(details.username.trim()) &&
    usernameState !== "taken" &&
    usernameState !== "checking"

  /**
   * Claims the invitation the details were just filled in for.
   *
   * Every outcome lands somewhere final. Neither dead end here is a retryable
   * error: they stay true regardless of how many times the same request is
   * sent, so both go to a page that says so rather than back to a button.
   */
  const finishInvitation = async () => {
    try {
      await claimInvite(token)
      toast.success("You have joined the organization")
      router.push("/personal/wallet")
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not accept this invitation"

      // Not on the staff list, which their employer has to fix.
      if (error instanceof ClaimError && error.isNotInvited) {
        const invite = await fetchInvite(token).catch(() => null)
        setInvitationProblem({ reason: "not-invited", organization: invite?.organizationName ?? null })
        setIsSubmitting(false)
        return
      }

      // Someone else already completed this same row, which will not change
      // by trying again with the same email either.
      if (error instanceof ClaimError && error.isAlreadyClaimed) {
        setInvitationProblem({ reason: "already-claimed" })
        setIsSubmitting(false)
        return
      }

      // Anything else may succeed later, so the details are saved and they
      // stay here with the reason.
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  const handleContinue = async () => {
    if (isSubmitting) return

    const surname = details.surname.trim()
    const firstname = details.firstname.trim()
    const email = details.email.trim()
    const phoneNumber = details.phoneNumber.trim()

    if (!firstname) {
      toast.error("Enter your first name")
      return
    }
    if (!surname) {
      toast.error("Enter your surname")
      return
    }
    if (!email) {
      toast.error("Enter your email")
      return
    }
    if (!phoneNumber) {
      toast.error("Enter your phone number")
      return
    }

    const username = details.username.trim()
    if (!username) {
      toast.error("Enter a username")
      return
    }
    if (!USERNAME_PATTERN.test(username)) {
      toast.error("Usernames are 3-40 letters, numbers or underscores")
      return
    }
    if (usernameState === "taken") {
      toast.error("That username is taken")
      return
    }

    const usernameChanged = username.toLowerCase() !== initialUsername.toLowerCase()

    try {
      setIsSubmitting(true)
      await updateOwnProfile({
        surname,
        firstname,
        email,
        phoneNumber,
        // Only when it actually changed: the route would accept it either way,
        // since it excludes the caller from the collision check.
        ...(usernameChanged ? { username } : {}),
      })

      // Left busy on purpose. The next page replacing this one ends it, and
      // clearing it here would show a ready button while the route is still
      // loading, which reads as a failed press.
      await finishInvitation()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save your details"
      // The index refused it between the check and the save, so the field is
      // marked rather than only announced.
      if (/username/i.test(message)) setUsernameState("taken")
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  const joiningWhom = invitedTo ?? "your organization"

  return (
    <OnboardingShell
      image="/images/your-details-image.jpg"
      headline={invitedTo ? `Join ${invitedTo}` : "Join your team"}
      blurb={
        <>
          You have been invited to {joiningWhom} on Dizburza.
          <br />
          Tell us who you are and we will add you to their team.
        </>
      }
    >
      <div className="self-stretch flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">Your Details</div>
          <div className="w-96 text-center text-neutral-500 text-sm font-semibold font-inter">
            Confirm your details to finish joining {joiningWhom}.
          </div>
        </div>

        <div className="px-10 py-5 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-indigo-50">
          <div className="w-96 flex flex-col items-center gap-6">
            <div className="self-stretch flex flex-col items-start gap-3">
              <FieldInput
                label="First Name"
                placeholder="Enter your first name"
                icon="people"
                value={details.firstname}
                onChange={(v) => setDetails((d) => ({ ...d, firstname: v }))}
              />

              <FieldInput
                label="Surname"
                placeholder="Enter your surname"
                icon="people"
                value={details.surname}
                onChange={(v) => setDetails((d) => ({ ...d, surname: v }))}
              />

              <FieldInput
                label="Email"
                placeholder="Enter your email"
                icon="sms"
                type="email"
                value={details.email}
                onChange={(v) => setDetails((d) => ({ ...d, email: v }))}
              />

              <FieldInput
                label="Phone Number"
                placeholder="e.g +234 801 234 5678"
                icon="solar_phone-linear"
                type="tel"
                value={details.phoneNumber}
                onChange={(v) => setDetails((d) => ({ ...d, phoneNumber: v }))}
              />

              <div className="w-full">
                <FieldInput
                  label="Username"
                  placeholder="e.g ada_okafor"
                  icon="people"
                  value={details.username}
                  error={usernameState === "taken" ? "That username is taken" : undefined}
                  onChange={(v) => setDetails((d) => ({ ...d, username: v }))}
                />
                {usernameState !== "taken" ? (
                  <p
                    className={`mt-1 text-xs font-inter ${
                      usernameState === "available" ? "text-green-600" : "text-neutral-500"
                    }`}
                  >
                    {usernameMessage(usernameState)}
                  </p>
                ) : null}
              </div>
            </div>

            <OnboardingButton
              className="self-stretch justify-center"
              onClick={handleContinue}
              disabled={isSubmitting || isLoading || !isComplete}
            >
              {(() => {
                if (isSubmitting) return "Joining..."
                return invitedTo ? `Join ${invitedTo}` : "Join"
              })()}
            </OnboardingButton>
          </div>
        </div>
      </div>

      {invitationProblem ? (
        <NotFoundInvitationModal problem={invitationProblem} onClose={() => setInvitationProblem(null)} />
      ) : null}
    </OnboardingShell>
  )
}
