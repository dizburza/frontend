"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X } from "lucide-react"
import { updateOrganizationSigners } from "@/lib/localStorage"
import { mockSignerSearchResults } from "@/lib/static/mock-data/signers"
import type { Signer } from "@/lib/types/payloads"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"

interface AddSignersModalProps {
  isOpen: boolean
  onClose: () => void
  onSignersAdded?: () => void
}

export default function AddSignersModal({ isOpen, onClose, onSignersAdded }: Readonly<AddSignersModalProps>) {
  const [numSigners, setNumSigners] = useState(0)
  const [quorum, setQuorum] = useState(0)
  const [signerRole, setSignerRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [signers, setSigners] = useState<Signer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { showLoading, hideLoading } = useGlobalLoading()

  const mockSearchResults: Signer[] = mockSignerSearchResults

  const handleAddSigner = (signer: Signer) => {
    if (!signers.some((s) => s.id === signer.id)) {
      setSigners([...signers, signer])
    }
  }

  const handleRemoveSigner = (id: string) => {
    setSigners(signers.filter((s) => s.id !== id))
  }

  const handleSave = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)
      showLoading("Saving signers...")

      if (signers.length === 0) {
        toast.error("Please add at least one signer")
        return
      }

      // Convert to organization signer format
      const organizationSigners = signers.map((s) => ({
        id: s.id,
        username: s.username,
        fullName: s.name,
        role: s.role,
        status: "active",
        walletAddress: `0x${Math.random().toString(16).substring(2, 10)}...`,
      }))

      // Update organization signers in session
      updateOrganizationSigners(organizationSigners)

      toast.success("Signers saved")

      // Notify parent to refresh
      if (onSignersAdded) {
        onSignersAdded()
      }
      handleClose()
    } catch (error) {
      console.error(error)
      toast.error("Could not save signers. Please try again.")
    } finally {
      hideLoading()
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNumSigners(0)
    setQuorum(0)
    setSignerRole("")
    setSearchQuery("")
    setSigners([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Signers</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600 text-sm mb-8">
            Add authorized signers to your organization. Set the number of signers and quorum requirements.
          </p>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="numSigners" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of signers
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setNumSigners(Math.max(0, numSigners - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    id="numSigners"
                    type="number"
                    value={numSigners}
                    onChange={(e) => setNumSigners(Number.parseInt(e.target.value) || 0)}
                    className="flex-1 text-center border-0 focus:outline-none"
                  />
                  <button
                    onClick={() => setNumSigners(numSigners + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="quorum" className="block text-sm font-medium text-gray-700 mb-2">
                  Set Quorum <span className="text-gray-400 cursor-help">ℹ</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuorum(Math.max(0, quorum - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    id="quorum"
                    type="number"
                    value={quorum}
                    onChange={(e) => setQuorum(Number.parseInt(e.target.value) || 0)}
                    className="flex-1 text-center border-0 focus:outline-none"
                  />
                  <button onClick={() => setQuorum(quorum + 1)} className="px-3 py-2 text-gray-600 hover:bg-gray-100">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="signerRole" className="block text-sm font-medium text-gray-700 mb-2">
                Signer&apos;s role
              </label>
              <Input
                id="signerRole"
                type="text"
                placeholder="Enter role"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="signerUsernameSearch" className="block text-sm font-medium text-gray-700 mb-2">
                Search signer&apos;s username
              </label>
              <div className="relative">
                <Input
                  id="signerUsernameSearch"
                  type="text"
                  placeholder="Search username"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</button>
              </div>

              {/* Search results */}
              {searchQuery && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
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
                <div className="mt-4 space-y-2">
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
              <Button variant="outline" className="flex-1 bg-transparent" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleSave}
              >
                {isLoading ? "Saving..." : "Save Signers"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
