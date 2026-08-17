import Image from "next/image"
import { BrandButton } from "@/components/landing/brand-button"
import { cn } from "@/lib/utils"

// Same convention as the hero and the stats: at 1728 every number is Figma's,
// and below that each one is the same fraction of the viewport with a floor so
// copy stays readable. The cards are not held to Figma's 320 height though. A
// line of body copy that wraps one deeper on a narrow desktop would otherwise
// push the artwork out of a fixed box and leave the card looking empty.
//
// The two screenshots run whole to the card's bottom edge. The two drawn
// previews are cut by it: they carry the crop the design gives them as an aspect
// ratio and clip whatever runs past, so what is inside stays at full size rather
// than being fitted into the well.
//
// Every well grows. Two cards side by side rarely wrap to the same depth, and
// the grid stretches the shorter one to match; the slack has to land above the
// artwork, or whichever card won the toss ends up with a strip of background
// under its image.

export function WhyDizburza() {
  return (
    <section id="features" className="scroll-mt-24 bg-brand-canvas">
      <div className="mx-auto w-full max-w-[1728px] px-6 pb-[clamp(3.5rem,7.928vw,8.5625rem)] pt-[clamp(3.5rem,5.498vw,5.9375rem)] md:px-10 lg:px-0">
        <div className="mx-auto flex w-full flex-col items-center gap-[clamp(2rem,2.778vw,3rem)] lg:w-[70.775%]">
          <header className="flex flex-col items-center gap-[clamp(1.5rem,1.852vw,2rem)]">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-balance text-center font-nohemi font-medium leading-[1.2] text-gray-500 text-[clamp(2rem,2.778vw,3rem)]">
                Why Dizburza Works for You
              </h2>
              <p className="max-w-[606px] text-center leading-[1.5] text-zinc-800 text-[clamp(0.9375rem,0.926vw,1rem)]">
                From payroll automation to cross-border vendor payments,
                Dizburza simplifies the complexity so your finance team can focus
                on what really matters.
              </p>
            </div>

            <BrandButton
              href="/account-type"
              className="w-full sm:w-[clamp(11rem,18.519vw,20rem)]"
            >
              Get Started
            </BrandButton>
          </header>

          {/* The two rows mirror each other, wide card outside then in. `fr` on
              the Figma widths keeps the gap out of the ratio. */}
          <div className="flex w-full flex-col gap-[clamp(1rem,1.389vw,1.5rem)]">
            <div className="grid gap-[clamp(1rem,1.389vw,1.5rem)] lg:grid-cols-[512fr_687fr]">
              <CrossBorderCard />
              <AnalyticsCard />
            </div>
            <div className="grid gap-[clamp(1rem,1.389vw,1.5rem)] lg:grid-cols-[687fr_512fr]">
              <MultiSigCard />
              <BulkPaymentCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface Trimmed {
  src: string
  alt: string
  sizes: string
  canvas: { width: number; height: number }
  // Where the artwork sits inside that canvas, measured off the file.
  subject: { left: number; top: number; width: number; height: number }
}

const TRANSFER: Trimmed = {
  src: "/images/why-transfer.png",
  alt: "A cNGN transfer waiting to be confirmed",
  sizes: "(max-width: 1024px) 110vw, 434px",
  canvas: { width: 432, height: 260 },
  subject: { left: 49, top: 47, width: 333, height: 213 },
}

const ANALYTICS: Trimmed = {
  src: "/images/why-analytics.png",
  alt: "Income and analysis cards from the Dizburza dashboard",
  sizes: "(max-width: 1024px) 110vw, 584px",
  canvas: { width: 583, height: 236 },
  subject: { left: 65, top: 63, width: 452, height: 173 },
}

const SIGNATURES: Trimmed = {
  src: "/images/why-signatures.png",
  alt: "One of the signatures a payment needs, obtained",
  sizes: "(max-width: 1024px) 60vw, 360px",
  canvas: { width: 360, height: 177 },
  subject: { left: 8, top: 4, width: 343, height: 173 },
}

// Each export is padded with its own drop shadow, and Figma sized the node to
// the artwork rather than to the canvas: 49px of halo either side of the
// transfer card, on a 333px subject. Sizing the canvas to the node instead is
// what left the artwork small and floating in the middle of its own shadow, so
// the box here is the artwork and the canvas is hung around it. None of the
// three has any padding below its subject, which is what keeps the artwork
// meeting the card's bottom edge.
function TrimmedArt({ src, alt, sizes, canvas, subject }: Readonly<Trimmed>) {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: `${subject.width} / ${subject.height}` }}
    >
      <Image
        src={src}
        alt={alt}
        width={canvas.width}
        height={canvas.height}
        sizes={sizes}
        // Preflight caps images at the width of their box, which would undo the
        // overhang the moment it is applied.
        className="absolute h-auto max-w-none"
        style={{
          left: `${(-subject.left / subject.width) * 100}%`,
          top: `${(-subject.top / subject.height) * 100}%`,
          width: `${(canvas.width / subject.width) * 100}%`,
        }}
      />
    </div>
  )
}

