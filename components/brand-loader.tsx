import Image from "next/image";

type BrandLoaderProps = {
  /** Sits under the mark. Kept to a few words: it is read in passing. */
  label?: string;
  className?: string;
};

/**
 * The wordmark with a sheen passing over it, for waits long enough that a bare
 * skeleton reads as a stalled page.
 *
 * The logo is a raster inside an SVG, so the sheen is a gradient swept across
 * it rather than anything drawn on its paths.
 */
export function BrandLoader({ label, className = "" }: Readonly<BrandLoaderProps>) {
  return (
    <output
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <span className="relative inline-flex animate-logo-breathe overflow-hidden">
        <Image
          src="/logo.svg"
          alt="Dizburza"
          width={169}
          height={33}
          priority
          className="h-8 w-auto"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-1/2 animate-logo-sheen bg-gradient-to-r from-transparent via-white/70 to-transparent"
        />
      </span>

      {label ? <span className="text-xs text-gray-500">{label}</span> : null}
    </output>
  );
}

/**
 * The dashboard's waiting state: the page's shape faded back with the mark over
 * it. Shared by the route-level loading files and the organization guard, which
 * all render the same wait.
 */
export function DashboardLoading() {
  return (
    <div className="relative w-full px-1 py-6 lg:px-10">
      <div className="space-y-6 opacity-40">
        <div className="h-10 w-64 rounded bg-gray-200" />
        <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="h-[420px] rounded-lg bg-gray-200" />
          <div className="h-[420px] rounded-lg bg-gray-200" />
        </div>
      </div>

      <BrandLoader className="absolute inset-x-0 top-48" />
    </div>
  );
}
