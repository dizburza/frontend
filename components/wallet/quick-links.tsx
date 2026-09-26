"use client";

import Image from "next/image";
import { ChevronRight, Link2, ScanLine } from "lucide-react";
import type { ReactNode } from "react";

type QuickLink = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
};

type QuickLinksProps = {
  onSend: () => void;
  onCashLink: () => void;
  onReceive: () => void;
  onScan: () => void;
};

export function QuickLinks({
  onSend,
  onCashLink,
  onReceive,
  onScan,
}: Readonly<QuickLinksProps>) {
  const links: QuickLink[] = [
    {
      label: "Send",
      onClick: onSend,
      icon: (
        <Image
          src="/icons/griddy-icons_send-filled.svg"
          alt=""
          width={16}
          height={16}
          className="size-4 brightness-0 invert"
        />
      ),
    },
    {
      label: "Send by Link",
      onClick: onCashLink,
      icon: <Link2 className="size-[18px] text-white" />,
    },
    {
      label: "Receive",
      onClick: onReceive,
      icon: (
        <Image
          src="/icons/reicon_card-receive-filled.svg"
          alt=""
          width={20}
          height={20}
          className="size-5 brightness-0 invert"
        />
      ),
    },
    {
      label: "Scan to pay",
      onClick: onScan,
      icon: <ScanLine className="size-[18px] text-white" />,
    },
  ];

  return (
    <section className="flex flex-col gap-6 rounded-lg bg-white px-2 pb-2 pt-4 outline outline-1 -outline-offset-1 outline-brand-indigo-50">
      <div className="flex items-center justify-between gap-4 px-2">
        <h2 className="font-bricolage text-base font-semibold text-zinc-600">Quick Links</h2>
        <Image
          src="/icons/vuesax/linear/information.svg"
          alt=""
          width={14}
          height={14}
          className="size-3.5"
        />
      </div>

      <div className="flex flex-col rounded-sm bg-surface-sunken p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-200">
        {links.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={link.onClick}
            className="group flex items-center justify-between gap-2 border-b-[0.5px] border-violet-300 px-2 py-3 text-left last:border-b-0"
          >
            <span className="flex items-center gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-indigo transition-transform group-hover:scale-105">
                {link.icon}
              </span>
              <span className="text-base text-stone-900">{link.label}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-brand-indigo transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </section>
  );
}
