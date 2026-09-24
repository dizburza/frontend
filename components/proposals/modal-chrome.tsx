"use client"

import type { ReactNode } from "react"

interface ModalChromeProps {
  title: string
  onBack: () => void
  onClose: () => void
  children: ReactNode
}

/** The card both steps of the create flow sit in, header included. */
export function ModalChrome({ title, onBack, onClose, children }: Readonly<ModalChromeProps>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-[895px] p-6 sm:p-12 bg-white rounded-[20px] shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-neutral-300 flex flex-col justify-start items-start gap-8 sm:gap-10">
        <div className="self-stretch flex justify-between items-center">
          <div className="flex justify-start items-center gap-4 sm:gap-8">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="size-6 flex items-center justify-center text-neutral-500 transition-colors hover:text-neutral-700"
            >
              <ChevronLeftIcon />
            </button>
            <div className="text-blue-950 text-2xl font-medium font-nohemi">{title}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-8 bg-rose-100 rounded-sm flex items-center justify-center overflow-hidden transition-colors hover:bg-rose-200"
          >
            <CloseCircleIcon />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-6">
      <path
        d="M15 19.92 8.48 13.4a1.98 1.98 0 0 1 0-2.8L15 4.08"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-5">
      <path
        d="M10 18.333A8.333 8.333 0 1 0 10 1.667a8.333 8.333 0 0 0 0 16.666Z"
        stroke="#7F1D1D"
        strokeWidth="1.19"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7.642 12.358 4.716-4.716M12.358 12.358 7.642 7.642"
        stroke="#7F1D1D"
        strokeWidth="1.19"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
