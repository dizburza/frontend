/* eslint-disable @typescript-eslint/no-require-imports */

import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        nohemi: ["var(--font-nohemi)", "sans-serif"],
        lato: ["var(--font-lato)", "sans-serif"],
        raleway: ["var(--font-raleway)", "sans-serif"],
        bricolage: ["var(--font-bricolage)", "sans-serif"],
      },
      colors: {
        // The marketing palette, straight off the Figma file. Figma's dev mode
        // names these as its nearest Tailwind match (bg-teal-100, text-indigo-800),
        // which are approximations, so the hexes are the authority.
        brand: {
          indigo: {
            DEFAULT: "#454ADE",
            50: "#EAEBFF",
            100: "#EAEBFF",
            200: "#C7D2FE",
            800: "#373791",
            900: "#1D1E49",
            950: "#0D0F4A",
          },
          purple: "#792EC2",
          green: "#297714",
          gold: "#DEA045",
          // Close enough to gold and green to look like a mistake, and it is
          // not: these two are the display colours, only ever set on type.
          lime: "#6FDE45",
          amber: "#DEC045",
          mint: {
            DEFAULT: "#C7F9F4",
            200: "#B5E2DE",
          },
          mist: "#F0FDE8",
          lilac: "#FAF6FE",
          canvas: "#F9F9FE",
        },
        // The dashboard chrome. Figma reads these as slate-50/indigo-100 and
        // similar, which are near misses, so the hexes win.
        surface: {
          canvas: "#F9F9FE",
          card: "#FFFFFF",
          sunken: "#F8F9FC",
          header: "#F1F2F9",
          line: "#E9EAF5",
          hairline: "#F0F0F5",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // Half the track, so a strip built from two identical halves loops
        // without a seam.
        "marquee-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "marquee-x": "marquee-x 36s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
