"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import StepIndicator from "@/components/step-indicator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import type { Signer } from "@/lib/types/payloads"
import { toast } from "sonner"
import { useActiveAccount } from "thirdweb/react"
import { createOrganizationRecord } from "@/lib/api/organization"
import { useCreateOrganization } from "@/hooks/useCreateOrganization"

type UserLookupResult = {
  username?: string
  fullName?: string
  walletAddress: string
  avatar?: string
  canBeAdded: boolean
  currentOrganization?: string | null
}

const isAddressQuery = (value: string) => {
  const v = value.trim()
  return /^0x[a-fA-F0-9]{40}$/.test(v)
}

const normalizeUsername = (value: string) => {
  const cleaned = value.trim().replace(/^@/, "")
  return cleaned
}

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050"

const fetchUserByAddress = async (backendUrl: string, address: string, signal: AbortSignal) => {
  const res = await fetch(`${backendUrl}/api/users/search-address/${address}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  })

  if (!res.ok) return null

  const payload = (await res.json()) as {
    data?: {
      user?: {
        username?: string
        fullName?: string
        avatar?: string
        walletAddress: string
        currentOrganization?: string | null
      }
      canBeAdded?: boolean
    }
  }

  const u = payload.data?.user
  if (!u) return null

  return {
    username: u.username,
    fullName: u.fullName,
    walletAddress: u.walletAddress,
    avatar: u.avatar,
    currentOrganization: u.currentOrganization,
    canBeAdded: Boolean(payload.data?.canBeAdded),
  } satisfies UserLookupResult
}

const fetchUserByUsername = async (backendUrl: string, username: string, signal: AbortSignal) => {
  const res = await fetch(`${backendUrl}/api/users/search/${username}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  })

  if (!res.ok) return null

  const payload = (await res.json()) as {
    data?: {
      user?: {
        username?: string
        fullName?: string
        avatar?: string
        walletAddress: string
        currentOrganization?: string | null
      }
      canBeAdded?: boolean
    }
  }

  const u = payload.data?.user
  if (!u) return null

  return {
    username: u.username,
    fullName: u.fullName,
    walletAddress: u.walletAddress,
    avatar: u.avatar,
    currentOrganization: u.currentOrganization,
    canBeAdded: Boolean(payload.data?.canBeAdded),
  } satisfies UserLookupResult
}

