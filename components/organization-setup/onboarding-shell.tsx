"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletConnectionStatus,
  useDisconnect,
} from "thirdweb/react"
import { clearAuthStorage } from "@/hooks/useAutoAuthenticate"
import { useMounted } from "@/components/connectWalletHelpers"
import { hasSessionFor } from "@/lib/session"
import { useEffect, useState, type ReactNode } from "react"

// A plausible looking fake address is worse than an empty slot: it reads as
// the connected account.
const formatAddress = (address?: string) => {
  const a = (address || "").trim()
  if (!a) return ""
  if (a.length <= 12) return a
  return `${a.slice(0, 6)}...${a.slice(-4)}`
}

interface OnboardingShellProps {
  image: string
  children: ReactNode
  /** Overridden for someone joining an organization rather than creating one. */
  headline?: string
  blurb?: ReactNode
}

const DEFAULT_BLURB = (
  <>
    Let&rsquo;s start by creating your organization space on Dizburza.
    <br />
    These details help us personalize your dashboard and business tools.
  </>
)

export function OnboardingShell({
  image,
  children,
  headline = "Set up your organization",
  blurb = DEFAULT_BLURB,
}: Readonly<OnboardingShellProps>) {
  const router = useRouter()
  const mounted = useMounted()
  const account = useActiveAccount()
  const wallet = useActiveWallet()
  const status = useActiveWalletConnectionStatus()
  const { disconnect } = useDisconnect()

  // Disconnecting also empties the session, so without this the guard below
  // would race the disconnect's own navigation and the loser leaves a blank
  // page behind.
  const [isLeaving, setIsLeaving] = useState(false)

  // Every route behind this shell posts to an authenticated endpoint, so
  // arriving without a session means filling in a form that cannot submit.
  // "connecting" is not an answer yet: thirdweb reports it while restoring a
  // stored wallet, and redirecting then would bounce a signed-in person.
  const settled = mounted && status !== "connecting" && status !== "unknown"
  const signedIn = Boolean(account?.address) && hasSessionFor(account?.address)

  // A connected wallet with no session yet is signing in, not signed out.
  // Bouncing it to /sign-in only sends it back here once auto-authentication
  // finishes, and the two pages push each other in the meantime.
  const isSigningIn = Boolean(account?.address) && !signedIn

  useEffect(() => {
    if (settled && !signedIn && !isSigningIn && !isLeaving) router.replace("/sign-in")
  }, [settled, signedIn, isSigningIn, isLeaving, router])

  const handleDisconnect = async () => {
    setIsLeaving(true)
    clearAuthStorage()
    try {
      if (wallet) await Promise.resolve(disconnect(wallet))
    } finally {
      router.replace("/")
      router.refresh()
    }
  }

  // Holding the form back until the redirect lands, rather than showing a step
  // someone is about to be moved off. The background stays, because a bare null
  // is a white screen for as long as the navigation takes. Someone mid sign-in
  // is staying, so they see the form rather than a blank page.
  if (settled && !signedIn && !isSigningIn) {
    return <div className="h-screen bg-white" />
  }

  return (
    <div className="h-screen overflow-hidden bg-white p-5 flex flex-col gap-5">
      <header className="shrink-0 h-16 px-10 py-4 bg-slate-50 rounded-lg shadow-[0px_4px_8px_0px_rgba(29,30,73,0.12)] outline outline-[0.5px] outline-offset-[-0.5px] outline-indigo-100 flex justify-between items-center">
        <Link href="/" className="inline-flex">
          <Image src="/logo.svg" alt="Dizburza" width={169} height={33} priority />
        </Link>
        {mounted && account?.address ? (
          <div className="flex items-center gap-4">
            <div className="text-indigo-900 text-xl font-medium font-nohemi leading-6">
              {formatAddress(account.address)}
            </div>
            <button
              type="button"
              aria-label="Disconnect wallet"
              title="Disconnect wallet"
              onClick={() => void handleDisconnect()}
              className="size-8 bg-indigo-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-indigo-100 flex items-center justify-center cursor-pointer hover:bg-indigo-100"
            >
              <Image src="/icons/avatarman.svg" alt="" width={16} height={16} />
            </button>
          </div>
        ) : null}
      </header>

      <main className="flex-1 min-h-0 flex gap-8">
        <div className="hidden lg:block flex-1 relative rounded-lg overflow-hidden">
          <Image src={image} alt="" fill className="object-cover" priority />
          {/* The headline sits on the dark half of the photo, so the gradient
              only needs to deepen the bottom rather than wash the whole frame. */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-indigo-950" />
          <div className="absolute inset-x-[8%] bottom-[7%] flex flex-col gap-3">
            <h1 className="text-indigo-50 text-4xl xl:text-5xl font-semibold font-nohemi leading-tight">
              {headline}
            </h1>
            <p className="text-indigo-100 text-base xl:text-lg font-normal font-inter">{blurb}</p>
          </div>
        </div>

        {/* Centred vertically, but with `my-auto` on the inner column rather
            than `justify-center` on the scroller: a form taller than the
            viewport would otherwise be centred past the top edge and its first
            field could not be scrolled to. */}
        <div className="w-full lg:w-[561px] shrink-0 h-full overflow-y-auto flex flex-col">
          <div className="my-auto flex flex-col items-center gap-8 py-2">{children}</div>
        </div>
      </main>
    </div>
  )
}
