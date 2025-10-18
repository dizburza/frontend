import Image from "next/image";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Image src="logo.svg" alt="Logo" width="150" height="200"/>
        
      </div>

      <nav className="flex items-center gap-8">
        <a href="#" className="text-sm hover:text-gray-600">
          About
        </a>
        <a href="#" className="text-sm hover:text-gray-600">
          FAQ
        </a>
        <a href="#" className="text-sm hover:text-gray-600">
          Features
        </a>
        <a href="#" className="text-sm hover:text-gray-600">
          How It Works
        </a>
      </nav>

      <button className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-900 text-sm font-medium">
        Get Started
      </button>
    </header>
  )
}
