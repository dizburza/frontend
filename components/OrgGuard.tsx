"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveAccount } from "thirdweb/react";

type CachedAuthCheck = {
  isRegistered: boolean;
  username?: string;
  fullName?: string;
  avatar?: string;
  role?: "employee" | "signer" | "admin";
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
      if (cached.role === "employee") {
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
        const upstream = `/api/auth/check/${address}`;

        const res = await fetch(upstream, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          router.replace("/setup-profile");
          return;
        }

        const payload = (await res.json()) as {
          data?: {
            isRegistered?: boolean;
            user?: {
              role?: "employee" | "signer" | "admin";
              organizationSlug?: string;
              username?: string;
              fullName?: string;
              avatar?: string;
            };
          };
        };

        const isRegistered = Boolean(payload.data?.isRegistered);
        if (!isRegistered) {
          router.replace("/setup-profile");
          return;
        }

        const user = payload.data?.user;
        const toCache: CachedAuthCheck = {
          isRegistered,
          role: user?.role || "employee",
          organizationSlug: user?.organizationSlug,
          username: user?.username,
          fullName: user?.fullName,
          avatar: user?.avatar,
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
