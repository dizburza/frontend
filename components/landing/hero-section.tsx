import Image from "next/image"
import { ActiveUsers } from "@/components/landing/active-users"
import { BrandButton } from "@/components/landing/brand-button"
import { HeroNotification } from "@/components/landing/hero-notification"
import { TrustedBy } from "@/components/landing/trusted-by"

// From lg up the section is the Figma frame, 1728x1009, and every block sits at
// the percentage of it Figma placed it at. Nothing is in flow, so the copy
// column cannot stretch the section past the artwork. Type is a fraction of the
// viewport (72px / 1728 = 4.167vw) capped at the design size, so 1728 is exact
// and narrower screens are proportional.
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-brand-canvas">
      <div className="relative mx-auto w-full max-w-[1728px] px-6 py-14 md:px-10 lg:aspect-[1728/1009] lg:px-0 lg:py-0">
        <HeroCurve />

        <div className="lg:absolute lg:left-[6.944%] lg:top-[29.34%] lg:w-[38.14%]">
          {/* Broken where the design breaks it, and held to those two lines. */}
          <h1 className="font-nohemi leading-[1.08] text-[clamp(2.5rem,4.167vw,4.5rem)] lg:whitespace-nowrap">
            <span className="font-normal text-gray-600">The Smarter Way to</span>
            <br />
            <span className="font-bold text-brand-indigo-800">
              Pay and Disburse.
            </span>
          </h1>

          <p className="mt-4 max-w-[617px] text-zinc-800 text-[clamp(1.0625rem,1.389vw,1.5rem)]">
            No more slow approvals or messy payments. Dizburza makes everything
            fast, smooth, and transparent.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
            <BrandButton
              href="/account-type"
              className="sm:w-[clamp(11rem,18.52vw,20rem)]"
            >
              Get Started
            </BrandButton>
            <BrandButton
              href="/#book-a-demo"
              variant="secondary"
              className="sm:w-[clamp(11rem,18.52vw,20rem)]"
            >
              Book a Demo
            </BrandButton>
          </div>
        </div>

        <div className="mt-12 lg:absolute lg:left-[6.944%] lg:top-[79.5%] lg:mt-0">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
            <ActiveUsers />
            <TrustedBy />
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  )
}

function HeroVisual() {
  return (
    <div className="relative mx-auto mt-12 aspect-[890/784] w-full max-w-[890px] lg:absolute lg:left-[44.85%] lg:top-[10.70%] lg:mt-0 lg:h-[77.70%] lg:w-[51.51%] lg:max-w-none">
      {/* The cards are tilted, the subjects inside are not. */}
      <div className="absolute left-[7.19%] top-[5.44%] h-[91.33%] w-[64.36%] origin-top-left rotate-[-8deg] overflow-hidden rounded-[clamp(24px,3vw,46px)] bg-brand-mint shadow-[0px_5.7px_168px_11.5px_rgba(29,30,73,0.10)] outline outline-[1.43px] outline-offset-[-1.43px] outline-brand-mint-200">
        <Image
          src="/images/hero-portrait.png"
          alt="A Dizburza customer paying from her tablet"
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 573px"
          className="rotate-[8deg] scale-110 object-cover object-top"
        />
      </div>

      <div className="absolute left-[60.79%] top-[41.24%] h-[48.98%] w-[32.36%] origin-top-left rotate-[8deg] overflow-hidden rounded-[clamp(24px,3vw,46px)] bg-brand-lilac shadow-[0px_5.7px_117px_31.5px_rgba(8,9,26,0.10)] outline outline-[15.75px] outline-brand-canvas">
        {/* The handset comes tilted in the export, so it is only offset. The
            body sits a little past the screen along the phone's top edge, which
            is the dark rim there. */}
        <div className="absolute left-[-14.66%] top-[-30.55%] h-[148.84%] w-[172.4%]">
          <div className="absolute left-[1.5%] top-[-2.5%] size-full">
            <Image
              src="/images/main.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 60vw, 497px"
              className="object-fill"
            />
          </div>
          <Image
            src="/images/app-preview.png"
            alt="The Dizburza dashboard"
            fill
            sizes="(max-width: 1024px) 60vw, 497px"
            className="object-fill"
          />
        </div>
      </div>

      <HeroNotification
        className="absolute left-0 top-0 max-lg:hidden"
        icon={<SentToBankIcon />}
        tint="bg-brand-canvas"
        label="Sent to Bank"
        amount="cNGN 42,000"
      />

      <HeroNotification
        className="absolute left-[7.33%] top-[88.16%] max-lg:hidden"
        icon={
          <Image
            src="/icons/batch-confirmed.svg"
            alt=""
            width={24}
            height={24}
          />
        }
        tint="bg-brand-mist"
        label="Batch Payment Confirmed"
        amount="cNGN 542,000."
        fraction="10"
      />

      <HeroNotification
        className="absolute left-[69.46%] top-[15.12%] max-lg:hidden"
        icon={
          <Image src="/icons/received.svg" alt="" width={23} height={21} />
        }
        tint="bg-brand-lilac"
        label="Received"
        amount="₦88,000,000"
      />
    </div>
  )
}

// Plane, with the bank badge tucked into its corner. Three exports, assembled
// here at the size the design uses.
function SentToBankIcon() {
  return (
    <span className="relative block size-6">
      <Image
        src="/icons/send.svg"
        alt=""
        width={23}
        height={19}
        className="absolute left-[0.74px] top-[0.74px]"
      />
      <Image
        src="/icons/dot.svg"
        alt=""
        width={10}
        height={10}
        className="absolute left-[13.24px] top-[13.24px]"
      />
      <Image
        src="/icons/bank.svg"
        alt=""
        width={5}
        height={5}
        className="absolute left-[16.02px] top-[16.02px] brightness-0 invert"
      />
    </span>
  )
}

// Vector 21, the arc sweeping behind the stats. The path is Figma's export
// verbatim; the export pads the 843x359 layer by the 2px half-stroke, which is
// the 847x361 viewBox and the 2px offset in the placement below.
//
// Both ends run off the bottom of the hero, which is why the box is taller than
// the room left for it. The apex is a third of the way across, not halfway, so
// the arc is still descending where the stats sit and the tightest clearance is
// at their right edge, under the last of "Trusted by". Vertically it is pinned
// between the two things it has to miss: low enough to clear the buttons, high
// enough that both stats blocks sit inside the arc.
function HeroCurve() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 847 361"
      preserveAspectRatio="none"
      fill="none"
      className="pointer-events-none absolute left-[0.116%] top-[68.4%] hidden h-[35.78%] w-[49.02%] lg:block"
    >
      <path
        d="M1.99609 360.999C19.0707 -19.5507 312.121 -42.6655 408.129 43.0847C614.976 227.833 747.635 52.8358 781.576 126.248C829.141 229.129 817.107 272.156 844.996 360.999"
        stroke="#373791"
        strokeOpacity="0.25"
        strokeWidth="4"
      />
    </svg>
  )
}
