"use client";

import Image from "next/image";

export function BatchPaymentPromo({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-white px-4 py-4 outline outline-[0.5px] -outline-offset-[0.5px] outline-gray-300">
      <Image
        src="/images/pay-multiple.jpg"
        alt=""
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-full border border-[#EEF0FC] object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-nohemi text-base font-medium text-zinc-500">Pay multiple people at once</p>
        <p className="text-xs text-zinc-800">
          Upload a CSV or select employees to send payments in bulk.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="shrink-0 whitespace-nowrap px-4 text-base font-semibold text-indigo-600 transition-colors hover:text-indigo-800"
      >
        Create Batch Payment
      </button>
    </div>
  );
}
