"use client"

import { useEffect, useState, type TransitionEvent } from "react"
import { cn } from "@/lib/utils"

const ITEMS = [
  "USDC",
  "USDT",
  "EVM Networks",
  "MPC Wallets",
  "Multi-Sig Smart Contracts",
]

// The one the design shows centred, so the first paint matches it.
const START = 3
const INTERVAL_MS = 2200

// Metrics in em against the base font size set on the viewport below, which is
// itself a fraction of the frame. 3.1875em is the design's 51px row pitch, and
// 1.40625em is what centres a row in the 6em window.
const PITCH_EM = 3.1875
const REST_EM = 1.40625

export function CompatibilityList() {
  const [index, setIndex] = useState(START)
  const [snapping, setSnapping] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => setIndex((i) => i + 1), INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // Two frames, because one is not enough to guarantee the browser painted the
  // jump with the transition off, and it would animate the whole way back up.
  useEffect(() => {
    if (!snapping) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setSnapping(false))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [snapping])

  // The list is rendered twice, so rolling off the end lands on a copy of the
  // first item. Swapping to the real one is what keeps it turning one way.
  const handleEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.propertyName !== "transform") return
    if (index < ITEMS.length) return
    setSnapping(true)
    setIndex(index - ITEMS.length)
  }

  const active = index % ITEMS.length

  return (
    // Clipping is only wanted vertically, so the box is widened and padded back
    // to the design width. The longest name sets wider in the browser than in
    // Figma and would otherwise lose a letter off each end.
    <div className="-mx-[30%] h-[6em] overflow-hidden px-[30%] text-base lg:text-[min(0.926vw,1rem)]">
      <div
        onTransitionEnd={handleEnd}
        style={{ transform: `translateY(${REST_EM - index * PITCH_EM}em)` }}
        className={cn(
          "flex flex-col",
          !snapping && "transition-transform duration-700 ease-out",
        )}
      >
        {ITEMS.concat(ITEMS).map((item, i) => (
          // The row keeps the base font size so the pitch stays the pitch. Only
          // the text inside it is resized, since em would otherwise be measured
          // against whichever size the row happened to be showing.
          <span
            key={i}
            aria-hidden={i >= ITEMS.length}
            className="flex h-[3.1875em] shrink-0 items-center justify-center"
          >
            <span
              className={cn(
                "whitespace-nowrap transition-all duration-500",
                i % ITEMS.length === active
                  ? "text-[2.25em] font-bold text-brand-indigo"
                  : "text-[1.875em] text-gray-400",
                // After the size, or twMerge drops it.
                "leading-none",
              )}
            >
              {item}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
