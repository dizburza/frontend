"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type EmployeeActionsProps = {
  /** Only a joined employee has a wallet address, so only they can be a signer. */
  hasJoined: boolean;
  isSigner: boolean;
  onEdit: () => void;
  onAddAsSigner: () => void;
  onSendReminder: () => void;
  onSuspend: () => void;
};

export function EmployeeActions({
  hasJoined,
  isSigner,
  onEdit,
  onAddAsSigner,
  onSendReminder,
  onSuspend,
}: EmployeeActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <div className="relative flex justify-end" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Employee actions"
        className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100"
      >
        <Image src="/icons/mingcute_more-2-fill.svg" alt="" width={16} height={16} className="size-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {/* Promotion needs a wallet address, which only exists once they
              have claimed their invitation. */}
          {hasJoined && !isSigner ? (
            <MenuItem onClick={() => run(onAddAsSigner)}>Add as signer</MenuItem>
          ) : null}

          <MenuItem onClick={() => run(onEdit)}>Edit Details</MenuItem>

          {hasJoined ? null : (
            <MenuItem onClick={() => run(onSendReminder)}>Send Reminder</MenuItem>
          )}

          <MenuItem onClick={() => run(onSuspend)}>Suspend Employee</MenuItem>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="block w-full px-4 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-[#EEF0FC]"
    >
      {children}
    </button>
  );
}
