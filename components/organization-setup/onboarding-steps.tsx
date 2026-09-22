import { Fragment } from "react"

const STEPS = ["Your Details", "Organization Details", "Organization Registration"] as const

export type OnboardingStep = 1 | 2 | 3

interface OnboardingStepsProps {
  active: OnboardingStep
}

function Dot({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <div className={`size-5 shrink-0 rounded-full flex items-center justify-center ${filled ? "bg-indigo-100" : "bg-zinc-200"}`}>
      <div className={`size-3 rounded-full ${filled ? "bg-indigo-400" : "bg-gray-300"}`} />
    </div>
  )
}

/**
 * Positioned along the rail rather than pinned to its ends, so a step in the
 * middle sits under its own dot. The first and last are nudged inward because
 * a centred label at 0% or 100% hangs off the edge.
 */
function Label({
  number,
  title,
  dim,
  position,
}: Readonly<{ number: number; title: string; dim: boolean; position: number }>) {
  const alignment =
    position === 0 ? "left-2.5 -translate-x-1/2" : position === 1 ? "right-2.5 translate-x-1/2" : ""

  return (
    <div
      className={`absolute top-full flex flex-col items-center gap-0.5 ${alignment}`}
      style={alignment ? undefined : { left: `${position * 100}%`, transform: "translateX(-50%)" }}
    >
      <div className={`text-xs font-nohemi ${dim ? "font-normal text-gray-600" : "font-medium text-blue-950"}`}>
        Step {number}
      </div>
      <div className={`text-xs font-inter whitespace-nowrap ${dim ? "font-normal text-gray-500" : "font-medium text-gray-600"}`}>
        {title}
      </div>
    </div>
  )
}

export function OnboardingSteps({ active }: Readonly<OnboardingStepsProps>) {
  return (
    <div className="relative mb-6 h-14 w-[440px] max-w-full">
      {/* The rail is a row of its own so it runs dot to dot. Laid out beside
          the labels it would stop at their edges, which are far wider. */}
      <div className="flex items-center">
        {STEPS.map((title, i) => (
          <Fragment key={title}>
            {i > 0 ? <div className="flex-1 h-px bg-zinc-200" /> : null}
            <Dot filled={active >= i + 1} />
          </Fragment>
        ))}
      </div>
      {STEPS.map((title, i) => (
        <Label
          key={title}
          number={i + 1}
          title={title}
          dim={active !== i + 1}
          position={i / (STEPS.length - 1)}
        />
      ))}
    </div>
  )
}