interface FeatureCardProps {
  icon: string
  title: string
  body: string
  className: string
  titleClassName: string
  bodyClassName: string
  children: React.ReactNode
}

function FeatureCard({
  icon,
  title,
  body,
  className,
  titleClassName,
  bodyClassName,
  children,
}: Readonly<FeatureCardProps>) {
  return (
    <article
      className={cn(
        // No padding under the artwork: it meets the card's bottom edge.
        "flex flex-col gap-[clamp(1rem,1.389vw,1.5rem)] overflow-hidden rounded-[clamp(1rem,1.389vw,1.5rem)] p-[clamp(1rem,1.389vw,1.5rem)] pb-0",
        className,
      )}
    >
      <div className="flex flex-col gap-[clamp(0.5rem,0.694vw,0.75rem)]">
        <div className="flex items-center gap-[clamp(0.5rem,0.694vw,0.75rem)]">
          <Image
            src={icon}
            alt=""
            width={32}
            height={32}
            className="h-auto w-[clamp(1.5rem,1.852vw,2rem)] shrink-0"
          />
          <h3
            className={cn(
              "font-nohemi font-medium leading-[1.2] text-[clamp(1.375rem,1.736vw,1.875rem)]",
              titleClassName,
            )}
          >
            {title}
          </h3>
        </div>
        <p className={cn("leading-[1.4]", bodyClassName)}>{body}</p>
      </div>

      {children}
    </article>
  )
}

function CrossBorderCard() {
  return (
    <FeatureCard
      icon="/icons/feature-arrow-indigo.svg"
      title="Cross-Border Transfers"
      body="Send stablecoins worldwide in seconds. No SWIFT fees, no bank delays, no waiting for weekends. Your market is global."
      className="bg-gray-100"
      titleClassName="text-gray-500"
      bodyClassName="text-zinc-800 text-[clamp(0.9375rem,0.926vw,1rem)]"
    >
      <div className="flex w-full grow items-end self-center lg:w-[71.983%]">
        <TrimmedArt {...TRANSFER} />
      </div>
    </FeatureCard>
  )
}

function AnalyticsCard() {
  return (
    <FeatureCard
      icon="/icons/feature-arrow-lime.svg"
      title="Analytics & Reporting"
      body="Pay hundreds at once by uploading a CSV file or sync your payroll. Salaries, vendor fees, and commissions go out in seconds, not days."
      className="bg-brand-indigo-800"
      titleClassName="text-white"
      bodyClassName="text-neutral-50 text-[clamp(1rem,1.157vw,1.25rem)]"
    >
      <div className="flex w-full grow items-end self-center lg:w-[70.892%]">
        <TrimmedArt {...ANALYTICS} />
      </div>
    </FeatureCard>
  )
}

