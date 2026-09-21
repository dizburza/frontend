import Image from "next/image"
import { BrandButton } from "@/components/landing/brand-button"
import { cn } from "@/lib/utils"

// Same convention as the sections above: at 1728 every number is Figma's, and
// below that each one is the same fraction of the viewport with a floor so copy
// stays readable.
//
// The artwork is a pill with a dashed ring around it, and the ring straddles the
// pill's edge rather than sitting outside it. So the box a media column occupies
// is 669x393, the pill inside it 650x374, and everything drawn in the pill is
// placed as a percentage of that. A container query carries the type down with
// it, because the running band is set at a size that only makes sense against
// the width it is drawn at.

export function BuiltForEveryRole() {
  return (
    <section
      id="about"
      className="relative isolate scroll-mt-24 overflow-hidden bg-white"
    >
      <GridBackdrop />

      <div className="mx-auto w-full max-w-[1728px] px-6 pb-[clamp(3.5rem,4.745vw,5.125rem)] pt-[clamp(3.5rem,5.816vw,6.281rem)] md:px-10 lg:px-0">
        <div className="mx-auto flex w-full flex-col items-center gap-[clamp(2rem,3.241vw,3.5rem)] lg:w-[60.764%]">
          <header className="flex flex-col items-center gap-[clamp(1.5rem,1.852vw,2rem)]">
            <h2 className="max-w-[651px] text-balance text-center font-nohemi font-medium leading-[1.2] text-gray-500 text-[clamp(2rem,2.778vw,3rem)]">
              Built for every role in the payment chain.
            </h2>

            <BrandButton
              href="/sign-in"
              className="w-full sm:w-[clamp(11rem,18.519vw,20rem)]"
            >
              Get Started
            </BrandButton>
          </header>

          {/* The rows mirror each other, copy outside then in. `fr` on the Figma
              widths keeps the gap out of the ratio. Below lg the copy leads in
              both, since a picture with no card under it explains nothing.
              The rows stretch rather than centre, so the card takes the capsule's
              height exactly instead of landing near it. */}
          <div className="flex w-full flex-col gap-[clamp(1rem,1.389vw,1.5rem)]">
            <div className="grid gap-[clamp(1rem,1.389vw,1.5rem)] lg:grid-cols-[368fr_669fr]">
              <IndividualCard />
              <IndividualMedia />
            </div>
            <div className="grid gap-[clamp(1rem,1.389vw,1.5rem)] lg:grid-cols-[669fr_368fr]">
              <BusinessMedia className="lg:order-first" />
              <BusinessCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Twenty columns across the 1730 frame and a row every 128px. Held to those
// pitches rather than to the viewport, so the grid stays square on any width.
function GridBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, #EAEBFF 0 2px, transparent 2px 91.053px)," +
          "repeating-linear-gradient(to bottom, #EAEBFF 0 2px, transparent 2px 128px)",
      }}
    />
  )
}

interface RoleCardProps {
  label: string
  body: string
  points: string[]
  className: string
  labelClassName: string
  bodyClassName: string
  bulletClassName: string
}

