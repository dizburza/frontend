import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter } from "next/font/google"
import localFont from "next/font/local"
import Providers from "./providers"
import { ThirdwebProvider } from "thirdweb/react"

export const metadata: Metadata = {
  title: "Dizburza",
  description: "The Smarter Way to Pay and Disburse",
}

// Google font (Inter)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

// Local font (Nohemi)
const nohemi = localFont({
  src: [
    {
      path: "../public/fonts/Nohemi-Regular.woff",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Nohemi-Bold.woff",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-nohemi",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${nohemi.variable}`}>
      <body className="bg-white text-black font-inter antialiased">
        <ThirdwebProvider>
          <Providers>{children}</Providers>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
