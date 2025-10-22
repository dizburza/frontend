"use client"

import type React from "react"
import { useState, useRef } from "react"
import Image from "next/image"

interface FileUploadAreaProps {
  onFileSelect?: (file: File) => void
  accept?: string
  maxSize?: number
}

export default function FileUploadArea({
  onFileSelect,
  accept = "image/png,image/jpeg",
  maxSize = 15 * 1024 * 1024, // 15MB
}: FileUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    const validTypes = ["image/png", "image/jpeg"]

    if (!validTypes.includes(file.type)) {
      setError("Only PNG and JPEG files are allowed")
      return false
    }

    if (file.size > maxSize) {
      setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
      return false
    }

    setError("")
    return true
  }

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setUploadedFile(file)
      onFileSelect?.(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          {uploadedFile ? (
            <div className="relative w-20 h-20">
              <Image
                src={URL.createObjectURL(uploadedFile) || "/placeholder.svg"}
                alt="Uploaded preview"
                fill
                className="object-cover rounded"
              />
            </div>
          ) : (
            <Image src="/gallery-add.svg" alt="Upload Image" width={50} height={50} />
          )}

          <p className="text-gray-700">
            {uploadedFile ? (
              <span className="text-green-600 font-medium">{uploadedFile.name}</span>
            ) : (
              <>
                Drop your image here or{" "}
                <button onClick={handleUploadClick} className="text-blue-600 hover:underline font-medium">
                  Upload
                </button>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500">You can upload Png or Jpeg files. Max size 15MB.</p>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        aria-label="File upload"
      />
    </div>
  )
}
