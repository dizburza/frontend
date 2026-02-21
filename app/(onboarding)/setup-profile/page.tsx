"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FileUploadArea from "@/components/file-upload-area"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"

export default function SetupProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { showLoading, hideLoading } = useGlobalLoading()
  const [formData, setFormData] = useState({
    surname: "",
    firstName: "",
    email: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    try {
      setIsLoading(true)
      showLoading("Saving profile...")
      // Store profile data
      localStorage.setItem("userProfile", JSON.stringify(formData))
      toast.success("Profile saved")
      // Navigate to username selection
      router.push("/personal/wallet")
    } catch (error) {
      console.error(error)
      toast.error("Could not save profile. Please try again.")
    } finally {
      hideLoading()
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-lg my-8 border-gray-200 shadow-lg lg:px-16 rounded-[40px]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-[#1D1F5D] pt-4">Get You Started on Dizburza</CardTitle>
        <CardDescription className="text-gray-600 mt-1  text-balance px-2">
          In 1 minute, set up your personal account so others can easily find and send you funds.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Surname */}
          <div className="space-y-2">
            <Label htmlFor="surname" className="text-gray-700 font-medium">
              Surname
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">👤</span>
              <Input
                id="surname"
                name="surname"
                placeholder="Enter your surname"
                value={formData.surname}
                onChange={handleChange}
                className="pl-10 border-gray-300"
                required
              />
            </div>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-gray-700 font-medium">
              First Name
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">👤</span>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
                className="pl-10 border-gray-300"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">✉️</span>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="pl-10 border-gray-300"
                required
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-medium">Upload Profile Image</Label>
            <FileUploadArea />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>

          {/* Terms & Privacy */}
          <p className="text-center text-sm text-gray-600">
            By creating an account, I agree to the <br />
            <a href="/terms" className="text-blue-600 hover:underline font-medium">
              Terms & Privacy Policy
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
