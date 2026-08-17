"use client"

import Image from "next/image"
import { useEffect, useRef, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

// The Figma frame, 1728x970. Unlike the hero and the stats this one has to fit
// the viewport in both directions, because it pins: a card taller than the
// window would be unreadable at every scroll position. So `--u` is one design
// pixel scaled by whichever axis is tighter, and every measurement below is the
// Figma number times that.
const FRAME_W = 1728
const FRAME_H = 970
const HEADER_H = "5rem"
const UNIT = `min(calc(100vw / ${FRAME_W}), calc((100svh - ${HEADER_H}) / ${FRAME_H}), 1px)`

// The boxes art is placed inside, in their own coordinates, so a piece can be
// positioned as a percentage of one and stay put at any size.
const WELL = { width: 687, height: 384 }
const BADGE = { width: 96, height: 96 }
const BADGE_SLOT = { width: 44, height: 48 }

// Three cards means two legs. Each leg spends this fraction of its scroll
// parked at either end, so the section reads as three stops rather than one
// continuous slide. Kept small: a hold long enough to notice is indistinguishable
// from the page having seized up, since the wheel moves and nothing does.
const HOLD = 0.1

// The last card lands with this much of the pin still to run, which is what lets
// the page move on afterwards. Mapped across the whole pin the stack only
// finishes on the document's last scrollable pixel, so there is nothing left to
// scroll and a browser rounding a pixel short strands the last card half way.
const SETTLE = 0.88

type Box = { width: number; height: number }
type Rect = Box & { left: number; top: number }

type Art = {
  src: string
  // Where Figma put the artwork inside the box it sits in.
  rect: Rect
  // Only for an export that was not trimmed to its artwork. Placing those by
  // `rect` alone would size the transparent canvas instead of the subject, so
  // the subject is measured and the canvas placed around it.
  source?: { canvas: Box; subject: Rect }
}

// The badge is cropped out of the wordmark, which is the only export of the
// mark there is. The slot shows the tile on its left and clips the rest.
const LOCKUP: Art = {
  src: "/images/dizburza-lockup.png",
  rect: { left: 0, top: 0, ...BADGE_SLOT },
  source: {
    canvas: { width: 649, height: 127 },
    subject: { left: 0, top: 0, width: 110, height: 127 },
  },
}

type Step = {
  title: string
  body: string
  art: Art
}

const STEPS: Step[] = [
  {
    title: "Set up your account",
    body: "Create your account in seconds. Everyone gets the access they need as Individuals, Super Admin, Finance Officer, HR, Signer.",
    art: {
      src: "/images/how-setup.png",
      rect: { left: 179, top: 19, width: 329, height: 360 },
    },
  },
  {
    title: "Fund your wallet",
    body: "Share your wallet address or QR code to receive stablecoins from clients, investors, or sales. Every inflow lands in your treasury dashboard in real time.",
    art: {
      src: "/images/how-fund.png",
      rect: { left: 173, top: -8, width: 343, height: 447 },
      source: {
        canvas: { width: 1024, height: 1024 },
        subject: { left: 216, top: 120, width: 591, height: 850 },
      },
    },
  },
  {
    title: "Pay with confidence",
    body: "Upload payroll CSV files, batch vendor payments, or trigger single transfers. Designated signers approve, and funds settle on-chain automatically.",
    art: {
      src: "/images/how-pay.png",
      rect: { left: 154, top: 19, width: 380, height: 445 },
      source: {
        canvas: { width: 1024, height: 1024 },
        subject: { left: 160, top: 168, width: 713, height: 856 },
      },
    },
  },
]

// The art's box as a share of the box it sits in, which is the only form that
// survives the frame being scaled.
function place(box: Box, { rect, source }: Art): CSSProperties {
  let placed = rect

  if (source) {
    const { canvas, subject } = source
    const scale = Math.min(
      rect.width / subject.width,
      rect.height / subject.height,
    )
    placed = {
      left: rect.left + (rect.width - subject.width * scale) / 2 - subject.left * scale,
      top: rect.top + (rect.height - subject.height * scale) / 2 - subject.top * scale,
      width: canvas.width * scale,
      height: canvas.height * scale,
    }
  }

  return {
    left: `${(placed.left / box.width) * 100}%`,
    top: `${(placed.top / box.height) * 100}%`,
    width: `${(placed.width / box.width) * 100}%`,
    height: `${(placed.height / box.height) * 100}%`,
  }
}

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useScrolledTrack(sectionRef, frameRef, trackRef)

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      // Three viewports: one to look at each card. The pinned frame takes the
      // first, leaving two legs of travel.
      className="relative bg-teal-50 lg:motion-safe:h-[300svh]"
    >
      <div
        ref={frameRef}
        // Below the sticky header, or the heading pins underneath it.
        className="lg:motion-safe:sticky lg:motion-safe:top-20 lg:motion-safe:flex lg:motion-safe:h-[calc(100svh-5rem)] lg:motion-safe:items-center lg:motion-safe:justify-center lg:motion-safe:overflow-hidden"
      >
        <div
          style={{ "--u": UNIT } as CSSProperties}
          className={cn(
            "relative mx-auto w-full max-w-[1728px] px-6 py-14 md:px-10",
            // Nothing pins, so the frame's width would leave the column stranded
            // against the left edge of a wide screen.
            "lg:motion-reduce:max-w-[880px]",
            "lg:motion-safe:h-[calc(var(--u)*970)] lg:motion-safe:w-[calc(var(--u)*1728)] lg:motion-safe:px-0 lg:motion-safe:py-0",
          )}
        >
          {/* First, so the cards ride over it the way the design has them
              covering the descenders. */}
          <h2
            className={cn(
              "font-nohemi font-medium text-gray-500",
              "text-[clamp(3rem,9vw,7.5rem)] leading-[1]",
              "lg:motion-safe:absolute lg:motion-safe:left-[calc(var(--u)*244)] lg:motion-safe:top-[calc(var(--u)*53)] lg:motion-safe:text-[calc(var(--u)*200)]",
            )}
          >
            How it works
          </h2>

          <p
            className={cn(
              "mt-4 font-medium text-zinc-800",
              "text-lg leading-[1.3333] lg:text-[calc(var(--u)*24)]",
              "lg:motion-safe:absolute lg:motion-safe:left-[calc(var(--u)*1282)] lg:motion-safe:top-[calc(var(--u)*225)] lg:motion-safe:mt-0",
            )}
          >
            Up and running
            <br />
            in under 5 minutes.
          </p>

          <div
            ref={trackRef}
            className={cn(
              "mt-10 flex w-full max-w-[799px] flex-col gap-6",
              "lg:w-[calc(var(--u)*799)] lg:gap-[calc(var(--u)*24)]",
              "lg:motion-safe:absolute lg:motion-safe:left-[calc(var(--u)*467)] lg:motion-safe:top-[calc(var(--u)*190)] lg:motion-safe:mt-0 lg:motion-safe:will-change-transform",
            )}
          >
            {STEPS.map((step) => (
              <StepCard key={step.title} step={step} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function StepCard({ step }: { step: Step }) {
  const { art } = step

  return (
    <div
      className={cn(
        "shrink-0 bg-white shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)]",
        "rounded-[32px] p-6 sm:p-10",
        "lg:rounded-[calc(var(--u)*48)] lg:p-[calc(var(--u)*56)]",
      )}
    >
      <div className="flex flex-col gap-4 lg:gap-[calc(var(--u)*16)]">
        <div className="flex items-center gap-4 lg:gap-[calc(var(--u)*24)]">
          <span className="relative size-14 shrink-0 overflow-hidden bg-brand-indigo-50 lg:size-[calc(var(--u)*96)]">
            <span
              className="absolute overflow-hidden"
              style={{
                left: `${(23 / BADGE.width) * 100}%`,
                top: `${(21 / BADGE.height) * 100}%`,
                width: `${(BADGE_SLOT.width / BADGE.width) * 100}%`,
                height: `${(BADGE_SLOT.height / BADGE.height) * 100}%`,
              }}
            >
              <span className="absolute" style={place(BADGE_SLOT, LOCKUP)}>
                <Image
                  src={LOCKUP.src}
                  alt=""
                  fill
                  sizes="256px"
                  className="object-contain"
                />
              </span>
            </span>
          </span>
          <h3 className="font-nohemi font-medium text-zinc-700 text-2xl leading-[1.1111] lg:text-[calc(var(--u)*36)]">
            {step.title}
          </h3>
        </div>

        {/* Two of the three illustrations are taller than the well and are meant
            to be cropped by it. */}
        <div className="relative aspect-[687/384] w-full overflow-hidden rounded-2xl bg-brand-indigo-50 outline outline-1 outline-offset-[-1px] outline-indigo-400 lg:rounded-[calc(var(--u)*24)]">
          <span className="absolute" style={place(WELL, art)}>
            <Image
              src={art.src}
              alt=""
              fill
              sizes="(max-width: 1024px) 48vw, 380px"
              className="object-contain"
            />
          </span>
        </div>

        <p className="text-zinc-800 text-base leading-[1.3333] sm:text-lg lg:text-[calc(var(--u)*24)]">
          {step.body}
        </p>
      </div>
    </div>
  )
}

// Turns the page's own scroll through the pinned section into the track's
// offset. Nothing is hijacked: the position is a pure function of where the
// section sits, so scrolling back up runs it in reverse for free.
function useScrolledTrack(
  sectionRef: React.RefObject<HTMLElement | null>,
  frameRef: React.RefObject<HTMLElement | null>,
  trackRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const section = sectionRef.current
    const frame = frameRef.current
    const track = trackRef.current
    if (!section || !frame || !track) return

    // The same condition the layout is written against, so the two cannot
    // disagree about whether the section is pinned.
    const pinned = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    )

    let queued = 0
    let stops: number[] = []

    // Measured rather than computed from the card height, because a line of
    // body copy that wraps differently here than in Figma would otherwise put
    // every card after it out of position.
    const measure = () => {
      const origin = track.getBoundingClientRect().top
      stops = Array.from(track.children).map(
        (card) => card.getBoundingClientRect().top - origin,
      )
    }

    const update = () => {
      queued = 0
      if (!pinned.matches || stops.length < 2) {
        track.style.transform = ""
        return
      }

      const pin = parseFloat(getComputedStyle(frame).top) || 0
      const span = (section.offsetHeight - frame.offsetHeight) * SETTLE
      const progress =
        span > 0
          ? clamp((pin - section.getBoundingClientRect().top) / span, 0, 1)
          : 0

      const legs = stops.length - 1
      const leg = Math.min(Math.floor(progress * legs), legs - 1)
      // The dwell belongs to a card arriving, so the first leg has none in front
      // of it and starts moving the moment the section pins. Scrolling while
      // nothing moves is the one thing that reads as the page having broken.
      const lead = leg === 0 ? 0 : HOLD
      const eased = smoothstep(
        clamp((progress * legs - leg - lead) / (1 - lead - HOLD), 0, 1),
      )
      const y = stops[leg] + (stops[leg + 1] - stops[leg]) * eased

      track.style.transform = `translate3d(0, ${-y}px, 0)`
    }

    const schedule = () => {
      if (!queued) queued = requestAnimationFrame(update)
    }

    const remeasure = () => {
      measure()
      update()
    }

    // The track's own size is in `--u`, which moves with the viewport, so this
    // covers resizes as well as reflowed copy.
    const observer = new ResizeObserver(remeasure)
    observer.observe(track)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", remeasure)
    pinned.addEventListener("change", remeasure)
    remeasure()

    return () => {
      cancelAnimationFrame(queued)
      observer.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", remeasure)
      pinned.removeEventListener("change", remeasure)
    }
  }, [sectionRef, frameRef, trackRef])
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}
