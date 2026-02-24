import { useEffect, useState } from "react";
import type { Account } from "thirdweb/wallets";
import { getBasename } from "@superdevfavour/basename";
import type { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
};

type AuthCheckData = {
  isRegistered: boolean;
  user?: {
    username?: string;
    surname?: string;
    firstname?: string;
    fullName?: string;
    avatar?: string;
    role?: "employee" | "signer" | "admin";
    organizationSlug?: string;
  };
};

type CachedAuthCheck = {
  isRegistered: boolean;
  username?: string;
  fullName?: string;
  avatar?: string;
  role?: "employee" | "signer" | "admin";
  organizationSlug?: string;
  savedAt: number;
};

const getRedirectPathForRole = (
  role: CachedAuthCheck["role"] = "employee",
  organizationSlug?: string
) => {
  if (role === "admin" || role === "signer") {
    const slug = (organizationSlug || "").trim();
    if (!slug) return null;
    return { path: `/org/${slug}`, accountType: "organization" as const };
  }
  if (role === "employee") {
    return { path: "/personal/wallet", accountType: "personal" as const };
  }
  return null;
};

const tryRedirectFromCache = (params: {
  cacheKey: string;
  router: AppRouter;
}) => {
  const { cacheKey, router } = params;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return false;

    const cached = JSON.parse(raw) as CachedAuthCheck;
    const isFresh = Date.now() - cached.savedAt < 5 * 60 * 1000;
    if (!isFresh || !cached.isRegistered) return false;

    const redirect = getRedirectPathForRole(cached.role, cached.organizationSlug);
    if (!redirect) return false;

    localStorage.setItem("accountType", redirect.accountType);
    router.push(redirect.path);
    return true;
  } catch {
    return false;
  }
};

const fetchAuthCheck = async (params: { address: string; router: AppRouter }) => {
  const { address, router } = params;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const backendUrl = process.env.BACKEND_URL;
    const normalizedBackendBase = backendUrl
      ? backendUrl.replace(/\/$/, "").replace(/\/api$/, "")
      : null;
    const upstream = normalizedBackendBase
      ? `${normalizedBackendBase}/api/auth/check/${address}`
      : `/api/auth/check/${address}`;

    const res = await fetch(upstream, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      router.push("/setup-profile");
      return null;
    }

    const payload = (await res.json()) as ApiResponse<AuthCheckData>;
    const data = payload.data;
    return {
      isRegistered: Boolean(data?.isRegistered),
      username: data?.user?.username,
      fullName: data?.user?.fullName,
      avatar: data?.user?.avatar,
      role: data?.user?.role || "employee",
      organizationSlug: data?.user?.organizationSlug,
    };
  } catch {
    router.push("/setup-profile");
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const isHexPrefixedAddress = (address: string): address is `0x${string}` => {
  return address.startsWith("0x");
};

export const useMounted = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
};

export const useConnectMetadata = () => {
  const origin =
    globalThis.window === undefined
      ? "https://dizburza.vercel.app"
      : globalThis.location.origin;

  return {
    name: "dizburza",
    description: "The Smarter Way to Pay and Disburse",
    url: origin,
    icons: ["https://assets.reown.com/reown-profile-pic.png"],
  };
};

export const useBasename = (address?: string) => {
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoadingBasename, setIsLoadingBasename] = useState(false);

  useEffect(() => {
    const fetchBasename = async () => {
      if (!address) {
        setBasename(null);
        return;
      }

      if (!isHexPrefixedAddress(address)) {
        setBasename(null);
        return;
      }

      try {
        setIsLoadingBasename(true);
        const name = await getBasename(address);
        setBasename(name || null);
      } catch (error) {
        console.log("No Basename found or error fetching:", error);
        setBasename(null);
      } finally {
        setIsLoadingBasename(false);
      }
    };

    fetchBasename();
  }, [address]);

  return { basename, isLoadingBasename };
};

export const useRedirectOnFirstConnect = (params: {
  account: Account | undefined;
  onConnect?: () => void;
  router: ReturnType<typeof useRouter>;
}) => {
  const { account, onConnect, router } = params;
  const [prevAccount, setPrevAccount] = useState<Account | undefined>(
    undefined,
  );

  useEffect(() => {
    const redirectForAccount = async () => {
      if (!account || prevAccount) return;

      if (onConnect) {
        onConnect();
      }

      const cacheKey = `authCheck:${account.address}`;
      const redirectedFromCache = tryRedirectFromCache({ cacheKey, router });
      if (redirectedFromCache) return;

      const fetched = await fetchAuthCheck({
        address: account.address,
        router,
      });
      if (!fetched) return;

      try {
        const toCache: CachedAuthCheck = {
          isRegistered: fetched.isRegistered,
          username: fetched.username,
          fullName: fetched.fullName,
          avatar: fetched.avatar,
          role: fetched.role || "employee",
          organizationSlug: fetched.organizationSlug,
          savedAt: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(toCache));
      } catch {
        // ignore quota errors
      }

      if (!fetched.isRegistered) {
        router.push("/setup-profile");
        return;
      }

      const redirect = getRedirectPathForRole(fetched.role, fetched.organizationSlug);
      if (redirect) {
        localStorage.setItem("accountType", redirect.accountType);
        router.push(redirect.path);
        return;
      }

      router.push("/setup-profile");
    };

    redirectForAccount();
    setPrevAccount(account);
  }, [account, onConnect, prevAccount, router]);
};

export const useAutoSwitchToBaseSepolia = (params: {
  account: Account | undefined;
  isOnCorrectChain: boolean;
  switchToBaseSepolia: () => void | Promise<unknown>;
}) => {
  const { account, isOnCorrectChain, switchToBaseSepolia } = params;

  useEffect(() => {
    if (account && !isOnCorrectChain) {
      const timer = setTimeout(() => {
        Promise.resolve(switchToBaseSepolia()).catch(() => undefined);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [account, isOnCorrectChain, switchToBaseSepolia]);
};

export const getDisplayName = (params: {
  account: Account | undefined;
  basename: string | null;
  isLoadingBasename: boolean;
  label: string;
}) => {
  const { account, basename, isLoadingBasename, label } = params;

  if (isLoadingBasename && account) {
    return "Loading...";
  }
  if (basename) {
    return basename;
  }
  if (account?.address) {
    return `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
  }
  return label;
};
