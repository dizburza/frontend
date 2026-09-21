"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useActiveAccount,
  useActiveWalletConnectionStatus,
} from "thirdweb/react";
import { fetchSessionProfile } from "@/lib/session";
import { PROFILE_CACHE_VERSION } from "@/components/connectWalletHelpers";

type CachedAuthCheck = {
  isRegistered: boolean;
  /** Kept in step with connectWalletHelpers, which refuses entries without it. */
  profileVersion?: number;
  username?: string;
  fullName?: string;
  surname?: string;
  firstname?: string;
  avatar?: string;
  role?: "user" | "employee" | "signer" | "admin";
  organizationSlug?: string;
  savedAt: number;
};

export default function OrgGuard(
  props: Readonly<{ children: React.ReactNode; slug: string }>
) {
  const { children, slug } = props;
  const router = useRouter();
  const account = useActiveAccount();
  const status = useActiveWalletConnectionStatus();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for a settled answer. A refresh reports no account while the stored
    // wallet is restored, and acting on it sends a signed-in person home.
    if (status === "connecting" || status === "unknown") return;

    const address = account?.address;
    if (!address) {
      setAllowed(false);
      router.replace("/");
      return;
    }

    const cacheKey = `authCheck:${address}`;

    const handleAuthCheck = (cached: CachedAuthCheck) => {
      // An employee belongs to an organization but does not run one, so their
      // wallet is the whole app for them. `user` is no membership at all.
      if (cached.role === "employee") {
        router.replace("/personal/wallet");
        return;
      }

      // Signed in with no organization to show, so the way out is creating one.
      const cachedSlug = (cached.organizationSlug || "").trim();
      if (!cachedSlug) {
        router.replace("/organization-setup/organization-details");
        return;
      }

      if (cachedSlug !== slug) {
        router.replace(`/org/${cachedSlug}`);
        return;
      }

      setAllowed(true);
    };

    const readFromCache = () => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return null;
        const cached = JSON.parse(raw) as CachedAuthCheck;
        const isFresh = Date.now() - cached.savedAt < 5 * 60 * 1000;
        if (!isFresh || !cached.isRegistered) return null;
        return cached;
      } catch {
        return null;
      }
    };

    const cached = readFromCache();
    if (cached) {
      handleAuthCheck(cached);
      return;
    }

    const fetchAuthCheck = async () => {
      try {
        // This guard runs inside the dashboard, so a session already exists and
        // the profile comes from it rather than from an address anyone can name.
        const user = await fetchSessionProfile();

        if (!user) {
          router.replace("/sign-in");
          return;
        }

        const toCache: CachedAuthCheck = {
          isRegistered: true,
          profileVersion: PROFILE_CACHE_VERSION,
          role: (user.role ?? "user") as CachedAuthCheck["role"],
          organizationSlug: user.organizationSlug ?? undefined,
          username: user.username,
          fullName: user.fullName,
          surname: user.surname ?? undefined,
          firstname: user.firstname ?? undefined,
          avatar: user.avatar,
          savedAt: Date.now(),
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(toCache));
        } catch {
          // ignore
        }

        handleAuthCheck(toCache);
      } catch {
        router.replace("/sign-in");
      }
    };

    fetchAuthCheck();
  }, [account?.address, router, slug, status]);

  if (allowed !== true) {
    return null;
  }

  return <>{children}</>;
}
