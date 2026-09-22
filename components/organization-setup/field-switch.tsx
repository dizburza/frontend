"use client"

import { useId } from "react"

interface FieldSwitchProps {
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function FieldSwitch({ label, hint, checked, onChange }: Readonly<FieldSwitchProps>) {
  const id = useId()

  return (
    <div className="flex w-full items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="font-inter text-xs font-medium text-neutral-700">
          {label}
        </label>
        {hint ? <p className="font-inter text-[11px] text-neutral-500">{hint}</p> : null}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${
            checked ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  )
}
