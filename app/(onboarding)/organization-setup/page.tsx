"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OrganizationSetupPage() {
  const router = useRouter()

  const handleCreateOrganization = () => {
    // Navigate to organization dashboard
    router.push("/organization-setup/organization-details")
  }

  const handleJoinOrganization = () => {
    // Navigate to organization dashboard (in real app, might have different flow)
    router.push("/organization")
  }

  return (
    <Card className="w-full max-w-lg border-gray-200 shadow-lg">
      <CardHeader className="text-center">
        <div className="text-sm text-[#31359E] mb-2">Welcome, TTO! 👋</div>
        <CardTitle className="text-2xl font-bold text-[1D1F5D]">Set your organization up on Dizburza.</CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          You can create a new organization for your business or join an existing one if you&apos;ve been invited.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create New Organization Button */}
        <Button 
          onClick={handleCreateOrganization}
          className="w-full bg-blue-600 shadow-md shadow-[#8286E9] hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
        >
          Create New Organization
        </Button>

        {/* OR Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-500 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Join Existing Organization Button */}
        <Button
          onClick={handleJoinOrganization}
          variant="outline"
          className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-2 rounded-lg bg-transparent"
        >
          Join Existing Organization
        </Button>

        {/* Terms & Privacy */}
        <p className="text-center text-sm text-gray-600 mt-6">
          By creating an account, I agree to the{" "}
          <Link href="/terms" className="text-blue-600 hover:underline font-medium">
            Terms & Privacy Policy
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
