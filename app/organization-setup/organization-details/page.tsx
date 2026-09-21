"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { OnboardingShell } from "@/components/organization-setup/onboarding-shell"
import { OnboardingSteps } from "@/components/organization-setup/onboarding-steps"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import { FieldInput } from "@/components/organization-setup/field-input"
import { FieldSelect } from "@/components/organization-setup/field-select"
import { FieldCounter } from "@/components/organization-setup/field-counter"
import { FieldUpload } from "@/components/organization-setup/field-upload"

const INDUSTRIES = [
  "Information Technology",
  "Finance",
  "Healthcare",
  "Agriculture",
  "Education",
  "Media",
  "Industrial Services",
  "Transportation",
  "Tourism",
  "Legal Services",
  "Life Sciences",
  "Manufacturing",
  "Entertainment",
  "Hospitality",
  "Social Impact",
  "Logistics",
]

const COUNTRIES = ["Nigeria", "United States", "United Kingdom"]

type OrgDetails = {
  organizationName: string
  country: string
  industry: string
  numberOfSigners: number
  quorum: number
}

const emptyDetails: OrgDetails = {
  organizationName: "",
  country: "",
  industry: "",
  numberOfSigners: 0,
  quorum: 0,
}

export default function OrganizationDetailsPage() {
  const router = useRouter()
  const [details, setDetails] = useState<OrgDetails>(emptyDetails)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("orgDetails")
    if (!raw) return
    try {
      setDetails({ ...emptyDetails, ...JSON.parse(raw) })
    } catch {
      // ignore malformed cache
    }
  }, [])

  // Mirrors the checks below, so the button can say up front whether pressing
  // it will do anything. The toasts stay: they name which field is wrong,
  // which a disabled button cannot.
  const isComplete =
    Boolean(details.organizationName.trim()) &&
    Boolean(details.country) &&
    Boolean(details.industry) &&
    details.numberOfSigners >= 1 &&
    details.quorum >= 1 &&
    details.quorum <= details.numberOfSigners

  const handleBack = () => {
    localStorage.setItem("orgDetails", JSON.stringify(details))
    router.push("/organization-setup/your-details")
  }

  const handleContinue = () => {
    if (isNavigating) return

    if (!details.organizationName.trim()) {
      toast.error("Enter your organization name")
      return
    }
    if (!details.country) {
      toast.error("Select a country")
      return
    }
    if (!details.industry) {
      toast.error("Select an industry")
      return
    }
    if (details.numberOfSigners < 1) {
      toast.error("Number of signers must be at least 1")
      return
    }
    if (details.quorum < 1 || details.quorum > details.numberOfSigners) {
      toast.error("Quorum must be at least 1 and not more than the number of signers")
      return
    }

    localStorage.setItem("orgDetails", JSON.stringify(details))
    if (logoFile) {
      // Held in memory only. Uploaded once a storage endpoint exists; nothing
      // here reads the file back after this step.
      localStorage.setItem("orgLogoName", logoFile.name)
    }

    // Never cleared: the next page replacing this one is what ends it. Turning
    // it off after the push would show a ready button again while the route is
    // still loading, which is the moment someone presses it twice.
    setIsNavigating(true)
    router.push("/organization-setup/organization-registration")
  }

  return (
    <OnboardingShell image="/images/organization-1-image.jpg">
      <OnboardingSteps active={2} />

      <div className="self-stretch flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">Organization Details</div>
          <div className="w-96 text-center text-neutral-500 text-sm font-semibold font-inter">
            Let&rsquo;s start with your organization&rsquo;s basic details.
          </div>
        </div>

        <div className="px-10 py-5 rounded-[20px] outline outline-1 outline-offset-[-1px] outline-indigo-50">
          <div className="w-96 flex flex-col items-center gap-6">
            <div className="self-stretch flex flex-col items-start gap-3">
              <FieldInput
                label="Organization Name"
                placeholder="Enter organization name"
                icon="people"
                value={details.organizationName}
                onChange={(v) => setDetails((d) => ({ ...d, organizationName: v }))}
              />

              <FieldSelect
                label="Country"
                placeholder="Select country"
                icon="global"
                value={details.country}
                options={COUNTRIES}
                onChange={(v) => setDetails((d) => ({ ...d, country: v }))}
              />

              <FieldSelect
                label="Industry"
                placeholder="Select industry"
                icon="briefcase"
                value={details.industry}
                options={INDUSTRIES}
                onChange={(v) => setDetails((d) => ({ ...d, industry: v }))}
              />

              <div className="self-stretch flex justify-between items-start gap-4">
                <FieldCounter
                  label="Number of signers"
                  value={details.numberOfSigners}
                  min={1}
                  onChange={(v) => setDetails((d) => ({ ...d, numberOfSigners: v }))}
                />
                <FieldCounter
                  label="Set Quorum"
                  value={details.quorum}
                  min={0}
                  hint="How many signers must approve before payroll can execute"
                  onChange={(v) => setDetails((d) => ({ ...d, quorum: v }))}
                />
              </div>

              <FieldUpload label="Upload Company Logo" onFileSelect={setLogoFile} />
            </div>

            <div className="self-stretch flex items-start gap-4">
              <OnboardingButton
                variant="secondary"
                className="flex-1"
                onClick={handleBack}
                disabled={isNavigating}
              >
                Back
              </OnboardingButton>
              <OnboardingButton
                className="flex-1"
                onClick={handleContinue}
                disabled={!isComplete || isNavigating}
              >
                {isNavigating ? "Please wait..." : "Continue"}
              </OnboardingButton>
            </div>
          </div>
        </div>
      </div>
    </OnboardingShell>
  )
}
