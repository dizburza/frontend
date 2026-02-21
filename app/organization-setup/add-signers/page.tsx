"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import StepIndicator from "@/components/step-indicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { mockSignerSearchResults } from "@/lib/static/mock-data/signers"
import type { Signer } from "@/lib/types/payloads"
import { toast } from "sonner"

export default function AddSignersPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [numSigners, setNumSigners] = useState(0)
  const [quorum, setQuorum] = useState(0)
  const [signerRole, setSignerRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [signers, setSigners] = useState<Signer[]>([])

  const steps = [
    { number: 1, title: "Organization Details", subtitle: "", completed: true, active: false },
    { number: 2, title: "Organization Profile", subtitle: "", completed: true, active: false },
    { number: 3, title: "Add Signers", subtitle: "", completed: false, active: true },
  ]

  const mockSearchResults: Signer[] = mockSignerSearchResults

  const handleAddSigner = (signer: Signer) => {
    if (!signers.some((s) => s.id === signer.id)) {
      setSigners([...signers, signer])
    }
  }

  const handleRemoveSigner = (id: string) => {
    setSigners(signers.filter((s) => s.id !== id))
  }

  const handleFinishSetup = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      // Store signers data
      localStorage.setItem("signers", JSON.stringify(signers))
      localStorage.setItem("quorum", quorum.toString())
      localStorage.setItem("accountType", "organization")

      toast.success("Organization setup completed")

      // Navigate to organization dashboard
      router.push("/organization")
    } catch (error) {
      console.error(error)
      toast.error("Could not complete setup. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/organization-setup/organization-profile")
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] ">
      {/* Left sidebar */}
      <div className="w-1/2 bg-[#ECEDFC] p-12 flex flex-col justify-center">
        <StepIndicator steps={steps} />
      </div>

      {/* Right content */}
      <div className="w-1/2 flex items-center justify-start p-12">
        <Card className="w-full max-w-md relative right-44 rounded-[40px] ">
          <div className="p-8 text-start">
            <h2 className="text-2xl font-bold text-center text-[#1D1F5D] mb-2">Add Signers</h2>
            <p className="text-gray-600 text-center text-sm mb-8">
              Creating an organization account makes you a signer. Please add your details and those of other signers to
              continue.
            </p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 ">
                <div>
                  <label htmlFor="numSigners" className="block text-sm font-medium text-[#69696C] mb-2">
                    Number of signers
                  </label>
                  <div className="flex">
                    
                    <input
                      id="numSigners"
                      type="number"
                      value={numSigners}
                      onChange={(e) => setNumSigners(Number.parseInt(e.target.value) || 0)}
                      className=" text-center w-full items-center border border-gray-300 rounded-lg h-[40px] px-2 focus:outline-none"
                    />
                   
                  </div>
                </div>

                <div>
                  <label htmlFor="quorum" className="block text-sm font-medium text-[#69696C] mb-2">
                    Set Quorum <span className="text-gray-400 cursor-help">ℹ</span>
                  </label>
                  <div className="">
                
                    <input
                      id="quorum"
                      type="number"
                      value={quorum}
                      onChange={(e) => setQuorum(Number.parseInt(e.target.value) || 0)}
                      className="flex-1 text-center w-full focus:outline-none flex items-center border border-gray-300 rounded-lg px-2 h-[40px]"
                    />
                   
                   
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="signerRole" className="block text-sm text-start font-medium text-[#69696C] mb-2">
                  Signer&apos;s role
                </label>
                <Input
                  id="signerRole"
                  type="text"
                  placeholder="Enter role"
                  value={signerRole}
                  onChange={(e) => setSignerRole(e.target.value)}
                  className="h-[40px]"
                />
              </div>

              <div>
                <label htmlFor="signerUsernameSearch" className="block text-sm font-medium text-[#69696C] mb-2">
                  Search signer&apos;s username
                </label>
                <div className="relative">
                  <Input
                    id="signerUsernameSearch"
                    type="text"
                    placeholder="Search username"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-[40px]"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</button>
                </div>

                {/* Search results */}
                {searchQuery && (
                  <div className="mt-2 space-y-2 max-h-24 overflow-y-auto">
                    {mockSearchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {result.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{result.name}</p>
                            <p className="text-xs text-gray-500">{result.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddSigner(result)}
                          className="text-red-500 hover:text-red-700 text-lg"
                        >
                          ⊕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Added signers */}
                {signers.length > 0 && (
                  <div className="mt-2 space-y-2 overflow-y-auto max-h-24 ">
                    {signers.map((signer) => (
                      <div
                        key={signer.id}
                        className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {signer.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                            <p className="text-xs text-gray-500">{signer.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSigner(signer.id)}
                          className="text-red-500 hover:text-red-700 text-lg"
                        >
                          ⊗
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button
                  disabled={isLoading}
                  onClick={handleFinishSetup}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  {isLoading ? "Finishing..." : "Finish set up"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
