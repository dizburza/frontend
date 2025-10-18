"use client"

import Image from "next/image"

interface AccountTypeOptionProps {
  type: "personal" | "business"
  title: string
  description: string
  selected: boolean
  onChange: () => void
}

export default function AccountTypeOption({ type, title, description, selected, onChange }: AccountTypeOptionProps) {
  return (
    <button
      onClick={onChange}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected ? "border-black bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
     <Image src={type === "personal" ? "personal-icon.svg" : "business-icon.svg"} alt={`${type} icon`} width={40} height={40} className="mb-4" />
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </button>
  )
}
