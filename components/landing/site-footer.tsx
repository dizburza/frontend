import Image from "next/image"
import Link from "next/link"

// The four links are the header's, to the same four anchors, so the two
// navigations cannot drift apart.
const LINKS = [
  { label: "About", href: "/#about" },
  { label: "FAQ", href: "/#faq" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
]

export function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-white">
      <div className="mx-auto flex w-full max-w-[1728px] flex-col items-center gap-[clamp(2rem,3.241vw,3.5rem)] px-6 py-14 md:px-10 lg:px-[clamp(3rem,6.481vw,7rem)]">
        {/* Figma's 654 against the 1504 the padding leaves, not against the
            1728 frame. Too small to read on a phone at that fraction, so it
            takes most of the width there and settles onto the design's at lg. */}
        <Image
          src="/images/dizburza-wordmark.png"
          alt="Dizburza"
          width={655}
          height={128}
          sizes="(max-width: 1024px) 70vw, 654px"
          className="h-auto w-[70%] max-w-[654px] lg:w-[43.492%]"
        />

        <div className="flex w-full flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <nav className="flex flex-wrap items-center justify-center">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-sm px-4 py-2 text-gray-500 transition-colors hover:text-gray-600"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Rendered rather than written down, so it cannot go stale between
              deploys. */}
          <p className="text-center leading-[1.43] text-gray-500 text-sm">
            © {new Date().getFullYear()} Dizburza. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
