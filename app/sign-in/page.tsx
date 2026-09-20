"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { useRedirectOnFirstConnect } from "@/components/connectWalletHelpers";
import SignInCard from "@/components/sign-in-card";
import MarqueeRibbon from "@/components/marquee-ribbon";

export default function SignInPage() {
  const router = useRouter();
  const account = useActiveAccount();

  useRedirectOnFirstConnect({ account, router });

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none overflow-hidden">
        <Image
          src="/icons/onboarding-Star.svg"
          alt=""
          width={944}
          height={1041}
          className="absolute -bottom-[5%] left-[5%] w-[21%] opacity-[0.07]"
        />
        <Image
          src="/icons/onboarding-Star-2.svg"
          alt=""
          width={944}
          height={1054}
          className="absolute bottom-[1%] -left-[2%] w-[21%] opacity-[0.07]"
        />
      </div>

      <header className="flex items-center px-10 pb-6 pt-8">
        <Link href="/" className="inline-flex cursor-pointer">
          <Image src="/logo.svg" alt="Dizburza" width={256} height={48} className="h-12 w-64" />
        </Link>
      </header>

      <div className="relative mx-auto grid max-w-[1728px] grid-cols-1 items-center gap-10 px-6 pb-16 lg:grid-cols-[532px_1fr] lg:gap-16 lg:px-[120px]">
        <div className="mx-auto flex w-full max-w-[532px] justify-center">
          <SignInCard />
        </div>

        <div className="relative hidden aspect-[944/1054] w-full overflow-hidden rounded-2xl bg-brand-indigo-200 outline outline-1 outline-offset-[-1px] outline-brand-indigo lg:block">
          <Image
            src="/icons/onboarding-Star.svg"
            alt=""
            fill
            className="object-cover opacity-70"
          />
          <Image
            src="/icons/onboarding-Star-2.svg"
            alt=""
            fill
            className="object-cover opacity-70"
          />
          <Image
            src="/images/onboarding-Image.png"
            alt=""
            width={769}
            height={1089}
            className="absolute left-[9.7%] top-[-2.75%] h-[105.5%] w-[81.5%] object-cover"
          />
          <MarqueeRibbon />
        </div>
      </div>
    </div>
  );
}
