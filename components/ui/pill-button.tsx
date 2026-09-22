import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// The design's CTAs are all one shape with a stack of inset shadows that reads
// as a moulded key. Five copies of that shadow list is how it drifts, so the
// tone picks the colour and the geometry stays here.
const pillButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[4px] px-6 py-3 text-base font-medium outline outline-2 transition-[filter,opacity] hover:brightness-[1.04] focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      tone: {
        primary:
          "bg-[#4F51D9] text-white outline-[#7E83E8] shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)]",
        soft:
          "bg-[#F0F1FD] text-[#1D1E49] outline-[#A8ACF2] shadow-[0px_2px_9px_-1.5px_rgba(240,241,253,0.25),inset_0px_-6px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_-2px_1px_0.5px_rgba(240,241,253,0.60),inset_0px_11px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_3px_1px_0px_rgba(240,241,253,0.22)]",
        // Sits on the dark treasury card, so it borrows that card's own fill.
        onDark:
          "bg-transparent text-white outline-[#C7C9F7] shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)]",
      },
      size: {
        default: "",
        sm: "px-6 py-2 text-sm",
      },
    },
    defaultVariants: { tone: "primary", size: "default" },
  }
)

export interface PillButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillButtonVariants> {
  asChild?: boolean
}

export const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, tone, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(pillButtonVariants({ tone, size, className }))}
        {...props}
      />
    )
  }
)
PillButton.displayName = "PillButton"

export { pillButtonVariants }