function MultiSigCard() {
  return (
    <FeatureCard
      icon="/icons/feature-arrow-purple.svg"
      title="Multi-Sig Management"
      body="Payments only move when your chosen signers approve. Your funds stay safe, and the blockchain makes everything secure and tamper-proof."
      className="bg-brand-indigo-100"
      titleClassName="text-brand-indigo-950"
      bodyClassName="text-brand-indigo-800 text-[clamp(1rem,1.157vw,1.25rem)] lg:w-[76.213%]"
    >
      {/* The two panels overlap, so they are placed rather than stacked. `em` is
          the design pixel here, ten to one: the roster is drawn at type sizes
          that only make sense against the width it is drawn at, and cqw ties
          that to the well instead of to a breakpoint. Figma left the pair
          floating in the middle of the card; 52.3em is what the two of them
          measure together, so pinning that to the full width is what fills it. */}
      <div className="relative aspect-[523/144] w-full grow overflow-hidden [container-type:inline-size]">
        <div className="absolute inset-0 text-[1.912cqw]">
          <div className="absolute left-[18em] top-0 w-[34.3em]">
            <TrimmedArt {...SIGNATURES} />
          </div>
          <SignerRoster />
        </div>
      </div>
    </FeatureCard>
  )
}

function BulkPaymentCard() {
  return (
    <FeatureCard
      icon="/icons/feature-arrow-indigo.svg"
      title="Bulk Payment Processor"
      body="Pay hundreds at once by uploading a CSV file or sync your payroll. Salaries, vendor fees, and commissions go out in seconds, not days."
      className="bg-gray-100"
      titleClassName="text-gray-500"
      bodyClassName="text-zinc-800 text-[clamp(0.9375rem,0.926vw,1rem)]"
    >
      <div className="relative aspect-[320/156] w-full grow self-center overflow-hidden [container-type:inline-size] lg:w-[68.966%]">
        <BatchPaymentPreview />
      </div>
    </FeatureCard>
  )
}

const ROSTER_COLUMNS = [
  { label: "S/N", width: "2.4em" },
  { label: "Wallet Address", width: "11.2em" },
  { label: "Role", width: "4.8em" },
  { label: "Status", width: "4em" },
]

const ROSTER_ROWS = [
  ["1", "0xA35f...c19E", "CEO", "Active"],
  ["2", "0xA35f...c19E", "CEO", "Active"],
]

