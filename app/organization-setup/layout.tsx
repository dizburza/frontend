import Image from "next/image"
import type React from "react"
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen bg-[#F9F9FE] relative overflow-hidden overflow-y-auto">

      {/* Header */}
      <header className="relative z-10 bg-white flex items-center h-[80px] justify-between px-8 py-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width="150" height="200"/>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">0x12...abcd</span>
          <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg">👤</span>
          </button>
        </div>
      </header>


       {/* Diagonal geometric background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1600 900">
           <defs>
            <pattern id="diagonals" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="200" y2="200" stroke="currentColor" strokeWidth="3" />
            <line x1="200" y1="0" x2="0" y2="200" stroke="currentColor" strokeWidth="3" />
            </pattern>
        </defs>
          <rect width="1600" height="900" fill="url(#diagonals)" />
        </svg>              
      </div>

      

      {/* Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] h-fit">{children}</main>
    </div>
)
}
