"use client"

import { useState } from "react"
import Image from "next/image"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"

interface OrganizationReadyModalProps {
  onContinue: () => void
}

// Scattered around the seal, at the offsets the design places them.
const CONFETTI = [
  { src: "/icons/confetti-capsule.svg", size: [6, 11], className: "left-[9px] top-[47px]" },
  { src: "/icons/confetti-star-sm.svg", size: [5, 5], className: "left-[26px] top-[31px]" },
  { src: "/icons/confetti-dot-blue.svg", size: [9, 9], className: "left-[2px] top-[66px]" },
  { src: "/icons/confetti-star-lg.svg", size: [9, 9], className: "right-[6px] top-[10px]" },
  { src: "/icons/confetti-dot-lime.svg", size: [9, 9], className: "right-[14px] top-[39px]" },
  { src: "/icons/confetti-capsule.svg", size: [6, 11], className: "left-[63px] bottom-[6px]" },
  { src: "/icons/confetti-triangle.svg", size: [10, 9], className: "left-[81px] bottom-[2px]" },
  { src: "/icons/confetti-star-alt.svg", size: [5, 5], className: "right-[24px] bottom-[18px]" },
]

export function OrganizationReadyModal({ onContinue }: Readonly<OrganizationReadyModalProps>) {
  // Never cleared: the dashboard replacing this is what ends it. The route
  // takes a moment to load, and a live button over a finished setup invites a
  // second press.
  const [isLeaving, setIsLeaving] = useState(false)

  const handleContinue = () => {
    if (isLeaving) return
    setIsLeaving(true)
    onContinue()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-[581px] px-6 sm:px-10 py-14 bg-white rounded-[40px] shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-gray-200 flex justify-center items-center">
        <div className="w-full max-w-[501px] flex flex-col items-center gap-16">
          <div className="size-36 relative bg-indigo-50 rounded-full flex items-center justify-center">
            <Image src="/icons/ph_seal-check-fill.svg" alt="" width={112} height={112} />
            {CONFETTI.map((piece) => (
              <Image
                key={piece.src + piece.className}
                src={piece.src}
                alt=""
                width={piece.size[0]}
                height={piece.size[1]}
                className={`absolute ${piece.className}`}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-10 w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center text-blue-950 text-4xl font-normal font-nohemi">Your organization is ready.</div>
              <div className="w-full max-w-[473px] text-center text-neutral-500 text-lg font-inter">
                <span className="font-bold">Welcome to Dizburza Enterprise. </span>
                <span className="font-normal">Your account is set up and ready to handle payroll and disbursements.</span>
              </div>
            </div>

            <OnboardingButton className="self-stretch" onClick={handleContinue} disabled={isLeaving}>
              {isLeaving ? "Opening dashboard..." : "Go to Dashboard"}
            </OnboardingButton>
          </div>
        </div>
      </div>
    </div>
  )
}
