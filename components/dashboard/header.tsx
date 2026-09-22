"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useActiveAccount, useActiveWallet, useDisconnect } from "thirdweb/react";
import { flushBackendSyncQueue, getBackendSyncQueueSize } from "@/lib/backend-sync-queue";
import { clearAuthStorage } from "@/hooks/useAutoAuthenticate";
import { fetchSessionProfile } from "@/lib/session";

const shortAddress = (value?: string | null) => {
  if (!value) return "";
  return `${value.slice(0, 4)}....${value.slice(-4)}`;
};

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

    // The job title someone was given is more use here than the governance
    // role, which the tabs on either side already imply.
    const roleLabel = (role: string = "user", jobRole?: string | null) => {
      const title = (jobRole || "").trim();
      if (title) return title;

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
          jobRole?: string | null;
          organizationSlug?: string;
        };

        const username = cached.username;
        const role = cached.role;
        if (!username) return false;

        setProfile({
          initials: computeInitials({ fullName: cached.fullName, username }),
          username,
          role: roleLabel(role, cached.jobRole),
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
        // The header only ever shows the signed-in person, so it reads the
        // session rather than an address supplied by the page.
        const user = await fetchSessionProfile();
        if (!user?.username) return;

        setProfile({
          initials: computeInitials({ fullName: user.fullName, username: user.username }),
          username: user.username,
          role: roleLabel(user.role, user.jobRole),
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

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Route changes should not leave the menu hanging open over the new page.
  useEffect(() => setMenuOpen(false), [pathname]);

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

  const orgBase = organizationSlug ? `/org/${organizationSlug}` : "/";

  const tabs = (() => {
    if (accountType === "personal") {
      return [
        { label: "Wallet", href: "/personal/wallet" },
        { label: "Payments", href: "/personal/payments" },
        { label: "Transactions", href: "/personal/transactions" },
        { label: "QR Center", href: "/personal/qr-center" },
      ];
    }

    return [
      { label: "Dashboard", href: orgBase },
      { label: "Signers", href: `${orgBase}/signers` },
      { label: "Proposals", href: `${orgBase}/proposals` },
      { label: "Employees", href: `${orgBase}/employees` },
      { label: "Payroll", href: `${orgBase}/payments` },
    ];
  })();

  // Reachable from the profile menu rather than the pill, which the design
  // caps at five.
  const menuLinks =
    accountType === "personal"
      ? []
      : [
          { label: "Wallet", href: `${orgBase}/wallet` },
          { label: "My Transactions", href: `${orgBase}/transactions` },
        ];

  const isActive = (href: string) => {
    if (!href || href === "/") return pathname === href;

    if (organizationSlug && href === orgBase) {
      return pathname === orgBase || pathname === `${orgBase}/`;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-5 z-50 mb-6">
      <div className="flex items-center justify-between gap-6 rounded-lg bg-surface-canvas px-6 py-4 shadow-[0px_4.25px_8.07px_0px_rgba(29,30,73,0.12)] outline outline-[0.5px] -outline-offset-[0.5px] outline-[#E3E4F6] lg:px-10">
        <Link href="/" className="inline-flex shrink-0 cursor-pointer">
          <Image src="/logo.svg" alt="Dizburza" width={109} height={21} className="h-5 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-0 rounded-xl bg-surface-canvas p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-[#EEF0FC] lg:flex">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex items-center gap-2.5 overflow-hidden rounded-[4px] bg-[#4F51D9] px-6 py-2 text-base font-medium text-white outline outline-2 outline-[#C7C9F7] shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)]"
                    : "flex items-center justify-center rounded-[4px] px-6 py-2 text-sm font-normal leading-4 text-gray-500 transition-colors hover:text-gray-900"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4 xl:gap-10">
          {pendingSyncCount > 0 ? (
            <button
              type="button"
              onClick={() => void retrySyncNow()}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
            >
              {syncingNow ? "Syncing..." : `Sync pending (${pendingSyncCount})`}
            </button>
          ) : null}

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-full bg-surface-canvas p-2 outline outline-1 -outline-offset-1 outline-[#E3E4F6] transition-colors hover:bg-white"
          >
            <Image src="/icons/notification-bing.svg" alt="" width={14} height={14} />
            <span className="absolute -top-0.5 right-0.5 size-2 rounded-full bg-orange-700" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex w-52 items-center justify-between gap-2 rounded-lg bg-surface-canvas p-2 text-left outline outline-1 -outline-offset-1 outline-[#E3E4F6] transition-colors hover:bg-white"
            >
              <span className="flex min-w-0 items-center gap-1">
                <span className="relative size-8 shrink-0 overflow-hidden rounded-[4px] bg-[#EEF0FC] outline outline-[0.4px] -outline-offset-[0.4px] outline-[#E3E4F6]">
                  {profile?.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt=""
                      fill
                      sizes="32px"
                      unoptimized={/^https?:\/\//.test(profile.avatar)}
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-[11px] font-semibold text-[#4F51D9]">
                      {profile?.initials || "--"}
                    </span>
                  )}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-nohemi text-sm font-semibold text-[#1D1E49]">
                    {shortAddress(account?.address) || "--"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <span className="truncate">
                      {profile?.username ? `@${profile.username}` : ""}
                    </span>
                    {profile?.role ? (
                      <>
                        <span className="size-1 shrink-0 rounded-full bg-gray-300" />
                        <span className="shrink-0">{profile.role}</span>
                      </>
                    ) : null}
                  </span>
                </span>
              </span>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white outline outline-[0.3px] -outline-offset-[0.3px] outline-[#E3E4F6]">
                <ChevronDown
                  className={`size-3 text-[#4F51D9] transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-lg border border-[#E3E4F6] bg-white py-1 shadow-lg"
              >
                {menuLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-surface-canvas"
                  >
                    {link.label}
                  </Link>
                ))}
                {account ? (
                  <>
                    {menuLinks.length > 0 ? <div className="my-1 h-px bg-[#EEF0FC]" /> : null}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleDisconnect}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      Disconnect
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <nav className="mt-2 flex items-center gap-1 overflow-x-auto rounded-lg bg-surface-canvas p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-[#EEF0FC] lg:hidden">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-[4px] px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-[#4F51D9] font-medium text-white"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export default DashboardHeader;
