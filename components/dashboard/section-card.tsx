"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  viewAllHref?: string;
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, viewAllHref, children, className = "" }: SectionCardProps) {
  return (
    <section
      className={`flex flex-col gap-3 rounded-lg bg-white p-4 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-100 ${className}`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-nohemi text-sm font-medium leading-4 text-neutral-600">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="shrink-0 px-2 text-sm font-medium leading-4 text-indigo-600 transition-colors hover:text-indigo-800"
          >
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const pillClasses: Record<string, string> = {
  confirmed: "bg-green-50 text-lime-700",
  completed: "bg-green-50 text-lime-700",
  pending: "bg-amber-50 text-yellow-600",
  failed: "bg-red-50 text-red-600",
};

export function StatusPill({ status }: { status: string }) {
  const label = status === "confirmed" ? "Completed" : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium leading-3 ${
        pillClasses[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
}
