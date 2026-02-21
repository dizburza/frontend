"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import OnboardingCard from "@/components/onboarding-card"
import AccountTypeOption from "@/components/account-type"
import Button from "@/components/button"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"

export default function AccountTypePage() {
  const [selected, setSelected] = useState<"personal" | "business" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { showLoading, hideLoading } = useGlobalLoading()

  const handleContinue = async () => {
    if (!selected || isLoading) return

    try {
      setIsLoading(true)
      showLoading("Saving account type...")

      // Store account type in localStorage
      localStorage.setItem("accountType", selected)

      toast.success("Account type saved")

      // Navigate to next step based on account type
      if (selected === "personal") {
        router.push("/setup-profile")
      } else {
        router.push("/organization-setup")
      }
    } catch {
      toast.error("Could not continue. Please try again.")
    } finally {
      hideLoading()
      setIsLoading(false)
    }
  }

  return (
    <OnboardingCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Select your account type</h1>
        <p className="text-gray-600 text-sm">Would you like to use Dizburza for yourself or your business?</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <AccountTypeOption
          type="personal"
          title="Personal"
          description="Manage your personal wallet, send and receive funds, and track transactions seamlessly."
          selected={selected === "personal"}
          onChange={() => setSelected("personal")}
        />
        <AccountTypeOption
          type="business"
          title="Business"
          description="Create an organization, manage payroll, and approve transactions with your team."
          selected={selected === "business"}
          onChange={() => setSelected("business")}
        />
      </div>

      <Button disabled={!selected || isLoading} onClick={handleContinue} className="w-full bg-[#454ADE]">
        {isLoading ? "Continuing..." : "Continue"}
      </Button>
    </OnboardingCard>
  )
}
