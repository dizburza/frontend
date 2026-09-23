"use client";

import type { ReactNode } from "react";
import { Loader2, X } from "lucide-react";

type ConfirmModalProps = {
  icon: ReactNode;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** Destructive actions get the red button; everything else is indigo. */
  tone?: "primary" | "danger";
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  icon,
  title,
  body,
  confirmLabel,
  tone = "primary",
  busy = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full bg-red-500 text-white transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <X className="size-3" />
        </button>

        <div className="mb-4 flex justify-center">{icon}</div>

        <h2 className="mb-2 font-nohemi text-xl text-[#1D1E49]">{title}</h2>
        <div className="mb-6 text-sm text-neutral-500">{body}</div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="shrink-0 rounded-[4px] border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[4px] px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${
              tone === "danger" ? "bg-red-600" : "bg-[#4F51D9]"
            }`}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
