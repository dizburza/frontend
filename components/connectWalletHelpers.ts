import { useCallback, useEffect, useRef, useState } from "react";
import type { Account } from "thirdweb/wallets";
import { getBasename } from "@superdevfavour/basename";
import type { useRouter } from "next/navigation";
import { fetchSessionProfile, isWalletRegistered } from "@/lib/session";
import { useAuthCompleted } from "@/hooks/useAutoAuthenticate";

type AppRouter = ReturnType<typeof useRouter>;

type CachedAuthCheck = {
  isRegistered: boolean;
  username?: string;
  fullName?: string;
  avatar?: string;
  role?: "user" | "employee" | "signer" | "admin";
  organizationSlug?: string;
  jobRole?: string;
  savedAt: number;
};

const getRedirectPathForRole = (
  role: CachedAuthCheck["role"] = "user",
  organizationSlug?: string
) => {
  if (role === "admin" || role === "signer") {
    const slug = (organizationSlug || "").trim();
    if (!slug) return null;
    return { path: `/org/${slug}`, accountType: "organization" as const };
  }
  if (role === "employee" || role === "user") {
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

/**
 * The connected wallet's own profile.
 *
 * The session is the source of truth. Auto-authentication runs on connect, so
 * `/auth/me` normally answers; when it has not completed yet we fall back to
 * asking only whether this wallet is registered, which is all the public route
 * will tell us now.
 */
/** Each request gets its own budget, rather than sharing one across both. */
const withTimeout = async <T>(
  run: (signal: AbortSignal) => Promise<T>,
  ms = 8000
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    return await run(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * `pending` and `redirected` are kept apart because the caller has to treat them
 * oppositely: one means ask again later, the other means the navigation already
 * happened. Collapsing both into `null` is what made the caller unable to tell
 * "no answer yet" from "done".
 */
type AuthCheckResult =
  | { status: "profile"; profile: Omit<CachedAuthCheck, "savedAt"> }
  | { status: "redirected" }
  | { status: "pending" };

const fetchAuthCheck = async (params: {
  address: string;
  router: AppRouter;
}): Promise<AuthCheckResult> => {
  const { address, router } = params;

  const profile = await withTimeout((signal) => fetchSessionProfile(signal));

  if (profile) {
    return {
      status: "profile",
      profile: {
        isRegistered: true,
        username: profile.username,
        fullName: profile.fullName,
        avatar: profile.avatar,
        role: (profile.role ?? "user") as CachedAuthCheck["role"],
        organizationSlug: profile.organizationSlug ?? undefined,
        jobRole: profile.jobRole ?? undefined,
      },
    };
  }

  const registered = await withTimeout((signal) => isWalletRegistered(address, signal));

  // Null is "could not find out", not "no". Sending a registered person to
  // profile setup because a request was slow is worse than showing them nothing:
  // they have an account, and the page invites them to make a second one. The
  // effect only appears when the backend is cold, which is exactly when it is
  // hardest to attribute.
  if (registered === null) return { status: "pending" };

  if (!registered) {
    router.push("/setup-profile");
    return { status: "redirected" };
  }

  // Registered, but sign-in has not produced a session yet. Redirecting now
  // would fight it, so wait to be asked again once it has.
  return { status: "pending" };
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

  // Latched per address, and only once the check reaches an answer. Latching on
  // the attempt instead is what stranded people on the landing page: the first
  // attempt runs before sign-in has produced a session, so it can only say "not
  // yet", and a latch set there means nothing ever asks again.
  const settledFor = useRef<string | null>(null);
  const announcedFor = useRef<string | null>(null);
  const [recheck, setRecheck] = useState(0);

  // Held in a ref so an inline callback from the caller does not re-run the
  // effect on every render.
  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;

  // Sign-in completing is the trigger this was missing. It fires once the
  // session cookie is set, which is the first moment the check can succeed.
  useAuthCompleted(useCallback(() => setRecheck((n) => n + 1), []));

  useEffect(() => {
    const address = account?.address;

    if (!address) {
      settledFor.current = null;
      announcedFor.current = null;
      return;
    }

    if (announcedFor.current !== address) {
      announcedFor.current = address;
      onConnectRef.current?.();
    }

    if (settledFor.current === address) return;

    let live = true;

    void (async () => {
      const cacheKey = `authCheck:${address}`;
      if (tryRedirectFromCache({ cacheKey, router })) {
        settledFor.current = address;
        return;
      }

      const result = await fetchAuthCheck({ address, router });
      if (!live || result.status === "pending") return;

      settledFor.current = address;
      if (result.status === "redirected") return;

      const { profile } = result;

      try {
        const toCache: CachedAuthCheck = { ...profile, savedAt: Date.now() };
        localStorage.setItem(cacheKey, JSON.stringify(toCache));
      } catch {
        // ignore quota errors
      }

      const redirect = getRedirectPathForRole(profile.role, profile.organizationSlug);
      if (!redirect) {
        router.push("/setup-profile");
        return;
      }

      localStorage.setItem("accountType", redirect.accountType);
      router.push(redirect.path);
    })();

    return () => {
      live = false;
    };
  }, [account?.address, router, recheck]);
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
