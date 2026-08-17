import { cn } from "@/lib/utils"

// Same discipline as the hero and the stats: from lg up this is the Figma
// frame, 1728x596, and the two blocks sit at the percentage of it Figma placed
// them at. Type is a fraction of the viewport capped at the design size, so
// 1728 is exact and narrower screens are proportional.
//
// The paragraph sits beside the last line rather than under the heading, which
// is why it is placed rather than in flow. Below lg it falls under it.
export function MoneyRulesBand() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-indigo-900">
      <div className="relative mx-auto w-full max-w-[1728px] px-6 py-14 md:px-10 lg:aspect-[1728/596] lg:px-0 lg:py-0">
        <EdgeMarks />

        {/* Broken where the design breaks it, and held to those breaks. Both
            faces set wider here than in Figma, and the design leaves the
            longest line about ten pixels of room, so a box sized to Figma's
            width takes an extra line and walks the paragraph into "Rules." */}
        <h2 className="font-nohemi font-medium leading-[0.861] text-white text-[clamp(2.5rem,7.407vw,8rem)] lg:absolute lg:left-[29.108%] lg:top-[20.805%] lg:whitespace-nowrap">
          Your <span className="text-brand-lime">Money.</span>
          <br />
          Your <span className="text-brand-amber">Rules.</span>
          <br />
          Always.
        </h2>

        <p className="mt-6 max-w-[224px] leading-[1.5] text-white text-[clamp(0.9375rem,0.926vw,1rem)] lg:absolute lg:left-[56.771%] lg:top-[59.396%] lg:mt-0 lg:max-w-none lg:whitespace-nowrap">
          Every payment authorized.
          <br />
          Every transaction traceable.
          <br />
          No money moves without
          <br />
          the right people saying so.
        </p>
      </div>
    </section>
  )
}

const MARK =
  "M166.945 -112.831C121.895 -114.84 77.8921 -98.8716 44.616 -68.4374L244.549 150.165C217.404 132.8 185.649 123.364 152.92 123.364V219.06C144.728 202.206 133.732 186.666 120.23 173.164C88.3427 141.277 45.0948 123.364 0 123.364V463.424C45.0948 463.424 88.3427 445.51 120.23 413.623C133.732 400.121 144.728 384.581 152.92 367.727V463.424C181.929 463.424 210.173 456.01 235.121 442.233L44.616 650.526C77.8921 680.961 121.895 696.93 166.945 694.92C211.995 692.911 254.402 673.088 284.836 639.812C315.27 606.536 331.239 562.532 329.23 517.482C328.395 498.76 324.483 480.494 317.807 463.354C361.148 462.122 402.454 444.368 433.199 413.623C465.086 381.737 483 338.489 483 293.394C483 248.299 465.086 205.051 433.199 173.164C402.007 141.972 359.944 124.151 315.915 123.389C323.745 104.919 328.319 85.0345 329.23 64.6069C331.239 19.5569 315.27 -24.4463 284.836 -57.7224C254.402 -90.9984 211.995 -110.822 166.945 -112.831ZM312.97 452.141C304.879 435.099 293.952 419.399 280.525 405.764C294.807 389.548 305.769 370.868 312.97 350.79V452.141ZM312.97 235.997C305.399 214.888 293.672 195.324 278.299 178.544C292.747 164.404 304.437 147.922 312.97 129.948V235.997Z"

// The mark stands taller than the band and is cut by it top and bottom, so the
// box is the artwork's own 483x808.09 hung off the frame rather than the
// section. MARK is the right-hand form and the left is its mirror: the two
// exports agree to the pixel, every x on one summing with its opposite to 446.
function EdgeMarks() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden mix-blend-overlay lg:block"
    >
      <Mark className="left-[-2.141%] -scale-x-100" />
      <Mark className="left-[74.479%]" />
    </div>
  )
}

function Mark({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      viewBox="0 -112.831 483 808.09"
      fill="none"
      className={cn(
        "absolute top-[-18.96%] h-[135.585%] w-[27.951%]",
        className,
      )}
    >
      <path fillRule="evenodd" clipRule="evenodd" d={MARK} fill="#45DECD" />
    </svg>
  )
}
