"use client"

import type { ButtonHTMLAttributes } from "react"

type OnboardingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary"
}

/**
 * Disabled drops the shadow and the saturation rather than only dimming. At
 * 60% opacity a filled indigo button still reads as pressable, which is how a
 * form that will not submit looks like one that will.
 */
const base =
  "px-6 py-4 rounded-sm outline outline-2 flex justify-center items-center gap-2 text-base font-medium cursor-pointer transition-colors disabled:cursor-not-allowed disabled:shadow-none disabled:bg-zinc-200 disabled:text-gray-500 disabled:outline-zinc-200"

const variants = {
  primary:
    "bg-indigo-700 outline-indigo-200 text-white font-nohemi shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)]",
  secondary:
    "bg-violet-50 outline-indigo-50 text-blue-950 font-inter shadow-[0px_2px_9px_-1.5px_rgba(240,241,253,0.25),inset_0px_-6px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_-2px_1px_0.5px_rgba(240,241,253,0.60),inset_0px_11px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_3px_1px_0px_rgba(240,241,253,0.22)]",
}

export function OnboardingButton({ variant = "primary", className = "", ...props }: Readonly<OnboardingButtonProps>) {
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props} />
}
