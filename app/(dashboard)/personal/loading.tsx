"use client"

export default function Loading() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-6 w-full">
      <div className="h-8 w-56 rounded bg-gray-200 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 min-h-[300px] w-full gap-4">
        <div className="w-full md:col-span-2 lg:col-span-3 h-full">
          <div className="h-[220px] rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="w-full md:col-span-2 lg:col-span-2 h-full">
          <div className="h-[220px] rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="w-full md:col-span-2 lg:col-span-4 h-full">
          <div className="h-[220px] rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
      <div className="h-[360px] rounded bg-gray-200 animate-pulse" />
    </div>
  )
}
