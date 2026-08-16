import Link from "next/link"
import { cn } from "@/lib/utils"

// All five glossy layers in one value: Tailwind keeps only the last shadow-[].
const PRIMARY_SHADOW =
  "shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)]"

const SECONDARY_SHADOW =
  "shadow-[0px_2px_9px_-1.5px_rgba(240,241,253,0.25),inset_0px_-6px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_-2px_1px_0.5px_rgba(240,241,253,0.60),inset_0px_11px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_3px_1px_0px_rgba(240,241,253,0.22)]"

const VARIANTS = {
  primary: cn(
    "bg-brand-indigo text-white outline-brand-indigo-200",
    PRIMARY_SHADOW,
  ),
  secondary: cn(
    "bg-brand-indigo-50 text-brand-indigo-950 outline-brand-indigo-100",
    SECONDARY_SHADOW,
  ),
} as const

interface BrandButtonProps {
  href: string
  variant?: keyof typeof VARIANTS
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function BrandButton({
  href,
  variant = "primary",
  leftIcon,
  rightIcon,
  className,
  children,
}: Readonly<BrandButtonProps>) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm px-6 py-4",
        "text-base font-medium outline outline-2 transition-transform active:translate-y-px",
        VARIANTS[variant],
        className,
      )}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}
