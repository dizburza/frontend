"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useActiveAccount } from "thirdweb/react"
import { useEffect, useMemo, useState } from "react"
import { useOrganizationBySlug } from "@/lib/api/organization"

export function OrganizationPromotionCard() {
  const account = useActiveAccount()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null)
  const [roleLabel, setRoleLabel] = useState<string | null>(null)
  const [jobRole, setJobRole] = useState<string | null>(null)

  const { data: organization } = useOrganizationBySlug(organizationSlug)

  const shortAddress = useMemo(() => {
    const address = account?.address
    if (!address) return null
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [account?.address])

  useEffect(() => {
    const address = account?.address
    if (!address) {
      setDisplayName(null)
      setOrganizationSlug(null)
      setRoleLabel(null)
      setJobRole(null)
      return
    }

    const cacheKey = `authCheck:${address}`
    try {
      const raw = localStorage.getItem(cacheKey)
      if (!raw) {
        setDisplayName(null)
        setOrganizationSlug(null)
        setRoleLabel(null)
        setJobRole(null)
        return
      }
      const cached = JSON.parse(raw) as { fullName?: string; username?: string; organizationSlug?: string; role?: string; jobRole?: string }
      const name = (cached.fullName || cached.username || "").trim()
      setDisplayName(name || null)
      const slug = (cached.organizationSlug || "").trim()
      setOrganizationSlug(slug || null)
      const jr = (cached.jobRole || "").trim()
      setJobRole(jr || null)
      const r = String(cached.role || "").trim().toLowerCase()
      if (r === "signer") setRoleLabel("Signer")
      else if (r === "admin") setRoleLabel("Admin")
      else if (r === "employee") setRoleLabel("Employee")
      else if (r === "user") setRoleLabel("User")
      else setRoleLabel(null)
    } catch {
      setDisplayName(null)
      setOrganizationSlug(null)
      setRoleLabel(null)
      setJobRole(null)
    }
  }, [account?.address])

  const shouldShowOrganizationCard = Boolean(organizationSlug && organization && roleLabel === "Employee")
  const org = shouldShowOrganizationCard ? organization : null

  return (
      <Card className="relative space-y-2 h-auto sm:h-44 w-full bg-white rounded-2xl px-4 overflow-hidden shadow-md shadow-[#454ADE24]">
        <div className="absolute inset-0 bg-[#F9F9FE] opacity-10">
          <svg
            className="w-full h-full"
            preserveAspectRatio="none"
            viewBox="0 0 2000 1000"
          >
            <defs>
              <pattern
                id="parallelogram-lines"
                width="1000"
                height="400"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="-200"
                  y1="400"
                  x2="800"
                  y2="0"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <line
                  x1="800"
                  y1="400"
                  x2="1800"
                  y2="0"
                  stroke="currentColor"
                  strokeWidth="3"
                />

                <line
                  x1="200"
                  y1="0"
                  x2="1200"
                  y2="400"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <line
                  x1="-800"
                  y1="0"
                  x2="200"
                  y2="400"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </pattern>
            </defs>

            <rect width="2000" height="1000" fill="url(#parallelogram-lines)" />
          </svg>
        </div>
        <main className="flex flex-col sm:flex-row justify-between items-center sm:items-center w-full h-full gap-4 py-4">
          <div className="flex flex-col bg-white z-10 justify-center sm:justify-end self-start sm:self-end h-auto sm:h-12 py-2 sm:py-4 w-full sm:w-auto">
            <h1 className="text-2xl text-[#1D1F5D] font-bold">
              Welcome{displayName || shortAddress ? "," : ""} {displayName || shortAddress || ""}
            </h1>
            <p className="text-gray-600">
              Your wallet is active and ready to go.
            </p>
          </div>
          {org ? (
            <Card className="rounded-lg relative sm:bottom-2 flex justify-between bg-gradient-to-br w-full sm:w-[45%] lg:w-[40%] from-[#454ADE] to-[#5B63F0] self-center h-auto sm:h-[90%] z-10">
              <div className="space-y-1 p-3 sm:p-4 h-full flex flex-col">
                <h2 className="text-base font-bold text-white">Organization</h2>
                <p className="text-xs text-white/90 text-balance">{org.name}</p>

                <div className="mt-1 space-y-0.5">
                  {org.metadata?.industry ? (
                    <p className="text-[11px] text-white/80">Industry: {org.metadata.industry}</p>
                  ) : null}
                  {jobRole ? (
                    <p className="text-[11px] text-white/80">Job role: {jobRole}</p>
                  ) : null}
                  {!jobRole && org.metadata?.size ? (
                    <p className="text-[11px] text-white/80">Company size: {org.metadata.size}</p>
                  ) : null}
                  {!jobRole && roleLabel ? (
                    <p className="text-[11px] text-white/70">Account type: {roleLabel}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-end justify-between">
                <Image src="/org-bag.svg" alt="Organization briefcase" width={200} height={130} className="object-contain" />
              </div>
            </Card>
          ) : (
            <Card className="rounded-lg relative sm:bottom-2 flex justify-between bg-gradient-to-br w-full sm:w-[45%] lg:w-[40%] from-[#454ADE] to-[#5B63F0] self-center h-auto sm:h-[90%] z-10">
              <div className="space-y-1 p-3 sm:p-4 h-full flex flex-col">
                <h2 className="text-base font-bold text-white">Create an Organization Account</h2>
                <p className="text-xs text-white/90 text-balance">Manage batch payments, and approve transactions with your team.</p>
                <div className="flex flex-col sm:flex-row self-start sm:self-end gap-2 mt-auto"><Link href={"/organization-setup/organization-details"} ><Button className="bg-white text-[#454ADE] hover:bg-white/90 font-semibold text-xs sm:text-sm">+ Create Organization Now</Button></Link></div>
              </div>

              <div className="flex items-end justify-between">
                <Image src="/org-bag.svg" alt="Organization briefcase" width={200} height={130} className="object-contain" />
              </div>
            </Card>
          )}
        </main>
      </Card>
  )
}
