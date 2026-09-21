import { BrandButton } from "@/components/landing/brand-button"
import { cn } from "@/lib/utils"

// Same discipline as the money rules band: from lg up this is the Figma frame,
// 1728x596, and everything sits at the percentage of it Figma placed it at. Type
// is a fraction of the viewport capped at the design size, so 1728 is exact and
// narrower screens are proportional.

// Figma stands both buttons exactly as tall as the copy beside them, 56 against
// 56. The button's own padding is a fixed 16, so left alone it holds 56 while
// the copy scales and the two stop agreeing below 1728. Dropping the padding and
// letting the row stretch them takes the height off the paragraph itself, which
// is right even where the copy runs to a third line and a computed two-line
// height would not be.
//
// The side padding scales for the same reason: held at Figma's 24 it leaves 96
// inside a button that has narrowed to 144, and "Book a Demo" wants 101, so the
// label wrapped. nowrap keeps that from ever being decided silently, since the
// height no longer comes from the label.
const CTA_BUTTON = cn(
  "w-full whitespace-nowrap sm:w-[clamp(9rem,11.111vw,12rem)]",
  "lg:px-[clamp(0.75rem,1.389vw,1.5rem)] lg:py-0",
)

export function MoveMoneyCta() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-indigo-950">
      <div className="relative mx-auto w-full max-w-[1728px] px-6 py-14 md:px-10 lg:aspect-[1728/596] lg:px-0 lg:py-0">
        <EdgeShapes />

        <div className="flex flex-col gap-4 lg:absolute lg:left-[24.595%] lg:top-[20.134%] lg:w-[54.34%]">
          {/* Broken where the design breaks it, and held to those breaks. Nohemi
              sets wider here than in Figma, so a box at the design's 939 takes
              three lines and leaves "the" on one of its own. The line runs about
              30px past the box and there is room for it: nothing sits to the
              right of the heading until the teal shape, 300px further out. */}
          <h2 className="font-nohemi font-medium leading-[0.861] text-brand-indigo-100 text-[clamp(2.5rem,7.407vw,8rem)] lg:whitespace-nowrap">
            Move Money the
            <br />
            Smarter Way
          </h2>

          {/* The buttons sit beside the paragraph rather than under it, and both
              stand on the same baseline. The paragraph holds its width and the
              buttons give way: left to shrink it drops to 332 where its own
              first line needs 358, which costs a third line. */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-4">
            <p className="leading-[1.4] text-white text-[clamp(1rem,1.157vw,1.25rem)] lg:w-[50.053%] lg:shrink-0">
              Automate payments, approve transactions with your team, and stay in
              control of every dollar.
            </p>

            {/* Figma's 192 and 24 are 11.111vw and 1.389vw of the frame, and
                they scale with it like everything else here. Held at 192 they
                walk the pair into the shape on the right on any window narrower
                than the design. */}
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-[clamp(1rem,1.389vw,1.5rem)]">
              <BrandButton href="/sign-in" className={CTA_BUTTON}>
                Get Started
              </BrandButton>
              {/* The FAQ's support cards are the only place the product answers
                  this, so it goes there rather than nowhere. */}
              <BrandButton
                href="#faq"
                variant="secondary"
                className={CTA_BUTTON}
              >
                Book a Demo
              </BrandButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// The right shape is the left mirrored: the two exports agree to the pixel,
// every x on one summing with its opposite to 392.363, which is what the box is
// sized to rather than the 393 the file declares. Both are cut by the section's
// edge, so each one's rounded end is off frame by design.
const EDGE =
  "M365.331 0H-21C-35.9117 0 -48 12.0883 -48 27V169C-48 183.912 -35.9117 196 -21 196H298.057C308.49 196 317.99 189.989 322.457 180.56L389.732 38.56C398.218 20.6468 385.153 0 365.331 0Z"

function EdgeShapes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden lg:block"
    >
      <Edge className="left-0 top-[20.134%]" fill="#6FDE45" />
      <Edge className="right-0 top-[47.651%] -scale-x-100" fill="#45DECD" />
    </div>
  )
}

function Edge({
  className,
  fill,
}: Readonly<{ className: string; fill: string }>) {
  return (
    <svg
      viewBox="0 0 392.363 196"
      fill="none"
      className={cn("absolute w-[22.706%]", className)}
    >
      <path d={EDGE} fill={fill} />
    </svg>
  )
}
