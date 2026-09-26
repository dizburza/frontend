"use client";

import Image from "next/image";

type QrPromoCardProps = {
  onShow: () => void;
};

export function QrPromoCard({ onShow }: Readonly<QrPromoCardProps>) {
  return (
    <section className="flex flex-col gap-8 overflow-hidden rounded-lg bg-white px-4 py-5 outline outline-[0.5px] -outline-offset-[0.5px] outline-gray-300">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/images/qr-code.jpg"
            alt=""
            width={24}
            height={24}
            className="size-6 rounded-full border border-brand-indigo-100 object-cover"
          />
          <h2 className="font-nohemi text-xl font-medium text-zinc-500">Get paid by QR</h2>
        </div>
        <p className="text-base text-zinc-800">
          Let someone scan your QR code and send money in seconds.
        </p>
      </div>

      <button
        type="button"
        onClick={onShow}
        className="flex h-11 items-center justify-center rounded-sm bg-violet-50 px-6 py-3 text-base font-medium text-blue-950 outline outline-1 outline-indigo-400 shadow-[inset_0px_-6px_8px_-3.5px_rgba(240,241,253,0.60),inset_0px_11px_8px_-3.5px_rgba(240,241,253,0.60)] transition-colors hover:bg-violet-100"
      >
        Show QR
      </button>
    </section>
  );
}
