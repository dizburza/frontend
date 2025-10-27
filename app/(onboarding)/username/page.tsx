"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import OnboardingCard from "@/components/onboarding-card"
import Button from "@/components/button"

export default function UsernamePage() {
  const [username, setUsername] = useState("")
  const router = useRouter()

  const handleSubmit = () => {
    if (!username) return
    // Store username
    localStorage.setItem("username", username)
    // Navigate to personal dashboard
    router.push("/personal/wallet")
  }

  return (
    <OnboardingCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose your Dizburza username</h1>
        <p className="text-gray-600 text-sm">
          This name will appear on your profile
          <br />
          and payment activities
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-3">Username</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
          <input
            type="text"
            placeholder="Enter your Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!username} className="w-full mb-6">Submit</Button>

      <p className="text-center text-xs text-gray-600">
        By creating an account, I agree to the{" "}
        <a href="#" className="font-semibold hover:underline">
          Terms & Privacy Policy
        </a>
      </p>
    </OnboardingCard>
  )
}
