"use client"

import { useEffect, useId, useRef, useState } from "react"
import { FieldIcon, type FieldIconName } from "@/components/organization-setup/field-icon"

interface FieldSelectProps {
  label: string
  placeholder: string
  icon: FieldIconName
  value: string
  options: string[]
  onChange: (value: string) => void
}

export function FieldSelect({ label, placeholder, icon, value, options, onChange }: Readonly<FieldSelectProps>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative flex flex-col items-start gap-2 w-full">
      <label htmlFor={id} className="text-neutral-500 text-xs font-normal font-inter">
        {label}
      </label>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 bg-slate-50 rounded-lg outline outline-1 outline-offset-[-1px] outline-indigo-200 flex justify-between items-center text-left"
      >
        <span className="flex items-center gap-2">
          <FieldIcon name={icon} className="shrink-0" />
          <span className={`text-sm font-normal font-inter ${value ? "text-neutral-800" : "text-gray-600"}`}>
            {value || placeholder}
          </span>
        </span>
        <FieldIcon name="arrow-down" className="shrink-0" />
      </button>

      {open ? (
        <div className="absolute top-full left-0 mt-1 w-full max-h-52 overflow-y-auto bg-white rounded-lg shadow-lg outline outline-1 outline-offset-[-1px] outline-indigo-100 z-20">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-inter hover:bg-indigo-50 ${
                option === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
