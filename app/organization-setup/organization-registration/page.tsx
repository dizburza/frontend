"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useActiveAccount } from "thirdweb/react"
import { OnboardingShell } from "@/components/organization-setup/onboarding-shell"
import { OnboardingSteps } from "@/components/organization-setup/onboarding-steps"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import { FieldInput } from "@/components/organization-setup/field-input"
import { FieldSelect } from "@/components/organization-setup/field-select"
import { FieldUpload } from "@/components/organization-setup/field-upload"
import { VerifyEmailModal } from "@/components/organization-setup/verify-email-modal"
import { OrganizationReadyModal } from "@/components/organization-setup/organization-ready-modal"
import {
  checkOrganizationIdentifiers,
  createOrganizationRecord,
  sendOrganizationEmailVerification,
  verifyOrganizationEmail,
} from "@/lib/api/organization"
import { useCreateOrganization } from "@/hooks/useCreateOrganization"
import { fetchSessionProfile, hasSessionFor } from "@/lib/session"
import { getTokenConfig } from "@/lib/token"

const REGISTRATION_TYPES = ["CAC — Corporate Affairs Commission", "TIN — Tax Identification Number"]

type OrgDetails = {
  organizationName: string
  country: string
  industry: string
  numberOfSigners: number
  quorum: number
}

type OrgRegistration = {
  businessEmail: string
  registrationType: string
  registrationNumber: string
}

const emptyRegistration: OrgRegistration = {
  businessEmail: "",
  registrationType: "",
  registrationNumber: "",
}

type ModalStep = "none" | "verify" | "ready"

