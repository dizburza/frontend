"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";
import { fetchSessionProfile } from "@/lib/session";

type CachedAuthCheck = {
  isRegistered: boolean;
  username?: string;
  fullName?: string;
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
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const address = account?.address;
    if (!address) {
      setAllowed(false);
      router.replace("/");
      return;
    }

    const cacheKey = `authCheck:${address}`;

    const handleAuthCheck = (cached: CachedAuthCheck) => {
      if (cached.role === "employee" || cached.role === "user") {
        router.replace("/personal/wallet");
        return;
      }

      const cachedSlug = (cached.organizationSlug || "").trim();
      if (!cachedSlug) {
        router.replace("/setup-profile");
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
          router.replace("/setup-profile");
          return;
        }

        const toCache: CachedAuthCheck = {
          isRegistered: true,
          role: (user.role ?? "user") as CachedAuthCheck["role"],
          organizationSlug: user.organizationSlug ?? undefined,
          username: user.username,
          fullName: user.fullName,
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
        router.replace("/setup-profile");
      }
    };

    fetchAuthCheck();
  }, [account?.address, router, slug]);

  if (allowed !== true) {
    return null;
  }

  return <>{children}</>;
}
