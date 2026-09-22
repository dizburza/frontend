"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  icon: ReactNode;
  value: string;
  /** Turns the whole figure row into a link through to the detail page. */
  href?: string;
  hint?: string;
};

export function StatCard({ label, icon, value, href, hint }: StatCardProps) {
  const figure = (
    <div className="flex flex-1 items-center justify-between rounded-[4px] bg-surface-sunken p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-200">
      <span className="font-bricolage text-xl font-extrabold text-zinc-800">{value}</span>
      {href ? (
        <Image src="/icons/broken-arrow-up.svg" alt="" width={20} height={20} className="size-5 shrink-0" />
      ) : null}
    </div>
  );

  return (
    <div className="flex h-full flex-col gap-2.5 rounded-lg bg-white px-2 pb-3 pt-4 outline outline-1 -outline-offset-1 outline-[#EEF0FC]">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-end gap-2">
          {icon}
          <span className="font-bricolage text-xs font-semibold text-zinc-600">{label}</span>
        </div>
        {hint ? (
          <span title={hint} className="shrink-0 cursor-help">
            <Image src="/icons/information.svg" alt="" width={14} height={14} className="size-3.5" />
          </span>
        ) : null}
      </div>
      {href ? (
        <Link href={href} className="flex flex-1 transition-opacity hover:opacity-80">
          {figure}
        </Link>
      ) : (
        figure
      )}
    </div>
  );
}
