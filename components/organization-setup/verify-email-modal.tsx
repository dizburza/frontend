"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { OnboardingButton } from "@/components/organization-setup/onboarding-button"

interface VerifyEmailModalProps {
  email: string
  isVerifying: boolean
  onVerify: (code: string) => Promise<boolean>
  onResend: () => Promise<void>
}

/** Enough of the address to recognise, not enough to hand to a shoulder surfer. */
const maskEmail = (email: string) => {
  const [local, domain] = email.split("@")
  if (!domain) return email
  const head = local.slice(0, 2)
  const tail = local.length > 2 ? local.slice(-1) : ""
  return `${head}•••${tail}@${domain}`
}

export function VerifyEmailModal({ email, isVerifying, onVerify, onResend }: Readonly<VerifyEmailModalProps>) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [error, setError] = useState(false)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const code = digits.join("")

  /**
   * Writes every digit it was handed, not just the first. A paste arrives as
   * one event, and a fast typist can outrun the focus move and land two
   * characters in the same box.
   */
  const setDigit = (index: number, value: string) => {
    const typed = value.replace(/\D/g, "")
    if (!typed) {
      setDigits((prev) => prev.map((d, i) => (i === index ? "" : d)))
      return
    }

    setDigits((prev) => {
      const next = [...prev]
      for (let i = 0; i < typed.length && index + i < 6; i++) {
        next[index + i] = typed[i]
      }
      return next
    })
    setError(false)

    const landed = Math.min(index + typed.length, 5)
    inputRefs.current[landed]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const submit = async (value: string) => {
    const ok = await onVerify(value)
    if (!ok) {
      setError(true)
      // Cleared rather than left filled: with nothing to press, a wrong code
      // otherwise needs six backspaces before it can be retyped.
      setDigits(Array(6).fill(""))
      inputRefs.current[0]?.focus()
    }
  }

  // Retrying the same digits is a deliberate act, so this ignores the latch
  // the effect sets.
  const handleVerify = () => {
    if (code.length !== 6 || isVerifying) return
    void submit(code)
  }

  // Held in a ref so the effect below does not re-run when the parent passes a
  // fresh callback on every render.
  const submitRef = useRef(submit)
  submitRef.current = submit

  /**
   * Six digits is the whole input, so waiting for a button press only adds a
   * click. Latched on the code itself: a failed attempt must not resubmit the
   * same digits, and the latch clears as soon as one is edited.
   */
  const submittedRef = useRef<string | null>(null)

  useEffect(() => {
    if (code.length !== 6) {
      submittedRef.current = null
      return
    }
    if (isVerifying || submittedRef.current === code) return

    submittedRef.current = code
    void submitRef.current(code)
  }, [code, isVerifying])

  return (
    <div
      // Verifying also creates the organization and deploys its contract, so it
      // is long enough that a second click is a real risk rather than a
      // theoretical one. Disabled controls are not enough on their own: the
      // overlay still takes clicks and the keyboard still reaches what is
      // behind it.
      aria-busy={isVerifying}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm px-4 ${
        isVerifying ? "cursor-wait [&_*]:pointer-events-none" : ""
      }`}
    >
      <div className="w-full max-w-[581px] px-6 sm:px-10 py-14 bg-white rounded-[40px] shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-gray-200 flex justify-center items-center">
        <div className="w-full max-w-[501px] flex flex-col items-center gap-8">
          <Image src="/logo.svg" alt="Dizburza" width={169} height={33} />

          <div className="flex flex-col items-center gap-10 w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">Verify Organization Email</div>
              <div className="w-full max-w-96 text-center text-neutral-500 text-base font-semibold font-inter">
                We have sent a 6-digit verification code to {maskEmail(email)}. Enter it below to continue.
              </div>
            </div>

            <div className="w-full max-w-96 flex flex-col items-center gap-8">
              <div className="flex justify-center items-center gap-3">
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    value={digit}
                    disabled={isVerifying}
                    onChange={(e) => setDigit(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-16 sm:w-16 p-4 sm:p-6 rounded-lg outline outline-1 outline-offset-[-1.1px] text-center text-xl font-bold font-nohemi leading-7 focus:outline-2 disabled:opacity-60 ${
                      error
                        ? "outline-red-400 text-red-600 bg-red-50/60"
                        : "outline-indigo-200 text-zinc-700 bg-slate-50/60"
                    }`}
                  />
                ))}
              </div>

              {error ? (
                <p className="text-red-600 text-base font-semibold font-inter -mt-4">Incorrect or expired code</p>
              ) : null}

              <div className="self-stretch flex flex-col items-center gap-3">
                {/* Verification starts on the sixth digit, so this is a
                    fallback for when that did not fire, and the place the
                    progress shows. */}
                <OnboardingButton
                  className="self-stretch justify-center"
                  disabled={code.length !== 6 || isVerifying}
                  onClick={handleVerify}
                >
                  {isVerifying ? "Verifying..." : "Verify"}
                </OnboardingButton>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 text-sm font-normal font-inter">Didn&rsquo;t receive the code?</span>
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => void onResend()}
                    className="px-2 py-1 text-indigo-700 text-sm font-medium font-nohemi disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
