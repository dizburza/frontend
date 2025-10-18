"use client"

import { useState } from "react"
import OnboardingCard from "@/components/onboarding-card"
import AccountTypeOption from "@/components/account-type"
import Button from "@/components/button"

export default function AccountTypePage() {
  const [selected, setSelected] = useState<"personal" | "business" | null>(null)

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

      <Button disabled={!selected} className="w-full">
        Continue
      </Button>
    </OnboardingCard>
  )
}
