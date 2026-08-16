"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

const TARGET = 11_000
const DURATION_MS = 1600

const NUMBER_FILL =
  "bg-gradient-to-r from-[#454CDE] to-[#9145DE] bg-clip-text text-transparent"

export function ActiveUsers() {
  const ref = useRef<HTMLDivElement>(null)
  // Renders the final figure on the server, so it is right with JS off.
  const [value, setValue] = useState(TARGET)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let frame = 0
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()

        const start = performance.now()
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1)
          setValue(Math.round(TARGET * (1 - Math.pow(1 - t, 3))))
          if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  const figure = value.toLocaleString("en-US")

  return (
    // Scales with the frame like the rest of the section. The base is the
    // design's 16px body and everything under it is in em.
    <div
      ref={ref}
      className="flex w-[13em] flex-col gap-1 text-[clamp(0.875rem,0.926vw,1rem)]"
    >
      <span className="font-lato text-[1.5em] font-semibold text-gray-500">
        Active Users
      </span>

      {/* The figure trails a copy of itself above and below, each cropped to the
          0.26em that clears the solid one, so nothing shows through the 0s.
          Leading is set to Raleway's 0.71em cap height, which makes the line box
          hug the digits: without that the crop lands on the blank the font
          leaves above and below them. Band is 0.71 + 0.26 + 0.26. Each crop
          stops a little short of the figure, which is the hairline of daylight
          between the copies and it. */}
      <div className="relative flex h-[1.23em] items-center font-raleway text-[3em] font-bold leading-[0.71em]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[0.3em] overflow-hidden"
        >
          <span className={cn("absolute inset-x-0 top-0 opacity-30", NUMBER_FILL)}>
            {figure}
          </span>
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[0.22em] overflow-hidden"
        >
          <span
            className={cn("absolute inset-x-0 bottom-0 opacity-25", NUMBER_FILL)}
          >
            {figure}
          </span>
        </span>
        <span className={cn("relative", NUMBER_FILL)}>{figure}</span>
      </div>
    </div>
  )
}
