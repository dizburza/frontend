import { useCallback, useEffect, useRef, useState } from "react";
import type { Account } from "thirdweb/wallets";
import { getBasename } from "@superdevfavour/basename";
import type { useRouter } from "next/navigation";
import { fetchSessionProfile, hasSessionFor, isWalletRegistered } from "@/lib/session";
import { useAuthCompleted } from "@/hooks/useAutoAuthenticate";

type AppRouter = ReturnType<typeof useRouter>;

/** Bumped when a new field decides routing, to retire entries written without it. */
export const PROFILE_CACHE_VERSION = 1;

type CachedAuthCheck = {
  isRegistered: boolean;
  profileVersion?: number;
  username?: string;
  fullName?: string;
  /** Empty until onboarding collects them, which is what gates everything else. */
  surname?: string;
  firstname?: string;
  avatar?: string;
  role?: "user" | "employee" | "signer" | "admin";
  organizationSlug?: string;
  jobRole?: string;
  savedAt: number;
};

/**
 * Membership decides the landing page, not the account alone. A signer runs an
 * organization, an employee was invited into one, and `user` means neither: no
 * membership row exists, so the only thing to do here is create an
 * organization.
 *
 * Who they are comes first. Signing in makes an account out of a wallet address
 * and nothing else, so anyone without a name goes to the step that asks for it
 * before any of the rest applies.
 */
const getRedirectPathForRole = (profile: {
  role?: CachedAuthCheck["role"];
  organizationSlug?: string;
  surname?: string;
  firstname?: string;
}) => {
  const { role = "user", organizationSlug, surname, firstname } = profile;

  if (!surname?.trim() || !firstname?.trim()) {
    return {
      path: "/organization-setup/your-details",
      accountType: "organization" as const,
    };
  }

  const setUpOrganization = {
    path: "/organization-setup/organization-details",
    accountType: "organization" as const,
  };

  if (role === "admin" || role === "signer") {
    const slug = (organizationSlug || "").trim();
    if (!slug) return setUpOrganization;
    return { path: `/org/${slug}`, accountType: "organization" as const };
  }
  if (role === "employee") {
    return { path: "/personal/wallet", accountType: "personal" as const };
  }
  return setUpOrganization;
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

    // Written before the profile fields were cached, so it cannot answer
    // whether onboarding is done. Absent is not the same as empty, and reading
    // it as empty sends someone with a complete profile back to fill it in.
    if (cached.profileVersion !== PROFILE_CACHE_VERSION) return false;

    const redirect = getRedirectPathForRole(cached);

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
        profileVersion: PROFILE_CACHE_VERSION,
        username: profile.username,
        fullName: profile.fullName,
        surname: profile.surname ?? undefined,
        firstname: profile.firstname ?? undefined,
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

  // A wallet with no account is here to set up an organization: that is the
  // only thing this product onboards into right now. Employees and signers
  // arrive later through an invite link tied to an organization that exists.
  // It starts at the details step, since nothing is known but the address.
  if (!registered) {
    router.push("/organization-setup/your-details");
    return { status: "redirected" };
  }

  // Registered, but sign-in has not produced a session yet. Redirecting now
  // would fight it, so wait to be asked again once it has.
  return { status: "pending" };
};

const isHexPrefixedAddress = (address: string): address is `0x${string}` => {
  return address.startsWith("0x");
};

/**
 * Set by the invitation page before it sends someone to sign in. Session
 * storage rather than local: an invitation belongs to the tab it was opened in
 * and should not outlive the browser.
 */
const readPendingInvite = (): string | null => {
  try {
    return sessionStorage.getItem("pendingInvite");
  } catch {
    return null;
  }
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
      // Someone who opened an invitation link and was sent here to sign in.
      // Checked before the usual routing, which would otherwise send them to a
      // dashboard and leave the invitation unclaimed.
      //
      // Straight to their details rather than back to the invitation: the link
      // told them what this is, and returning them to a page whose only control
      // accepts it again is how the accept button becomes a retry button.
      // Submitting the form is what claims it.
      //
      // Only once the session exists. That page is guarded, so sending them
      // before sign-in completes gets them bounced back here, and this runs
      // again on the fresh mount: the two pages then push each other forever.
      const pendingInvite = readPendingInvite();
      if (pendingInvite) {
        if (!hasSessionFor(address)) return;

        settledFor.current = address;
        router.push("/organization-setup/your-details");
        return;
      }

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

      const redirect = getRedirectPathForRole(profile);

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
