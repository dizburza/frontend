"use client";

import { Bell, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { flushBackendSyncQueue, getBackendSyncQueueSize } from "@/lib/backend-sync-queue";
import { clearAuthStorage } from "@/hooks/useAutoAuthenticate";

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [accountType, setAccountType] = useState<
    "personal" | "organization" | null
  >(null);

  const [organizationSlug, setOrganizationSlug] = useState<string | null>(null);

  const [profile, setProfile] = useState<{
    initials: string;
    username: string;
    role: string;
    avatar?: string;
  } | null>(null);

  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncingNow, setSyncingNow] = useState(false);

  type Thenable = { then: (onfulfilled?: () => void, onrejected?: () => void) => unknown };
  const isThenable = (value: unknown): value is Thenable => {
    return !!value && typeof value === "object" && "then" in value && typeof (value as { then?: unknown }).then === "function";
  };

  const handleDisconnect = async () => {
    clearAuthStorage();
    try {
      if (wallet) {
        await new Promise<void>((resolve) => {
          try {
            const result = disconnect(wallet) as unknown;
            if (isThenable(result)) {
              result.then(() => resolve(), () => resolve());
              return;
            }
            resolve();
          } catch {
            resolve();
          }
        });
      }
    } finally {
      router.replace("/");
      router.refresh();
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("accountType");
    if (stored) {
      const normalized = stored === "business" ? "organization" : stored;
      setAccountType(normalized as "personal" | "organization");
    } else if (pathname.includes("/personal")) {
      setAccountType("personal");
    } else if (pathname.includes("/organization") || pathname.includes("/org/")) {
      setAccountType("organization");
    }
  }, [pathname]);

  useEffect(() => {
    const address = account?.address;
    if (!address) {
      setProfile(null);
      setOrganizationSlug(null);
      return;
    }

    const cacheKey = `authCheck:${address}`;

    const computeInitials = (params: { fullName?: string; username?: string }) => {
      const { fullName, username } = params;
      const source = (fullName || "").trim();
      if (source) {
        const parts = source.split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || "";
        const second = parts[1]?.[0] || "";
        return `${first}${second}`.toUpperCase() || "?";
      }
      const u = (username || "").trim();
      return (u.slice(0, 2).toUpperCase() || "?");
    };

    const roleLabel = (role: string = "user") => {
      const normalized = role.trim() || "user";
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    };

    const readFromCache = () => {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (!raw) return false;
        const cached = JSON.parse(raw) as {
          savedAt?: number;
          username?: string;
          fullName?: string;
          avatar?: string;
          role?: string;
          organizationSlug?: string;
        };

        const username = cached.username;
        const role = cached.role;
        if (!username) return false;

        setProfile({
          initials: computeInitials({ fullName: cached.fullName, username }),
          username,
          role: roleLabel(role),
          avatar: cached.avatar,
        });

        setOrganizationSlug(cached.organizationSlug || null);
        return true;
      } catch {
        return false;
      }
    };

    const fetchProfile = async () => {
      const hasCache = readFromCache();
      if (hasCache) return;

      try {
        const upstream = `/api/auth/check/${address}`;

        const res = await fetch(upstream, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (!res.ok) return;

        const payload = (await res.json()) as {
          data?: {
            user?: {
              username?: string;
              fullName?: string;
              avatar?: string;
              role?: string;
              organizationSlug?: string;
            };
          };
        };

        const user = payload.data?.user;
        if (!user?.username) return;

        setProfile({
          initials: computeInitials({ fullName: user.fullName, username: user.username }),
          username: user.username,
          role: roleLabel(user.role),
          avatar: user.avatar,
        });

        setOrganizationSlug(user.organizationSlug || null);
      } catch {
        return;
      }
    };

    fetchProfile();
  }, [account?.address]);

  useEffect(() => {
    const update = () => {
      setPendingSyncCount(getBackendSyncQueueSize());
    };

    update();
    const interval = setInterval(update, 5_000);

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("backendSyncQueue:")) {
        update();
      }
    };

    globalThis.addEventListener("storage", onStorage);
    return () => {
      clearInterval(interval);
      globalThis.removeEventListener("storage", onStorage);
    };
  }, []);

  const retrySyncNow = async () => {
    if (syncingNow) return;
    try {
      setSyncingNow(true);
      await flushBackendSyncQueue({ maxJobs: 10 });
      setPendingSyncCount(getBackendSyncQueueSize());
    } finally {
      setSyncingNow(false);
    }
  };

  const tabs = (() => {
    if (accountType === "personal") {
      return [
        { label: "Wallet", href: "/personal/wallet" },
        { label: "Payments", href: "/personal/payments" },
        { label: "Transactions", href: "/personal/transactions" },
        { label: "QR Center", href: "/personal/qr-center" },
      ];
    }

    const base = organizationSlug ? `/org/${organizationSlug}` : "/";
    return [
      { label: "Dashboard", href: base },
      { label: "Employees", href: `${base}/employees` },
      { label: "Proposals", href: `${base}/proposals` },
      { label: "Wallets", href: `${base}/wallet` },
      { label: "Treasury Payments", href: `${base}/payments` },
      { label: "My Transactions", href: `${base}/transactions` },
    ];
  })();

  const isActive = (href: string) => {
    if (!href || href === "/") return pathname === href;

    const orgRoot = organizationSlug ? `/org/${organizationSlug}` : null;
    if (orgRoot && href === orgRoot) {
      return pathname === orgRoot || pathname === `${orgRoot}/`;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="inline-flex cursor-pointer">
            <Image src="/logo.svg" alt="Logo" width="100" height="100" />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex bg-[#F9F9FE] p-2 rounded-md items-center gap-8">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-sm font-medium transition-colors ${
                isActive(tab.href)
                  ? "text-white border-b-2 border-[#8286E9] rounded-md p-2  bg-[#454ADE] pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {pendingSyncCount > 0 ? (
            <button
              type="button"
              onClick={() => void retrySyncNow()}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
            >
              {syncingNow ? "Syncing..." : `Sync pending (${pendingSyncCount})`}
            </button>
          ) : null}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {account ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Disconnect
            </button>
          ) : null}

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold overflow-hidden relative">
              {profile?.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.username ? `@${profile.username}` : "Profile"}
                  fill
                  sizes="32px"
                  unoptimized={/^https?:\/\//.test(profile.avatar)}
                  className="object-cover"
                />
              ) : (
                (profile?.initials || "--")
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {profile?.username ? `@${profile.username}` : ""}
              </p>
              <p className="text-xs text-gray-500">{profile?.role || ""}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
