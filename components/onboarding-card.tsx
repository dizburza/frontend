import { Card } from "@/components/ui/card"
import type React from "react"

interface OnboardingCardProps {
  children: React.ReactNode
}

export default function OnboardingCard({ children }: Readonly<OnboardingCardProps>) {
  return <Card className="w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-8 shadow-xl shadow-[#454ADE24]">{children}</Card>
}
