"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { useActiveAccount } from "thirdweb/react"
import { useEffect, useMemo, useState } from "react"

export function OrganizationPromotionCard() {
  const account = useActiveAccount()
  const [displayName, setDisplayName] = useState<string | null>(null)

  const shortAddress = useMemo(() => {
    const address = account?.address
    if (!address) return null
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }, [account?.address])

  useEffect(() => {
    const address = account?.address
    if (!address) {
      setDisplayName(null)
      return
    }

    const cacheKey = `authCheck:${address}`
    try {
      const raw = localStorage.getItem(cacheKey)
      if (!raw) {
        setDisplayName(null)
        return
      }
      const cached = JSON.parse(raw) as { fullName?: string; username?: string }
      const name = (cached.fullName || cached.username || "").trim()
      setDisplayName(name || null)
    } catch {
      setDisplayName(null)
    }
  }, [account?.address])

  return (
      <Card className="relative space-y-2 h-44 w-full bg-white rounded-2xl px-4 overflow-hidden shadow-md shadow-[#454ADE24]">
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
        <main className="flex justify-between items-center w-full h-full">
          <div className="flex flex-col bg-white z-10  justify-end self-end h-12 py-4">
            <h1 className="text-2xl text-[#1D1F5D] font-bold">
              Welcome{displayName || shortAddress ? "," : ""} {displayName || shortAddress || ""}
            </h1>
            <p className="text-gray-600">
              Your wallet is active and ready to go.
            </p>
          </div>
          <Card className=" rounded-lg relative bottom-2 flex  justify-between  bg-gradient-to-br  w-[40%] from-[#454ADE] to-[#5B63F0] self-center h-[90%] z-10">
        <div className="space-y-1 p-4 h-full ">
          <h2 className="text-base font-bold text-white">Create an Organization Account</h2>
          <p className="text-xs text-white/90 text-balance">Manage batch payments, and approve transactions with your team.</p>
          <div className="flex self-end"><Link href={"/organization-setup/organization-details"} ><Button className="bg-white self-end  text-[#454ADE] hover:bg-white/90 font-semibold">+ Create Organization Now</Button></Link></div>
        </div>

        <div className="flex items-end justify-between">
          <Image src="/org-bag.svg" alt="Organization briefcase" width={200} height={130} className="object-contain" />
        </div>
          </Card>
        </main>
      </Card>
  )
}
