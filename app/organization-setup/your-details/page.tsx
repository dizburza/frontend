"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { OnboardingShell } from "@/components/organization-setup/onboarding-shell"
import { OnboardingSteps } from "@/components/organization-setup/onboarding-steps"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import { FieldInput } from "@/components/organization-setup/field-input"
import { FieldSwitch } from "@/components/organization-setup/field-switch"
import { fetchSessionProfile } from "@/lib/session"
import { checkUsernameAvailable, updateOwnProfile } from "@/lib/api/profile"
import { ClaimError, claimInvite, fetchInvite } from "@/lib/api/invite"
import { useToken } from "@/hooks/useToken"
import {
  CREATOR_EMPLOYMENT_KEY,
  emptyCreatorEmployment,
  readCreatorEmployment,
  type CreatorEmployment,
} from "@/lib/creator-employment"

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

export default function YourDetailsPage() {
  const router = useRouter()
  const { symbol } = useToken()

  const [details, setDetails] = useState<Details>(empty)
  const [employment, setEmployment] = useState<CreatorEmployment>(emptyCreatorEmployment)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // What was on the profile when the page loaded, so an untouched username is
  // not resubmitted as a change.
  const [initialUsername, setInitialUsername] = useState("")
  const [usernameState, setUsernameState] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle")
  /**
   * Whether this is an invitation is known from storage on the first render,
   * so the layout is decided before paint. Waiting for the organization's name
   * to arrive would show the three step version first and then swap it, which
   * is the flash.
   *
   * Read in an initializer rather than an effect because effects run after the
   * first paint, which is exactly what has to be avoided here. Guarded for the
   * server render, where there is no sessionStorage at all.
   */
  const [inviteToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    try {
      return sessionStorage.getItem("pendingInvite")
    } catch {
      return null
    }
  })

  // Only the name is fetched. The page is already in its joining shape by the
  // time this lands, so it fills a gap rather than changing the layout.
  const [invitedTo, setInvitedTo] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteToken) return

    let live = true
    void fetchInvite(inviteToken)
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
  }, [inviteToken])

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

    const saved = readCreatorEmployment()
    if (saved) setEmployment(saved)

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

  // Decided by the token, not the name, so the layout never changes shape once
  // the name arrives. Until it does, the copy reads without one.
  const isJoining = Boolean(inviteToken)

  const employmentComplete =
    !employment.addToPayroll ||
    (Boolean(employment.jobRole.trim()) && Number.parseFloat(employment.salary) > 0)

  const isComplete =
    Boolean(details.surname.trim()) &&
    Boolean(details.firstname.trim()) &&
    Boolean(details.email.trim()) &&
    Boolean(details.phoneNumber.trim()) &&
    USERNAME_PATTERN.test(details.username.trim()) &&
    usernameState !== "taken" &&
    usernameState !== "checking" &&
    (isJoining || employmentComplete)

  /**
   * Claims the invitation the details were just filled in for.
   *
   * Every outcome lands somewhere final. Not being on the staff list is not a
   * retryable error: it stays true until the employer adds them, so it goes to
   * a page that says so rather than back to a button.
   */
  const finishInvitation = async (token: string) => {
    const clearToken = () => {
      try {
        sessionStorage.removeItem("pendingInvite")
      } catch {
        // ignore
      }
    }

    try {
      await claimInvite(token)
      clearToken()
      toast.success("You have joined the organization")
      router.push("/personal/wallet")
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not accept this invitation"

      // Not on the staff list, which their employer has to fix. The token is
      // dropped so nothing tries again on their behalf.
      if (error instanceof ClaimError && error.isNotInvited) {
        clearToken()
        const invite = await fetchInvite(token).catch(() => null)
        const organization = invite?.organizationName

        router.push(
          organization
            ? `/join/not-found-invitation?organization=${encodeURIComponent(organization)}`
            : "/join/not-found-invitation"
        )
        return
      }

      // Anything else may succeed later, so the details are saved, the token is
      // kept, and they stay here with the reason.
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

    // Only asked of a creator, and only when they said they are on the payroll.
    if (!isJoining && employment.addToPayroll) {
      if (!employment.jobRole.trim()) {
        toast.error("Enter your job role")
        return
      }
      if (!(Number.parseFloat(employment.salary) > 0)) {
        toast.error("Enter your salary")
        return
      }
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

      if (!isJoining) {
        try {
          localStorage.setItem(
            CREATOR_EMPLOYMENT_KEY,
            JSON.stringify({
              addToPayroll: employment.addToPayroll,
              jobRole: employment.jobRole.trim(),
              salary: employment.salary.trim(),
            })
          )
        } catch {
          // Without this the creator simply is not added to payroll, which the
          // Employees page can fix afterwards. Not worth failing the step for.
        }
      }

      let pendingInvite: string | null = null
      try {
        pendingInvite = sessionStorage.getItem("pendingInvite")
      } catch {
        // ignore
      }

      // Left busy on purpose. The next page replacing this one ends it, and
      // clearing it here would show a ready button while the route is still
      // loading, which reads as a failed press.
      if (pendingInvite) {
        await finishInvitation(pendingInvite)
        return
      }

      router.push("/organization-setup/organization-details")
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
      headline={isJoining ? (invitedTo ? `Join ${invitedTo}` : "Join your team") : undefined}
      blurb={
        isJoining ? (
          <>
            You have been invited to {joiningWhom} on Dizburza.
            <br />
            Tell us who you are and we will add you to their team.
          </>
        ) : undefined
      }
    >
      {/* No step rail when joining: there are no three steps to be one of,
          since an invitee is not creating an organization. */}
      {isJoining ? null : <OnboardingSteps active={1} />}

      <div className="self-stretch flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">Your Details</div>
          <div className="w-96 text-center text-neutral-500 text-sm font-semibold font-inter">
            {isJoining
              ? `Confirm your details to finish joining ${joiningWhom}.`
              : "Tell us who you are before we set up your organization."}
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

              {/* Never shown to an invitee: their terms were set by whoever
                  added them, and letting them type their own salary here is
                  exactly what the claim path refuses to allow. */}
              {isJoining ? null : (
                <div className="flex w-full flex-col gap-3 rounded-lg border border-indigo-100 bg-slate-50/60 p-4">
                  <FieldSwitch
                    label="Add me to the employee list"
                    hint="Counts you on payroll so you can be paid like anyone else."
                    checked={employment.addToPayroll}
                    onChange={(checked) =>
                      setEmployment((e) => ({ ...e, addToPayroll: checked }))
                    }
                  />

                  {employment.addToPayroll ? (
                    <>
                      <FieldInput
                        label="Job Role"
                        placeholder="e.g HR Manager"
                        icon="briefcase"
                        value={employment.jobRole}
                        onChange={(v) => setEmployment((e) => ({ ...e, jobRole: v }))}
                      />
                      <FieldInput
                        label={`Salary${symbol ? ` (${symbol})` : ""}`}
                        placeholder="e.g 500000"
                        icon="briefcase"
                        type="number"
                        value={employment.salary}
                        onChange={(v) => setEmployment((e) => ({ ...e, salary: v }))}
                      />
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <OnboardingButton
              className="self-stretch justify-center"
              onClick={handleContinue}
              disabled={isSubmitting || isLoading || !isComplete}
            >
              {(() => {
                if (isSubmitting) return isJoining ? "Joining..." : "Saving..."
                if (!isJoining) return "Continue"
                return invitedTo ? `Join ${invitedTo}` : "Join"
              })()}
            </OnboardingButton>
          </div>
        </div>
      </div>
    </OnboardingShell>
  )
}
