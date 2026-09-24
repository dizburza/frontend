import Image from "next/image"

// Scattered around the seal, at the offsets the design places them.
const CONFETTI = [
  { src: "/icons/confetti-capsule.svg", size: [6, 11], className: "left-[9px] top-[47px]" },
  { src: "/icons/confetti-star-sm.svg", size: [5, 5], className: "left-[26px] top-[31px]" },
  { src: "/icons/confetti-dot-blue.svg", size: [9, 9], className: "left-[2px] top-[66px]" },
  { src: "/icons/confetti-star-lg.svg", size: [9, 9], className: "right-[6px] top-[10px]" },
  { src: "/icons/confetti-dot-lime.svg", size: [9, 9], className: "right-[14px] top-[39px]" },
  { src: "/icons/confetti-capsule.svg", size: [6, 11], className: "left-[63px] bottom-[6px]" },
  { src: "/icons/confetti-triangle.svg", size: [10, 9], className: "left-[81px] bottom-[2px]" },
  { src: "/icons/confetti-star-alt.svg", size: [5, 5], className: "right-[24px] bottom-[18px]" },
]

/** The seal every "done" screen ends on. */
export function SuccessSeal() {
  return (
    <div className="size-36 relative bg-indigo-50 rounded-full flex items-center justify-center">
      <Image src="/icons/ph_seal-check-fill.svg" alt="" width={112} height={112} />
      {CONFETTI.map((piece) => (
        <Image
          key={piece.src + piece.className}
          src={piece.src}
          alt=""
          width={piece.size[0]}
          height={piece.size[1]}
          className={`absolute ${piece.className}`}
        />
      ))}
    </div>
  )
}
