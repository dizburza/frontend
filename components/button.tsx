import { Button as ShadcnButton } from "@/components/ui/button"
import type React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export default function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <ShadcnButton
      className={`px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-900 font-medium ${className}`}
      {...props}
    >
      {children}
    </ShadcnButton>
  )
}
