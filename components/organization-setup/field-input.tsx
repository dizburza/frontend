"use client"

import { useId } from "react"
import { FieldIcon, type FieldIconName } from "@/components/organization-setup/field-icon"

interface FieldInputProps {
  label: string
  placeholder: string
  icon: FieldIconName
  value: string
  onChange: (value: string) => void
  type?: string
  error?: string
}

export function FieldInput({ label, placeholder, icon, value, onChange, type = "text", error }: Readonly<FieldInputProps>) {
  const id = useId()

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label htmlFor={id} className="text-neutral-500 text-xs font-normal font-inter">
        {label}
      </label>
      <div className="w-full px-4 py-3 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-indigo-200 flex items-center gap-2">
        <FieldIcon name={icon} className="shrink-0" />
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-neutral-800 placeholder:text-gray-600 text-sm font-normal font-inter focus:outline-none"
        />
      </div>
      {error ? <p className="text-xs text-red-600 font-inter">{error}</p> : null}
    </div>
  )
}
