import Image from "next/image"
import { CompatibilityList } from "@/components/landing/compatibility-list"
import { cn } from "@/lib/utils"

const ROUNDING = "rounded-[24px] lg:rounded-[min(3.472vw,60px)]"

// Same discipline as the hero: from lg up this is the Figma frame, 1728x970,
// and every block sits at the percentage of it Figma placed it at. Below lg the
// two panels stack and the devices fall between them.
export function StatsSection() {
  return (
    <section className="bg-white">
      <div className="relative mx-auto w-full max-w-[1728px] px-6 py-14 md:px-10 lg:aspect-[1728/970] lg:px-0 lg:py-0">
        <div className="flex flex-col gap-4 lg:absolute lg:left-[10.938%] lg:top-[7.629%] lg:block lg:h-[80.825%] lg:w-[78.125%]">
          <StatsPanel />
          <CompatibilityPanel />
          {/* Last, because it straddles both panels and sits over them. */}
          <Devices />
        </div>
      </div>
    </section>
  )
}

function StatsPanel() {
  return (
    <div
      className={cn(
        ROUNDING,
        "relative overflow-hidden bg-brand-indigo-100 max-lg:px-6 max-lg:py-10 lg:absolute lg:inset-x-0 lg:top-0 lg:h-[48.98%] lg:rounded-b-none",
      )}
    >
      <div className="grid auto-rows-fr grid-cols-2 gap-6 lg:absolute lg:left-[7.407%] lg:top-1/2 lg:flex lg:-translate-y-1/2 lg:w-[85.185%] lg:items-center lg:justify-between lg:gap-0">
        {/* Two pairs rather than four across: the gap in the middle is where the
            devices sit. */}
        <StatPair>
          <StatCard value="0" label="Payments errors" lead />
          <StatCard value="100%" label="On-chain" />
        </StatPair>
        <StatPair>
          <StatCard value="~2s" label="Approvals" />
          <StatCard value="190+" label="Transactions" />
        </StatPair>
      </div>
    </div>
  )
}

// The pair widens with the cards it holds, so the gap between the two pairs,
// which is where the devices sit, stays where it is.
function StatPair({ children }: { children: React.ReactNode }) {
  return (
    <div className="contents lg:flex lg:w-[42.435%] lg:items-center lg:justify-between">
      {children}
    </div>
  )
}

// `lead` is the one figure the design sets larger than the rest.
function StatCard({
  value,
  label,
  lead,
}: {
  value: string
  label: string
  lead?: boolean
}) {
  return (
    <div className="rounded-[10px] p-0.5 shadow-[0px_4px_7.6px_0px_rgba(29,30,73,0.12)] outline outline-1 outline-offset-[-1px] outline-brand-indigo max-lg:h-full lg:h-[min(7.639vw,132px)] lg:w-[45.902%]">
      {/* Padding scales with the frame like everything else. Held at 12px it
          wraps the longest label at lg, which makes the card taller and drops
          it into the circle. */}
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg bg-white p-3 lg:gap-[min(0.463vw,8px)] lg:p-[min(0.694vw,12px)]">
        <span
          className={cn(
            "font-nohemi font-medium text-brand-indigo-950",
            lead
              ? "text-[2.75rem] lg:text-[min(4.167vw,4.5rem)]"
              : "text-[2.25rem] lg:text-[min(3.472vw,3.75rem)]",
            // 0.75em is what Nohemi's digits actually occupy, which centres the
            // pair in a card the design keeps wider than it is tall. It has to
            // come after the size: twMerge drops a leading set before one.
            "leading-[0.75]",
          )}
        >
          {value}
        </span>
        <span className="text-center text-base leading-tight text-brand-indigo-800 lg:text-[min(1.157vw,1.25rem)]">
          {label}
        </span>
      </div>
    </div>
  )
}

function CompatibilityPanel() {
  return (
    <div
      className={cn(
        ROUNDING,
        "relative overflow-hidden bg-neutral-50 max-lg:order-3 max-lg:px-6 max-lg:py-12 lg:absolute lg:inset-x-0 lg:top-[51.02%] lg:h-[48.98%] lg:rounded-t-none",
      )}
    >
      <GraphPaper />

      <div className="relative flex flex-col items-center gap-8 lg:absolute lg:left-[6.852%] lg:top-[48.177%] lg:w-[87.556%] lg:flex-row lg:gap-0">
        <h2 className="font-nohemi text-[2rem] leading-[1.08] lg:text-[min(3.472vw,3.75rem)] text-zinc-900 max-lg:text-center lg:w-[41.794%] lg:shrink-0">
          Works
          <br />
          seamlessly with
        </h2>

        {/* The bar runs behind the phone, so only the head shows. */}
        <Image
          src="/icons/arrow-right-green.svg"
          alt=""
          width={302}
          height={104}
          className="w-[26.227%] shrink-0 origin-left -rotate-1 max-lg:hidden lg:ml-[1%] lg:mr-[3.907%]"
        />

        <div className="w-full lg:w-[27.072%] lg:shrink-0">
          <CompatibilityList />
        </div>
      </div>
    </div>
  )
}

// The ruled background of the lower panel. Edge to edge in both directions, so
// the outermost lines land on the panel's own edges.
function GraphPaper() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 flex justify-between">
        {Array.from({ length: 13 }, (_, i) => (
          <span key={i} className="w-0.5 bg-brand-indigo-100" />
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col justify-between">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="h-0.5 bg-brand-indigo-100" />
        ))}
      </div>
    </div>
  )
}

function Devices() {
  return (
    <div className="relative mx-auto aspect-[384/585.87] w-[min(384px,80vw)] max-lg:order-2 lg:absolute lg:left-[36.773%] lg:top-[25.255%] lg:h-[69.497%] lg:w-[26.453%]">
      {/* Figma's nearest match, taken literally: the brand scale has no step
          between indigo-100 and the default. */}
      <div className="absolute inset-x-0 top-0 aspect-square rounded-full bg-indigo-400 outline outline-8 outline-brand-indigo-50" />
      <div className="absolute left-[12.24%] top-[8.022%] aspect-square w-3/4 rounded-full bg-brand-indigo-50" />

      <div className="absolute left-[11.458%] top-[14.338%] h-[36.869%] w-[77.344%]">
        <Image
          src="/images/works-laptop.png"
          alt="The Dizburza dashboard on a laptop"
          fill
          sizes="(max-width: 1024px) 62vw, 297px"
          className="object-contain"
        />
      </div>
      <div className="absolute left-[26.563%] top-[32.772%] h-[67.251%] w-[47.396%]">
        <Image
          src="/images/works-phone.png"
          alt="The Dizburza app on a phone"
          fill
          sizes="(max-width: 1024px) 38vw, 182px"
          className="object-contain"
        />
      </div>
    </div>
  )
}
