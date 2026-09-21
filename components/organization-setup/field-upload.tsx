"use client"

import { useId, useRef, useState } from "react"
import Image from "next/image"

interface FieldUploadProps {
  label: string
  accept?: string
  maxSizeMb?: number
  onFileSelect?: (file: File) => void
}

export function FieldUpload({ label, accept = "image/png,image/jpeg", maxSizeMb = 15, onFileSelect }: Readonly<FieldUploadProps>) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const handleFile = (file?: File) => {
    if (!file) return
    if (file.size > maxSizeMb * 1024 * 1024) return
    setFileName(file.name)
    onFileSelect?.(file)
  }

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <label htmlFor={id} className="text-neutral-500 text-xs font-normal font-inter">
        {label}
      </label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={`w-full p-6 bg-slate-50 rounded-3xl outline outline-2 outline-offset-[-2px] flex flex-col items-center gap-6 ${
          isDragging ? "outline-indigo-400" : "outline-indigo-100"
        }`}
      >
        <Image src="/gallery-add.svg" alt="" width={40} height={42} />
        <div className="flex flex-col items-center gap-1">
          <div className="text-center">
            {fileName ? (
              <span className="text-indigo-800 text-base font-medium font-inter">{fileName}</span>
            ) : (
              <>
                <span className="text-neutral-600 text-base font-medium font-inter">Drop file here or</span>
                <span className="text-indigo-800 text-base font-medium font-inter"> Upload</span>
              </>
            )}
          </div>
          <div className="text-neutral-500 text-xs font-normal font-inter">
            You can upload Png or Jpeg files. Max size {maxSizeMb}MB.
          </div>
        </div>
      </button>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
