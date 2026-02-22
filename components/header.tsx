import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Image src="logo.svg" alt="Logo" width="150" height="200"/>
        
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

      <Link href="/setup-profile"> <button className="px-6 py-2 bg-[#454ADE] text-white rounded-lg hover:bg-gray-900 text-sm font-medium">
        Get Started
      </button></Link>
    </header>
  )
}
