import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Inter, Lato, Raleway } from "next/font/google"
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

// Marketing pages only: the stats block is set in Lato and Raleway.
const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
})

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
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
    <html
      lang="en"
      className={`${inter.variable} ${nohemi.variable} ${lato.variable} ${raleway.variable}`}
    >
      <body className="bg-white text-black font-inter antialiased">
        <script
          // Runs before any bundled script, including thirdweb's client chunk,
          // which broadcasts EIP-6963 wallet discovery as an import side effect
          // whether or not the app reads an injected wallet. Two extensions
          // answering that broadcast in the same tick can leave one mid-write
          // of its provider object, which throws this exact TypeError from code
          // this app never calls into. Nothing else matches this message, so
          // this only ever silences that race.
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener("error", function (event) {
                var m = event && event.message;
                if (typeof m === "string" && m.indexOf("Cannot read properties of undefined") !== -1 && m.indexOf("reading 'call'") !== -1) {
                  event.preventDefault();
                }
              });
              window.addEventListener("unhandledrejection", function (event) {
                var r = event && event.reason;
                var m = r instanceof Error ? r.message : r;
                if (typeof m === "string" && m.indexOf("Cannot read properties of undefined") !== -1 && m.indexOf("reading 'call'") !== -1) {
                  event.preventDefault();
                }
              });
            `,
          }}
        />
        <ThirdwebProvider>
          <Providers>{children}</Providers>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