function SignerRoster() {
  return (
    <div className="absolute left-0 top-[5.6em] flex h-[11.2em] w-[25.6em] flex-col gap-[2em] rounded-[1.2em] bg-white p-[1em] shadow-[0_0.42452em_0.80659em_0_rgba(29,30,73,0.12)]">
      <div className="flex items-center justify-between">
        <span className="font-nohemi font-medium leading-[1.17] text-neutral-600 text-[1.026em]">
          Authorized Signers
        </span>
        <span className="px-[1.2em] py-[0.6em]">
          <span className="font-medium leading-[1.2] text-brand-indigo text-[0.718em]">
            View all
          </span>
        </span>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center bg-zinc-100 py-[0.2em]">
          {ROSTER_COLUMNS.map((column) => (
            <RosterCell
              key={column.label}
              width={column.width}
              size="text-[0.564em]"
            >
              {column.label}
            </RosterCell>
          ))}
        </div>

        {ROSTER_ROWS.map((row, index) => (
          <div
            // Two identical rows: the roster is a picture of one, not a list.
            key={index}
            className="flex items-center border-b-[0.026em] border-neutral-300 py-[0.2em]"
          >
            {row.map((value, column) => (
              <RosterCell
                key={ROSTER_COLUMNS[column].label}
                width={ROSTER_COLUMNS[column].width}
                size="text-[0.667em]"
              >
                {value}
              </RosterCell>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function RosterCell({
  width,
  size,
  children,
}: Readonly<{ width: string; size: string; children: React.ReactNode }>) {
  return (
    <span
      style={{ width }}
      className="flex h-[1.2em] shrink-0 items-center justify-center"
    >
      <span className={cn("font-medium leading-[1.2] text-stone-900", size)}>
        {children}
      </span>
    </span>
  )
}

// The glossy stack off the primary button, at the size this one is drawn.
const MINI_BUTTON_SHADOW =
  "shadow-[0px_0.11841em_0.53285em_-0.08881em_rgba(13,15,74,0.25),inset_0px_-0.35523em_0.47365em_-0.20722em_rgba(13,15,74,0.60),inset_0px_-0.11841em_0.05921em_0.0296em_rgba(13,15,74,0.60),inset_0px_0.65126em_0.47365em_-0.20722em_rgba(13,15,74,0.60),inset_0px_0.17762em_0.05921em_0px_rgba(13,15,74,0.22)]"

function BatchPaymentPreview() {
  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 flex flex-col gap-[2.4em] rounded-[1.2em] bg-white p-[2.8em] text-[3.125cqw]",
        "[outline-style:solid] outline-[0.03em] outline-offset-[-0.03em] outline-neutral-300",
        "shadow-[0px_0.2368em_4.618em_1.8354em_rgba(69,74,222,0.08)]",
      )}
    >
      <div className="flex flex-col gap-[2.4em]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[2em]">
            <Image
              src="/icons/chevron-left.svg"
              alt=""
              width={15}
              height={15}
              className="h-auto w-[1.421em]"
            />
            <span className="font-nohemi font-medium text-brand-indigo-950 text-[1.4em]">
              Batch Payment Creation
            </span>
          </div>
          <span className="flex size-[2em] items-center justify-center rounded-[0.281em] bg-rose-100">
            <Image
              src="/icons/close-octagon.svg"
              alt=""
              width={12}
              height={12}
              className="h-auto w-[1.2em]"
            />
          </span>
        </div>

        <div className="flex w-[17.6em] flex-col items-center gap-[0.474em]">
          <Image
            src="/icons/batch-stepper.svg"
            alt=""
            width={172}
            height={15}
            className="h-auto w-[17.2em]"
          />
          {/* The three labels are what set the stepper's width, so they sit
              edge to edge under it and none of them may wrap. */}
          <div className="flex w-full items-center justify-between whitespace-nowrap">
            <span className="text-neutral-600 text-[0.651em]">Details</span>
            <span className="text-neutral-600 text-[0.651em]">
              Select Employees
            </span>
            <span className="text-neutral-500 text-[0.651em]">Preview</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[0.474em]">
        <span className="font-medium text-neutral-500 text-[0.947em]">
          Basic Details
        </span>
        <span className="w-[84.848%] text-neutral-600 text-[0.71em]">
          Set up your payment batch name and approval requirements
        </span>
      </div>

      <div className="flex flex-col items-start gap-[1.4em]">
        <div className="flex w-full flex-col gap-[1.2em]">
          <BatchField label="Batch Name" value="Enter batch name" />
          <BatchField label="Payment Date" value="Oct 21,2025" tinted />
        </div>

        <span
          className={cn(
            "rounded-[0.2em] bg-brand-indigo px-[1.4em] py-[0.8em] [outline-style:solid] outline-[0.118em] outline-brand-indigo-200",
            MINI_BUTTON_SHADOW,
          )}
        >
          <span className="font-medium text-white text-[0.947em]">Next</span>
        </span>
      </div>
    </div>
  )
}

function BatchField({
  label,
  value,
  tinted,
}: Readonly<{ label: string; value: string; tinted?: boolean }>) {
  return (
    <div className="flex w-full flex-col gap-[0.474em]">
      <span className="text-neutral-500 text-[0.77em]">{label}</span>
      <div
        className={cn(
          "flex items-center rounded-[0.4em] px-[1em] py-[0.8em] [outline-style:solid] outline-[0.059em] outline-offset-[-0.059em] outline-neutral-300",
          tinted && "bg-brand-canvas",
        )}
      >
        <span className="text-neutral-800 text-[0.829em]">{value}</span>
      </div>
    </div>
  )
}