export default function OrganizationRegistrationPage() {
  const router = useRouter()
  const account = useActiveAccount()
  const { createOrganization } = useCreateOrganization()

  const [registration, setRegistration] = useState<OrgRegistration>(emptyRegistration)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [modalStep, setModalStep] = useState<ModalStep>("none")
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  // Survives the modal closing, unlike a toast, so the field that needs
  // changing is still marked when the form comes back.
  const [registrationNumberError, setRegistrationNumberError] = useState("")

  useEffect(() => {
    const raw = localStorage.getItem("orgRegistration")
    if (!raw) return
    try {
      setRegistration({ ...emptyRegistration, ...JSON.parse(raw) })
    } catch {
      // ignore malformed cache
    }
  }, [])

  const readOrgDetails = (): OrgDetails | null => {
    const raw = localStorage.getItem("orgDetails")
    if (!raw) return null
    try {
      return JSON.parse(raw) as OrgDetails
    } catch {
      return null
    }
  }

  const finishOrganizationSetup = async () => {
    // Every failure here drops the modal, because the thing to fix is on the
    // form behind it and the code has already been spent.
    if (!account?.address) {
      toast.error("Connect your wallet to continue")
      setModalStep("none")
      return
    }

    const orgDetails = readOrgDetails()
    if (!orgDetails) {
      toast.error("Organization details are missing. Please restart setup.")
      setModalStep("none")
      router.push("/organization-setup/organization-details")
      return
    }

    const name = orgDetails.organizationName.trim()
    const businessEmail = registration.businessEmail.trim()

    if (!hasSessionFor(account.address)) {
      toast.error("Your session has expired. Reconnect your wallet and sign in to continue.")
      setModalStep("none")
      return
    }

    setIsSubmitting(true)
    try {
      if (registration.registrationNumber) {
        const availability = await checkOrganizationIdentifiers({
          registrationNumber: registration.registrationNumber,
        })
        if (!availability.registrationNumberAvailable) {
          toast.error("That registration number is already registered to another organization")
          setRegistrationNumberError("Already registered to another organization")
          setModalStep("none")
          return
        }
      }

      // Their own name, collected in step 1. This is what the signers list
      // shows, so a literal here would label the owner "Creator" forever.
      const profile = await fetchSessionProfile()
      const creatorSigner = {
        address: account.address,
        name: profile?.fullName?.trim() || profile?.username || "Owner",
        role: "Owner",
      }

      const organizationHashPayload = {
        name,
        creatorAddress: account.address,
        signers: [creatorSigner.address],
        timestamp: Date.now(),
      }
      const rawHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(organizationHashPayload))
      )
      const organizationHash =
        "0x" + Array.from(new Uint8Array(rawHash)).map((b) => b.toString(16).padStart(2, "0")).join("")

      toast.message("Deploying organization contract...")
      const contractAddress = await createOrganization({
        organizationHash,
        targetSignerCount: BigInt(orgDetails.numberOfSigners),
        quorum: BigInt(orgDetails.quorum),
      })

      toast.message("Saving organization record...")
      const created = await createOrganizationRecord({
        name,
        contractAddress,
        organizationHash,
        creatorAddress: account.address,
        businessEmail,
        businessInfo: {
          registrationNumber: registration.registrationNumber || undefined,
          registrationType: registration.registrationType || undefined,
        },
        signers: [creatorSigner],
        quorum: orgDetails.quorum,
        metadata: { industry: orgDetails.industry },
        settings: {
          payrollCurrency: (await getTokenConfig()).symbol,
          timeZone: "Africa/Lagos",
        },
      })

      localStorage.setItem("accountType", "organization")
      try {
        localStorage.removeItem("orgDetails")
        localStorage.removeItem("orgRegistration")
        localStorage.removeItem("orgLogoName")
        // This says the caller has no organization, which was true a moment
        // ago. Left in place, the guard on /org/[slug] reads it and sends them
        // straight back here.
        localStorage.removeItem(`authCheck:${account.address}`)
      } catch {
        // ignore
      }

      setCreatedSlug(created.slug)
      setModalStep("ready")
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Could not complete setup. Please try again.")
      setModalStep("none")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isComplete =
    Boolean(registration.businessEmail.trim()) &&
    Boolean(registration.registrationType) &&
    Boolean(registration.registrationNumber.trim())

  const handleContinue = async () => {
    if (isSubmitting) return

    const orgDetails = readOrgDetails()
    if (!orgDetails) {
      toast.error("Organization details are missing. Please restart setup.")
      router.push("/organization-setup/organization-details")
      return
    }

    const businessEmail = registration.businessEmail.trim()
    if (!businessEmail) {
      toast.error("Enter your organization email")
      return
    }
    if (!registration.registrationType) {
      toast.error("Select a registration type")
      return
    }
    if (!registration.registrationNumber.trim()) {
      toast.error("Enter your registration number")
      return
    }

    localStorage.setItem("orgRegistration", JSON.stringify(registration))

    try {
      setIsSubmitting(true)

      // Before the code is sent, not after. A number taken by someone else is
      // the one failure that cannot be fixed from inside the verify modal, and
      // finding out there costs a code that cannot be reused.
      const availability = await checkOrganizationIdentifiers({
        registrationNumber: registration.registrationNumber,
      })
      if (!availability.registrationNumberAvailable) {
        toast.error("That registration number is already registered to another organization")
        setRegistrationNumberError("Already registered to another organization")
        return
      }

      await sendOrganizationEmailVerification(businessEmail)
      setModalStep("verify")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send verification code")
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Two failures that look the same to the modal and are not. A rejected code
   * is the modal's own business, so it stays open and says so. Anything after
   * the code is accepted belongs to the form behind it, so the modal closes
   * rather than leaving someone holding six verified digits and no way back.
   */
  const handleVerifyCode = async (code: string): Promise<boolean> => {
    setIsVerifying(true)

    try {
      await verifyOrganizationEmail(registration.businessEmail.trim(), code)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Incorrect or expired code")
      setIsVerifying(false)
      return false
    }

    // Deliberately still verifying. Creating the organization deploys a
    // contract, and releasing the modal when the code cleared would unlock it
    // for the slowest part of the flow, which is the part that must not be
    // clicked twice. Whatever happens next replaces the modal or closes it.
    try {
      await finishOrganizationSetup()
    } catch {
      // finishOrganizationSetup reports its own failure.
    }

    setIsVerifying(false)
    return true
  }

  const handleResendCode = async () => {
    try {
      await sendOrganizationEmailVerification(registration.businessEmail.trim())
      toast.success("A new code was sent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend code")
    }
  }

  const handleBack = () => {
    localStorage.setItem("orgRegistration", JSON.stringify(registration))
    router.push("/organization-setup/organization-details")
  }

  return (
    <OnboardingShell image="/images/organization-2-image.png">
      <OnboardingSteps active={3} />

      <div className="self-stretch flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">Organization Registration</div>
          <div className="w-96 text-center text-neutral-500 text-sm font-semibold font-inter">
            Provide your organization&rsquo;s registration details.
          </div>
        </div>

        <div className="px-10 py-5 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-indigo-50">
          <div className="w-96 flex flex-col items-center gap-6">
            <div className="self-stretch flex flex-col items-start gap-3">
              <FieldInput
                label="Organization Email"
                placeholder="Enter organization email"
                icon="sms"
                type="email"
                value={registration.businessEmail}
                onChange={(v) => setRegistration((r) => ({ ...r, businessEmail: v }))}
              />

              <FieldSelect
                label="Registration Type"
                placeholder="Select registration type"
                icon="note-2"
                value={registration.registrationType}
                options={REGISTRATION_TYPES}
                onChange={(v) => setRegistration((r) => ({ ...r, registrationType: v }))}
              />

              <FieldInput
                label="Registration Number"
                placeholder="e.g RC1234567"
                icon="document-text"
                value={registration.registrationNumber}
                error={registrationNumberError}
                onChange={(v) => {
                  setRegistrationNumberError("")
                  setRegistration((r) => ({ ...r, registrationNumber: v }))
                }}
              />

              <FieldUpload label="Upload Certificate" accept="image/png,image/jpeg" />
            </div>

            <div className="self-stretch flex items-start gap-4">
              <OnboardingButton variant="secondary" className="flex-1" onClick={handleBack} disabled={isSubmitting}>
                Back
              </OnboardingButton>
              <OnboardingButton
                className="flex-1"
                onClick={handleContinue}
                disabled={isSubmitting || !isComplete}
              >
                {isSubmitting ? "Please wait..." : "Continue"}
              </OnboardingButton>
            </div>
          </div>
        </div>
      </div>

      {modalStep === "verify" ? (
        <VerifyEmailModal
          email={registration.businessEmail}
          isVerifying={isVerifying}
          onVerify={handleVerifyCode}
          onResend={handleResendCode}
        />
      ) : null}

      {modalStep === "ready" ? (
        <OrganizationReadyModal onContinue={() => router.push(createdSlug ? `/org/${createdSlug}` : "/")} />
      ) : null}
    </OnboardingShell>
  )
}
