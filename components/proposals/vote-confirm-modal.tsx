"use client"

import Image from "next/image"

interface VoteConfirmModalProps {
  choice: "for" | "against"
  onConfirm: () => void
  onCancel: () => void
  isSubmitting: boolean
}

const copy = {
  for: {
    iconBg: "bg-green-50",
    icon: "/icons/vuesax/bold/like.svg",
    action: "vote for",
    actionClassName: "text-lime-800",
    confirmLabel: "Yes, Vote For",
  },
  against: {
    iconBg: "bg-rose-50",
    icon: "/icons/vuesax/bold/dislike.svg",
    action: "vote Against",
    actionClassName: "text-red-700",
    confirmLabel: "Yes, Vote Against",
  },
} as const

/** Sits between a vote button and the actual submit, since a vote can't be undone once cast. */
export function VoteConfirmModal({
  choice,
  onConfirm,
  onCancel,
  isSubmitting,
}: Readonly<VoteConfirmModalProps>) {
  const tone = copy[choice]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm px-4 py-8">
      <div className="w-full max-w-96 p-6 bg-white rounded-xl shadow-[0px_16px_135px_0px_rgba(24,34,57,0.12)] outline outline-[0.5px] outline-offset-[-0.5px] outline-zinc-300 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="size-6 flex items-center justify-center text-orange-700 transition-colors hover:text-orange-800"
        >
          <CloseIcon />
        </button>

        <div className="w-full flex flex-col items-center gap-10">
          <div className="w-full flex flex-col items-center gap-8">
            <div className={`size-24 relative rounded-full flex items-center justify-center ${tone.iconBg}`}>
              <Image src={tone.icon} alt="" width={64} height={64} className="size-16" />
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="text-indigo-950 text-4xl font-medium font-nohemi">Confirm Your Vote</div>
              <div className="w-80 text-center text-sm">
                <span className="text-gray-600 font-normal">Are you sure you want to </span>
                <span className={`font-semibold ${tone.actionClassName}`}>{tone.action}</span>
                <span className="text-gray-600 font-normal">
                  {" "}
                  this proposal. Once submitted, your vote cannot be changed.
                </span>
              </div>
            </div>
          </div>

          <div className="w-full flex items-start gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-violet-50 rounded-sm shadow-[0px_2px_9px_-1.5px_rgba(240,241,253,0.25),inset_0px_-6px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_-2px_1px_0.5px_rgba(240,241,253,0.60),inset_0px_11px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_3px_1px_0px_rgba(240,241,253,0.22)] outline outline-2 outline-indigo-300 flex justify-center items-center gap-2.5 text-blue-950 text-base font-medium transition-[filter] hover:brightness-[1.04] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-6 py-4 bg-indigo-600 rounded-sm shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)] outline outline-2 outline-indigo-400 flex justify-center items-center gap-2.5 text-white text-base font-medium transition-[filter] hover:brightness-[1.04] disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : tone.confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-6">
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m9 9 6 6M15 9l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
