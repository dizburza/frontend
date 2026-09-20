// Two identical halves, translated by half the track. The sentence is doubled
// inside each half so a half is always wider than the ribbon, which is what
// keeps it full at the moment it wraps.
export default function MarqueeRibbon() {
  return (
    <div className="absolute bottom-[20%] left-1/2 w-[140%] -translate-x-1/2 -rotate-[20deg] overflow-hidden rounded-lg bg-brand-lime py-3">
      <div className="flex w-max animate-marquee-x whitespace-nowrap text-xl leading-7 text-brand-indigo-900 motion-reduce:animate-none">
        {[0, 1].map((half) => (
          <span key={half} className="flex shrink-0">
            {[0, 1].map((copy) => (
              <span key={copy} className="pr-[0.5em]">
                The <strong className="font-bold">organization</strong> that pays.
                The employees that gets paid. One{" "}
                <strong className="font-bold">home</strong> for both. The{" "}
                <strong className="font-bold">organization</strong> that pays.
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
