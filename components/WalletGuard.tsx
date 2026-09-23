"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  useActiveAccount,
  useActiveWalletConnectionStatus,
} from "thirdweb/react";

import { readSessionHint } from "@/lib/session";

/**
 * How long a session hint alone keeps the page rendered while the wallet
 * restores. Short on purpose: reads work without a wallet, so this only has to
 * outlast the gap before the restore settles, and anyone whose hint is stale
 * should reach sign-in quickly rather than watch a skeleton.
 */
const RESTORE_GRACE_MS = 20_000;

export default function WalletGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const account = useActiveAccount();
  const status = useActiveWalletConnectionStatus();
  const router = useRouter();
  const pathname = usePathname();

  // Read after mount, since the cookie is not there during the server render
  // and reading it inline would make the two disagree.
  //
  // Bounded rather than held until the wallet appears: a restore that never
  // finishes must end somewhere the user can act, not a skeleton that waits
  // forever on a wallet that is not coming back.
  const [restoring, setRestoring] = useState(false);
  const [graceElapsed, setGraceElapsed] = useState(false);

  useEffect(() => {
    const hint = readSessionHint();
    if (!hint || hint.expiresAt <= Date.now()) {
      setGraceElapsed(true);
      return;
    }

    setRestoring(true);
    const timer = setTimeout(() => {
      setRestoring(false);
      setGraceElapsed(true);
    }, RESTORE_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);

  const settled = status !== "connecting" && status !== "unknown";
  const signedOut = settled && graceElapsed && !account?.address && !restoring;

  // Signing in again is a sign-in, not a wallet connection. Someone returning
  // after their session lapsed gets the branded page with Google, email and
  // passkey on it, the same one they used the first time, rather than a wallet
  // picker that gives away what this is built on.
  //
  // The route they wanted is carried across so it reopens once they are back.
  useEffect(() => {
    if (!signedOut) return;

    const next = encodeURIComponent(pathname || "/");
    router.replace(`/sign-in?next=${next}`);
  }, [signedOut, pathname, router]);

  // A live session is enough to render. Reads are served from the backend
  // against the session cookie, so waiting for the signing wallet would hold
  // the whole page behind work only writes need. Write actions gate themselves
  // on `canSign` from useSessionIdentity.
  if (account?.address || restoring) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-surface-canvas px-4 pb-10 pt-5 sm:px-6 lg:px-5">
      <div className="h-16 w-full animate-pulse rounded-lg bg-gray-200" />
      <div className="mt-6 space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-[360px] w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}
