"use client"

import Image from "next/image"
import type React from "react"

import { useState } from "react"

export default function FileUploadArea() {
  const [isDragging, setIsDragging] = useState(false)

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
    // Handle file drop
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <Image src="gallery-add.svg" alt="Upload Image" width={50} height={50} />
        <p className="text-gray-700">
          Drop your image here or <button className="text-blue-600 hover:underline font-medium">Upload</button>
        </p>
        <p className="text-xs text-gray-500">You can upload Png or Jpeg files. Max size 15MB.</p>
      </div>
    </div>
  )
}
