import Image from "next/image"

// Same convention as the sections above: at 1728 every number is Figma's, and
// below that each one is the same fraction of the viewport with a floor so copy
// stays readable.
//
// The questions are `details`, so the section opens and closes with no client
// component and no JS at all. They start open, which is how the design draws
// them, and the browser gives the keyboard and screen reader behaviour for free.

const QUESTIONS = [
  {
    question: "What is Dizburza?",
    answer:
      "A stablecoin-powered platform for managing payments, payroll, and treasury, for businesses and individuals.",
  },
  {
    question: "Do I need crypto knowledge to use it?",
    answer:
      "Not at all. Sign up with Google and your wallet is ready instantly.",
  },
  {
    question: "How does multi-sig work?",
    answer:
      "No payment leaves your treasury until the required number of approvers say so.",
  },
  {
    question: "Can individuals use Dizburza too?",
    answer:
      "Yes. Receive payments, manage your wallet, and send funds globally.",
  },
]

export function FaqSection() {
  return (
    <section className="bg-brand-canvas">
      <div className="mx-auto w-full max-w-[1728px] px-6 py-[clamp(3.5rem,5.15vw,5.5625rem)] md:px-10 lg:px-0">
        {/* `fr` on the Figma widths keeps the gap out of the ratio. */}
        <div className="mx-auto grid w-full gap-[clamp(2.5rem,5.556vw,6rem)] lg:w-[71.296%] lg:grid-cols-[497fr_635fr] lg:items-center">
          <div className="flex flex-col gap-[clamp(1.5rem,1.852vw,2rem)]">
            {/* Broken where the design breaks it. Figma's 384 does it there and
                not here, since Nohemi sets "Frequently Asked" at 392. */}
            <h2 className="max-w-[400px] font-nohemi font-medium leading-[1.2] text-gray-500 text-[clamp(2rem,2.778vw,3rem)]">
              Frequently Asked Questions
            </h2>

            <div className="flex flex-col gap-[clamp(0.75rem,0.926vw,1rem)]">
              <SupportCard
                icon="/icons/faq-support.svg"
                title="Contact live chat support"
                body="24/7 available. No chatbots."
                onDisc
              />
              <SupportCard
                icon="/icons/faq-help.svg"
                title="Visit help center"
                body="Check out explainer flows"
                iconWidth="66.667%"
              />
              <SupportCard
                icon="/icons/faq-demo.svg"
                title="Book a demo"
                body="1:1 talk with a finance specialist."
                iconWidth="75%"
              />
            </div>
          </div>

          <div className="flex flex-col">
            {QUESTIONS.map((item) => (
              <Question key={item.question} {...item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface SupportCardProps {
  icon: string
  title: string
  body: string
  // The three glyphs are drawn at different sizes inside the same 48px well.
  iconWidth?: string
  // The support glyph is white, so it is the only one that needs the indigo
  // disc under it.
  onDisc?: boolean
}

function SupportCard({
  icon,
  title,
  body,
  iconWidth,
  onDisc,
}: Readonly<SupportCardProps>) {
  const glyph = (
    <Image
      src={icon}
      alt=""
      width={48}
      height={48}
      className="h-auto"
      style={{ width: onDisc ? "75%" : iconWidth }}
    />
  )

  return (
    <article className="flex items-start gap-[clamp(0.75rem,0.926vw,1rem)] rounded-lg bg-white p-[clamp(0.875rem,1.157vw,1.25rem)] shadow-[0px_4.245px_8.066px_0px_rgba(29,30,73,0.12)] outline outline-1 -outline-offset-1 outline-gray-100">
      <span className="flex aspect-square w-[clamp(2.5rem,2.778vw,3rem)] shrink-0 items-center justify-center rounded-sm bg-brand-indigo-50">
        {onDisc ? (
          <span className="flex aspect-square w-[66.667%] items-center justify-center rounded-full bg-brand-indigo">
            {glyph}
          </span>
        ) : (
          glyph
        )}
      </span>

      <div className="flex flex-col gap-1">
        <h3 className="font-semibold leading-[1.33] text-zinc-800 text-[clamp(1.125rem,1.736vw,1.875rem)]">
          {title}
        </h3>
        <p className="leading-[1.5] text-gray-600 text-[clamp(0.875rem,0.926vw,1rem)]">
          {body}
        </p>
      </div>
    </article>
  )
}

function Question({
  question,
  answer,
}: Readonly<{ question: string; answer: string }>) {
  return (
    <details
      open
      className="group border-b border-gray-300 px-[clamp(1rem,1.389vw,1.5rem)] pb-[clamp(1.5rem,1.852vw,2rem)] pt-4"
    >
      {/* `list-none` plus the webkit rule is what removes the disclosure
          triangle in every engine. */}
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <h3 className="font-semibold leading-[1.33] text-gray-600 text-[clamp(1.125rem,1.389vw,1.5rem)]">
          {question}
        </h3>
        <Chevron />
      </summary>

      <p className="mt-4 leading-[1.5] text-zinc-800 text-[clamp(0.875rem,0.926vw,1rem)]">
        {answer}
      </p>
    </details>
  )
}

// Drawn pointing up, which is the open state, and turned over when it closes.
function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="w-6 shrink-0 rotate-180 stroke-gray-500 transition-transform group-open:rotate-0"
    >
      <path
        d="M4.08 16.05 12 7.95l7.92 8.1"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
