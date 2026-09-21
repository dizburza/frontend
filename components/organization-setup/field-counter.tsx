"use client"

import { useId } from "react"
import { FieldIcon } from "@/components/organization-setup/field-icon"

interface FieldCounterProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  hint?: string
}

export function FieldCounter({ label, value, onChange, min = 0, hint }: Readonly<FieldCounterProps>) {
  const id = useId()

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label htmlFor={id} className="flex items-center gap-2 text-neutral-500 text-xs font-normal font-inter">
        {label}
        {hint ? <FieldIcon name="info-circle" className="shrink-0" /> : null}
      </label>
      <div className="w-full px-4 py-3 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-indigo-200 flex items-center justify-between gap-2">
        <input
          id={id}
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number.parseInt(e.target.value, 10) || 0))}
          className="w-full min-w-0 bg-transparent text-neutral-800 text-sm font-normal font-inter focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex flex-col gap-[1.2px] shrink-0">
          <button
            type="button"
            aria-label={`Increase ${label}`}
            onClick={() => onChange(value + 1)}
            className="px-1.5 h-[7.4px] bg-indigo-100 rounded-t-[2px] flex items-center justify-center"
          >
            <FieldIcon name="arrow-down" className="w-2.5 h-2.5 rotate-180" />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${label}`}
            onClick={() => onChange(Math.max(min, value - 1))}
            className="px-1.5 h-[7.4px] bg-indigo-100 rounded-b-[2px] flex items-center justify-center"
          >
            <FieldIcon name="arrow-down" className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