function RoleCard({
  label,
  body,
  points,
  className,
  labelClassName,
  bodyClassName,
  bulletClassName,
}: Readonly<RoleCardProps>) {
  // Gaps are Figma's 32 and 16. They can be, now that the copy scales all the way
  // down with the card: what used to make this card outgrow the capsule beside it
  // was the type flooring at 15px while the card kept narrowing, which bought the
  // body a fourth line and wrapped a bullet. The card is a hair short of the
  // capsule at every width, and the row's stretch takes up the rest.
  //
  // Not cqw: the card is the container, and a container does not answer its own
  // query units, so the gap here would resolve against the viewport instead.
  return (
    <article
      className={cn(
        "flex flex-col gap-[clamp(1.25rem,1.852vw,2rem)] rounded-[clamp(1rem,1.389vw,1.5rem)] p-[clamp(1rem,1.389vw,1.5rem)] [outline-style:solid] outline-[0.5px] -outline-offset-[0.5px] [container-type:inline-size]",
        className,
      )}
    >
      {/* One line at any width, so the size is a fraction of the card rather
          than of the viewport. Figma sets these at 20px in a 320 card, which
          Nohemi cannot hold here: the browser sets "BUSINESS / ORGANIZATION"
          at 315px against 272px of room. 5.25cqw is the largest that clears
          the longer of the two with the tracking on. */}
      <p
        className={cn(
          "whitespace-nowrap rounded-full px-[6.25cqw] py-[5cqw] text-center font-nohemi font-semibold tracking-[0.1em] text-neutral-50 text-[5.25cqw]",
          labelClassName,
        )}
      >
        {label}
      </p>

      <div className="flex flex-col gap-[clamp(0.625rem,0.926vw,1rem)]">
        <p
          className={cn(
            "leading-[1.5] text-[clamp(0.8125rem,0.926vw,1rem)]",
            bodyClassName,
          )}
        >
          {body}
        </p>

        <ul className="flex flex-col">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-center gap-[clamp(0.625rem,0.926vw,1rem)]"
            >
              <BulletArrow className={bulletClassName} />
              <span className="font-semibold leading-[1.5] text-gray-600 text-[clamp(0.8125rem,0.926vw,1rem)]">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

function IndividualCard() {
  return (
    <RoleCard
      label="INDIVIDUAL / EMPLOYEE"
      body="Receive your salary, freelance fees, or vendor payments directly into your Dizburza wallet. Send, save, or spend"
      points={[
        "Instant payment notifications",
        "Personal wallet dashboard",
        "Send to any wallet worldwide",
        "Full transaction history",
        "No bank account required",
      ]}
      className="bg-brand-lilac outline-purple-300"
      labelClassName="bg-[#9145DE]"
      bodyClassName="text-[#380E5D]"
      bulletClassName="text-violet-300"
    />
  )
}

function BusinessCard() {
  return (
    <RoleCard
      label="BUSINESS / ORGANIZATION"
      body="From startups to established enterprises, manage your treasury, run payroll, pay vendors, and stay audit-ready."
      points={[
        "Multi-sig approval workflows",
        "Bulk payroll disbursement",
        "Real-time treasury dashboard",
        "Role-based access control",
        "Exportable compliance reports",
      ]}
      className="bg-brand-indigo-50 outline-indigo-400"
      labelClassName="bg-brand-indigo"
      bodyClassName="text-brand-indigo-950"
      bulletClassName="text-indigo-400"
    />
  )
}

// Both exports are landscape and the disc is square, so they are covered into it
// rather than placed: Figma's offsets were measured against a taller crop of the
// same photograph and would leave a gap under either of these.
interface Portrait {
  src: string
  alt: string
}

const INDIVIDUAL: Portrait = {
  src: "/images/role-individual.png",
  alt: "Someone paid through Dizburza",
}

const BUSINESS: Portrait = {
  src: "/images/role-business.png",
  alt: "A finance lead running payroll",
}

// Everything below is drawn against the 650x374 pill. The ring is an SVG rather
// than a border because CSS ties a dash to the line's thickness, and this one is
// 11px thick with 2px ticks.
interface RoleMediaProps {
  portrait: Portrait
  className?: string
  ringClassName: string
  fillClassName: string
  waveClassName: string
  marqueeClassName?: string
}

function RoleMedia({
  portrait,
  className,
  ringClassName,
  fillClassName,
  waveClassName,
  marqueeClassName,
}: Readonly<RoleMediaProps>) {
  // Centred in its own cell: the capsule's height is its width, so it cannot
  // stretch, and the row is only taller than it on a narrow desktop.
  return (
    <div
      className={cn("relative aspect-[669/393] w-full lg:self-center", className)}
    >
      <svg
        viewBox="0 0 669 393"
        fill="none"
        aria-hidden
        className="absolute inset-0 size-full"
      >
        <path
          d="M472.5 5.5H196.5C91.0136 5.5 5.5 91.0136 5.5 196.5C5.5 301.986 91.0136 387.5 196.5 387.5H472.5C577.986 387.5 663.5 301.986 663.5 196.5C663.5 91.0136 577.986 5.5 472.5 5.5Z"
          strokeWidth={11}
          strokeDasharray="2 2"
          className={ringClassName}
        />
      </svg>

      <div
        className={cn(
          "absolute inset-x-[1.42%] inset-y-[2.417%] overflow-hidden rounded-full [container-type:inline-size]",
          fillClassName,
        )}
      >
        <svg
          viewBox="0 0 650 374"
          fill="none"
          aria-hidden
          className="absolute inset-0 size-full"
        >
          <path
            d="M0 18.3765C36.1111 7.43014 121.173 -10.084 172.531 7.43014C236.728 29.3229 298.251 58.0962 365.792 28.0718C419.825 4.05237 577.778 4.3026 650 7.43014"
            strokeWidth={22}
            className={waveClassName}
          />
        </svg>

        <Marquee className={marqueeClassName} />

        <div className="absolute left-1/2 top-[10.695%] aspect-square w-[59.077%] -translate-x-1/2 overflow-hidden rounded-full">
          <Image
            src={portrait.src}
            alt={portrait.alt}
            fill
            sizes="(max-width: 1024px) 66vw, 384px"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  )
}

function IndividualMedia() {
  return (
    <RoleMedia
      portrait={INDIVIDUAL}
      ringClassName="stroke-[#9965C7]"
      fillClassName="bg-[#380E5D]"
      waveClassName="stroke-purple-400/25"
    />
  )
}

function BusinessMedia({ className }: Readonly<{ className?: string }>) {
  return (
    <RoleMedia
      portrait={BUSINESS}
      className={className}
      ringClassName="stroke-indigo-400"
      fillClassName="bg-brand-indigo-900"
      waveClassName="stroke-[#A8BDF9]/25"
      // The two bands read as one strip running behind the section, so they are
      // never at the same point in it.
      marqueeClassName="[animation-delay:-18s]"
    />
  )
}

// Two identical halves, translated by half the track. The sentence is doubled
// inside each half so a half is always wider than the pill, which is what keeps
// the band full at the moment it wraps.
function Marquee({ className }: Readonly<{ className?: string }>) {
  return (
    <div className="absolute inset-x-0 top-[43.048%] flex h-[13.904%] items-center overflow-hidden bg-[#B1FA96]">
      <div
        className={cn(
          "flex w-max animate-marquee-x whitespace-nowrap text-brand-indigo-900 text-[3.077cqw] leading-[1.4] motion-reduce:animate-none",
          className,
        )}
      >
        {[0, 1].map((half) => (
          <span key={half} className="flex shrink-0">
            {[0, 1].map((copy) => (
              <span key={copy} className="pr-[0.5em]">
                The <strong className="font-bold">business</strong> that pays.
                The <strong className="font-bold">individual</strong> that gets
                paid. One <strong className="font-bold">home</strong> for both.
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

function BulletArrow({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden
      className={cn(
        "h-auto w-[clamp(1.5rem,1.852vw,2rem)] shrink-0",
        className,
      )}
    >
      <path d="M13.4153 17.9993H22.1433C21.0713 21.1453 26.1993 25.6113 32.0013 16.9993C26.2013 8.38731 21.0713 12.8533 22.1433 15.9993H13.4153L9.70926 12.2913C9.61629 12.1983 9.50591 12.1246 9.38443 12.0743C9.26295 12.0239 9.13275 11.998 9.00126 11.998C8.86978 11.998 8.73958 12.0239 8.6181 12.0743C8.49662 12.1246 8.38624 12.1983 8.29326 12.2913C8.20029 12.3843 8.12653 12.4947 8.07622 12.6161C8.0259 12.7376 8 12.8678 8 12.9993C8 13.1308 8.0259 13.261 8.07622 13.3825C8.12653 13.504 8.20029 13.6143 8.29326 13.7073L10.5873 15.9993H9.41526L5.70926 12.2913C5.61629 12.1983 5.50591 12.1246 5.38443 12.0743C5.26295 12.0239 5.13275 11.998 5.00126 11.998C4.86978 11.998 4.73958 12.0239 4.6181 12.0743C4.49662 12.1246 4.38624 12.1983 4.29326 12.2913C4.20029 12.3843 4.12653 12.4947 4.07622 12.6161C4.0259 12.7376 4 12.8678 4 12.9993C4 13.1308 4.0259 13.261 4.07622 13.3825C4.12653 13.504 4.20029 13.6143 4.29326 13.7073L6.58726 15.9993H5.41526L1.70926 12.2913C1.61629 12.1983 1.50591 12.1246 1.38443 12.0743C1.26295 12.0239 1.13275 11.998 1.00126 11.998C0.869776 11.998 0.739575 12.0239 0.618096 12.0743C0.496617 12.1246 0.386239 12.1983 0.293263 12.2913C0.200287 12.3843 0.126535 12.4947 0.0762166 12.6161C0.0258984 12.7376 0 12.8678 0 12.9993C0 13.1308 0.0258984 13.261 0.0762166 13.3825C0.126535 13.504 0.200287 13.6143 0.293263 13.7073L3.58726 16.9993L0.293263 20.2913C0.10549 20.4791 0 20.7338 0 20.9993C0 21.2649 0.10549 21.5195 0.293263 21.7073C0.481037 21.8951 0.735712 22.0006 1.00126 22.0006C1.26681 22.0006 1.52149 21.8951 1.70926 21.7073L5.41526 17.9993H6.58726L4.29326 20.2913C4.10549 20.4791 4 20.7338 4 20.9993C4 21.2649 4.10549 21.5195 4.29326 21.7073C4.48104 21.8951 4.73571 22.0006 5.00126 22.0006C5.26681 22.0006 5.52149 21.8951 5.70926 21.7073L9.41526 17.9993H10.5873L8.29326 20.2913C8.10549 20.4791 8 20.7338 8 20.9993C8 21.2649 8.10549 21.5195 8.29326 21.7073C8.48104 21.8951 8.73571 22.0006 9.00126 22.0006C9.26682 22.0006 9.52149 21.8951 9.70926 21.7073L13.4153 17.9993Z" />
    </svg>
  )
}
