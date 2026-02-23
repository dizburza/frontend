import Image from "next/image";
import Link from "next/link";
import ConnectWallet from "./ConnectWallet";

export default function Header() {
  return (
    <header className="flex h-20 items-center justify-between px-8 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Logo" width={150} height={40} />
      </div>

      <nav className="flex items-center gap-8">
        <Link href="/#about" className="text-sm hover:text-gray-600">
          About
        </Link>
        <Link href="/#faq" className="text-sm hover:text-gray-600">
          FAQ
        </Link>
        <Link href="/#features" className="text-sm hover:text-gray-600">
          Features
        </Link>
        <Link href="/#how-it-works" className="text-sm hover:text-gray-600">
          How It Works
        </Link>
      </nav>

      <ConnectWallet label="Get Started" />
    </header>
  );
}
