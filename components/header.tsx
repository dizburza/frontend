"use client";

import Image from "next/image";
import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";
import ConnectWallet from "./ConnectWallet";

const ctaClassName =
  "inline-flex h-auto items-center justify-center rounded-sm bg-brand-indigo px-6 py-4 text-base font-medium text-white shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25)] hover:bg-brand-indigo";

export default function Header() {
  const account = useActiveAccount();

  return (
    <header className="flex items-center justify-between px-28 pb-6 pt-8">
      <Link href="/" className="inline-flex cursor-pointer">
        <Image src="/logo.svg" alt="Dizburza" width={256} height={48} className="h-12 w-64" />
      </Link>

      <nav className="flex items-center">
        <Link
          href="/#about"
          className="rounded-sm px-4 py-2 text-base text-gray-500 hover:text-gray-600"
        >
          About
        </Link>
        <Link
          href="/#faq"
          className="rounded-sm px-4 py-2 text-base text-gray-500 hover:text-gray-600"
        >
          FAQ
        </Link>
        <Link
          href="/#features"
          className="rounded-sm px-4 py-2 text-base text-gray-500 hover:text-gray-600"
        >
          Features
        </Link>
        <Link
          href="/#how-it-works"
          className="rounded-sm px-4 py-2 text-base text-gray-500 hover:text-gray-600"
        >
          How It Works
        </Link>
      </nav>

      {account ? (
        <ConnectWallet connectButtonClassName={ctaClassName} />
      ) : (
        <Link href="/sign-in" className={ctaClassName}>
          Get Started
        </Link>
      )}
    </header>
  );
}