const fetchSuggestions = async (backendUrl: string, query: string, signal: AbortSignal) => {
  const suggest = await fetch(`${backendUrl}/api/users/suggest?query=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  })

  if (!suggest.ok) return []

  const suggestPayload = (await suggest.json()) as {
    data?: { suggestions?: { username?: string; fullName?: string; avatar?: string }[] }
  }

  return suggestPayload.data?.suggestions || []
}

const searchUsers = async (backendUrl: string, rawQuery: string, signal: AbortSignal) => {
  const raw = rawQuery.trim()
  if (!raw) return [] as UserLookupResult[]

  if (isAddressQuery(raw)) {
    const resolved = await fetchUserByAddress(backendUrl, raw, signal)
    return resolved ? [resolved] : ([] as UserLookupResult[])
  }

  const q = normalizeUsername(raw)
  if (q.length < 2) return [] as UserLookupResult[]

  const suggestions = await fetchSuggestions(backendUrl, q, signal)
  const usernames: string[] = []
  for (const s of suggestions) {
    if (s.username) {
      usernames.push(s.username)
    }
    if (usernames.length >= 6) break
  }

  const results: UserLookupResult[] = []
  for (const uname of usernames) {
    const found = await fetchUserByUsername(backendUrl, uname, signal)
    if (found) results.push(found)
  }

  return results
}

export default function AddSignersPage() {
  const router = useRouter()
  const account = useActiveAccount()
  const { createOrganization } = useCreateOrganization()
  const [isLoading, setIsLoading] = useState(false)
  const [numSigners, setNumSigners] = useState(0)
  const [quorum, setQuorum] = useState(0)
  const [signerRole, setSignerRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [signers, setSigners] = useState<Signer[]>([])
  const [searchResults, setSearchResults] = useState<UserLookupResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<UserLookupResult | null>(null)

  const steps = [
    { number: 1, title: "Organization Details", subtitle: "", completed: true, active: false },
    { number: 2, title: "Organization Profile", subtitle: "", completed: true, active: false },
    { number: 3, title: "Add Signers", subtitle: "", completed: false, active: true },
  ]

  const debounceQuery = useMemo(() => searchQuery.trim(), [searchQuery])
  const hasSearchQuery = searchQuery.trim().length > 0
  const hasSearchResults = searchResults.length > 0
  const showSearching = hasSearchQuery && isSearching
  const showResults = hasSearchQuery && !isSearching && hasSearchResults
  const showNoResults = hasSearchQuery && !isSearching && !hasSearchResults

  useEffect(() => {
    if (!debounceQuery) {
      setSearchResults([])
      setSelectedCandidate(null)
      return
    }

    const controller = new AbortController()
    const runSearch = async () => {
      try {
        setIsSearching(true)
        setSearchResults([])
        setSelectedCandidate(null)

        const results = await searchUsers(getBackendUrl(), debounceQuery, controller.signal)
        setSearchResults(results)
      } catch (e) {
        const isAbort = e instanceof Error && e.name === "AbortError"
        if (!isAbort) {
          toast.error("Could not search users")
        }
      } finally {
        setIsSearching(false)
      }
    }

    const handle = setTimeout(() => {
      void runSearch()
    }, 350)

    return () => {
      controller.abort()
      clearTimeout(handle)
    }
  }, [debounceQuery])

  const handleAddSigner = (signer: Signer) => {
    if (!signers.some((s) => s.walletAddress.toLowerCase() === signer.walletAddress.toLowerCase())) {
      setSigners([...signers, signer])
    }
  }

  const handleRemoveSigner = (id: string) => {
    setSigners(signers.filter((s) => s.id !== id))
  }

  const selectCandidate = (candidate: (typeof searchResults)[number]) => {
    setSelectedCandidate(candidate)
  }

  const confirmCandidate = () => {
    if (!selectedCandidate) return

    if (!selectedCandidate.canBeAdded) {
      toast.error("This user cannot be added as a signer")
      return
    }

    const newSigner: Signer = {
      id: selectedCandidate.walletAddress,
      name: selectedCandidate.fullName || selectedCandidate.username || "Unknown",
      username: selectedCandidate.username ? `@${selectedCandidate.username}` : "",
      walletAddress: selectedCandidate.walletAddress,
      role: String(signerRole || "Signer").trim() || "Signer",
      avatar: (selectedCandidate.avatar || "?").slice(0, 2).toUpperCase(),
    }

    handleAddSigner(newSigner)
    setSearchQuery("")
    setSelectedCandidate(null)
  }

  const handleFinishSetup = async () => {
    if (isLoading) return

    try {
      setIsLoading(true)

      if (!account?.address) {
        toast.error("Connect your wallet to continue")
        return
      }

      const creatorSigner = {
        address: account.address,
        name: "Creator",
        role: String(signerRole || "Owner").trim() || "Owner",
      }

      const addedSigners = signers.map((s) => ({
        address: s.walletAddress,
        name: s.name,
        role: s.role,
      }))

      const signerPayload = [
        creatorSigner,
        ...addedSigners.filter((s) => s.address.toLowerCase() !== creatorSigner.address.toLowerCase()),
      ]

      if (signerPayload.length === 0) {
        toast.error("Please add at least one signer")
        return
      }

      if (quorum <= 0 || quorum > signerPayload.length) {
        toast.error("Quorum must be at least 1 and not more than number of signers")
        return
      }

      const rawDetails = localStorage.getItem("orgDetails")
      const rawProfile = localStorage.getItem("orgProfile")
      if (!rawDetails || !rawProfile) {
        toast.error("Organization setup data missing. Please restart setup.")
        return
      }

      const orgDetails = JSON.parse(rawDetails) as {
        industry?: string
        registrationType?: string
        registrationNumber?: string
        country?: string
      }

      const orgProfile = JSON.parse(rawProfile) as {
        organizationName?: string
        businessEmail?: string
      }

      const name = String(orgProfile.organizationName || "").trim()
      const businessEmail = String(orgProfile.businessEmail || "").trim()
      if (!name || !businessEmail) {
        toast.error("Organization name and business email are required")
        return
      }

      const organizationHashPayload = {
        name,
        creatorAddress: account.address,
        signers: signerPayload.map((s) => s.address),
        timestamp: Date.now(),
      }

      const encodeHex = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer)
        return Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      }

      const rawHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(JSON.stringify(organizationHashPayload))
      )
      const organizationHash = "0x" + encodeHex(rawHash)

      toast.message("Deploying organization contract...")
      const contractAddress = await createOrganization({
        organizationHash,
        signers: signerPayload.map((s) => s.address),
        quorum: BigInt(quorum),
      })

      toast.message("Saving organization record...")
      const created = await createOrganizationRecord({
        name,
        contractAddress,
        organizationHash,
        creatorAddress: account.address,
        businessEmail,
        businessInfo: {
          registrationNumber: orgDetails.registrationNumber,
          registrationType: orgDetails.registrationType,
        },
        signers: signerPayload,
        quorum,
        metadata: {
          industry: orgDetails.industry,
        },
        settings: {
          payrollCurrency: "cNGN",
          timeZone: "Africa/Lagos",
        },
      })

      localStorage.setItem("accountType", "organization")

      toast.success("Organization created successfully")
      router.push(`/org/${created.slug}`)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Could not complete setup. Please try again.")
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
                  Search signer&apos;s username or wallet address
                </label>
                <div className="relative">
                  <Input
                    id="signerUsernameSearch"
                    type="text"
                    placeholder="Search @username or 0x..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-[40px]"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</button>
                </div>

                {/* Search results */}
                {hasSearchQuery && (
                  <div className="mt-2 space-y-2 max-h-24 overflow-y-auto">
                    {showSearching ? <div className="p-3 text-sm text-gray-500">Searching...</div> : null}
                    {showNoResults ? <div className="p-3 text-sm text-gray-500">No results</div> : null}
                    {showResults
                      ? searchResults.map((result) => (
                          <button
                            key={result.walletAddress}
                            type="button"
                            onClick={() => selectCandidate(result)}
                            className="w-full text-left flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {(result.avatar || "?").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {result.fullName || (result.username ? `@${result.username}` : "Unknown")}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {result.username ? `@${result.username}` : ""} {result.walletAddress}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {result.canBeAdded ? "Select" : "Unavailable"}
                            </div>
                          </button>
                        ))
                      : null}
                  </div>
                )}

                {selectedCandidate ? (
                  <div className="mt-2 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Confirm signer</p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Name:</span> {selectedCandidate.fullName || "--"}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Username:</span> {selectedCandidate.username ? `@${selectedCandidate.username}` : "--"}
                    </p>
                    <p className="text-xs text-gray-600 break-all">
                      <span className="font-medium">Address:</span> {selectedCandidate.walletAddress}
                    </p>
                    {selectedCandidate.currentOrganization ? (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Current org:</span> {selectedCandidate.currentOrganization}
                      </p>
                    ) : null}
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => setSelectedCandidate(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={confirmCandidate}
                        disabled={!selectedCandidate.canBeAdded}
                      >
                        Add signer
                      </Button>
                    </div>
                  </div>
                ) : null}

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
                            <p className="text-[10px] text-gray-500 break-all">{signer.walletAddress}</p>
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
