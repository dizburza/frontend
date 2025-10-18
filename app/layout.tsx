import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Dizburza",
  description: "The Smarter Way to Pay and Disburse",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black font-sans antialiased">{children}</body>
    </html>
  )
}
