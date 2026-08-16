import Image from "next/image"

// Order matters: the row reads left to right exactly as it sits in the design.
const LOGOS = [
  "/images/icon-1.png",
  "/images/icon-2.png",
  "/images/icon-3.png",
  "/images/icon-4.png",
  "/images/icon-5.png",
  "/images/icon-6.png",
]

export function TrustedBy() {
  return (
    // Same base as ActiveUsers, so the pair scales together with the frame.
    <div className="flex w-[14em] flex-col gap-3 text-[clamp(0.875rem,0.926vw,1rem)]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center">
          {Array.from({ length: 5 }, (_, i) => (
            <Image
              key={i}
              src="/icons/star.svg"
              alt=""
              width={12}
              height={12}
              className="size-[0.75em]"
            />
          ))}
          <span className="sr-only">Rated 5 out of 5</span>
        </div>
        <p className="w-[11em] text-gray-500">
          Trusted by Individuals and Organizations.
        </p>
      </div>

      {/* Each logo sits half under the next, so the row reads as a stack. */}
      <div className="flex items-center -space-x-[1.25em]">
        {LOGOS.map((src) => (
          <span
            key={src}
            className="flex size-[2.5em] shrink-0 items-center justify-center rounded-full bg-brand-indigo-50 p-[0.18em] outline outline-[1.43px] outline-offset-[-1.43px] outline-brand-indigo-50"
          >
            <Image
              src={src}
              alt=""
              width={34}
              height={34}
              className="size-[2em] rounded-full object-cover"
            />
          </span>
        ))}
      </div>
    </div>
  )
}
