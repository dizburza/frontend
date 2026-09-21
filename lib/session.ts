"use client";

/**
 * The session credential lives in an httpOnly cookie the browser attaches
 * automatically, so nothing here reads or stores a token. This module only
 * reads the non-secret hint cookie the backend sets alongside it, which says
 * which wallet is signed in and when the session lapses.
 */

const HINT_COOKIE = "dz_session_hint";

export type SessionHint = {
  walletAddress: string;
  expiresAt: number;
};

export const readSessionHint = (): SessionHint | null => {
  try {
    const raw = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${HINT_COOKIE}=`))
      ?.slice(HINT_COOKIE.length + 1);

    if (!raw) return null;

    const parsed = JSON.parse(decodeURIComponent(raw)) as SessionHint;
    if (!parsed?.walletAddress || typeof parsed.expiresAt !== "number") return null;

    return parsed;
  } catch {
    return null;
  }
};

/**
 * Forget the hint.
 *
 * The hint is an optimization, so it is allowed to be wrong, but it is not
 * allowed to *stay* wrong. If the real session has gone while this survives,
 * `hasSessionFor` keeps answering yes, sign-in is never attempted, and every
 * request 401s with nothing to correct it.
 */
export const clearSessionHint = (): void => {
  document.cookie = `${HINT_COOKIE}=; Max-Age=0; path=/`;
};

/** True when a live session exists for this wallet. */
export const hasSessionFor = (address: string | null | undefined): boolean => {
  if (!address) return false;
  const hint = readSessionHint();
  if (!hint) return false;

  return (
    hint.walletAddress === address.toLowerCase() && hint.expiresAt > Date.now()
  );
};

export const endSession = async (): Promise<void> => {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
};

export type SessionProfile = {
  username?: string;
  fullName?: string;
  /** Null until onboarding collects them. Signing in only knows an address. */
  surname?: string | null;
  firstname?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  avatar?: string;
  role?: string;
  organizationSlug?: string | null;
  jobRole?: string | null;
};

/**
 * Who the current session belongs to.
 *
 * This used to come from `/auth/check/:address`, which answered for any address
 * without a session and so handed out identity, employer and staff roster to
 * anyone. That route now answers `isRegistered` and nothing else, and profile
 * data lives here, behind the cookie.
 */
export const fetchSessionProfile = async (
  signal?: AbortSignal
): Promise<SessionProfile | null> => {
  try {
    const res = await fetch("/api/auth/me", {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    });

    // The server has just told us the session is gone, so the hint is stale.
    // Only on 401: a timeout or a 500 says nothing about whether it is valid.
    if (res.status === 401) clearSessionHint();

    if (!res.ok) return null;

    const payload = (await res.json()) as { data?: { user?: SessionProfile } };
    return payload.data?.user ?? null;
  } catch {
    return null;
  }
};

/** Registration state only, for deciding between sign up and sign in. */
export const isWalletRegistered = async (
  address: string,
  signal?: AbortSignal
): Promise<boolean | null> => {
  try {
    const res = await fetch(`/api/auth/check/${address}`, {
      headers: { Accept: "application/json" },
      signal,
    });

    if (!res.ok) return null;

    const payload = (await res.json()) as { data?: { isRegistered?: boolean } };
    return Boolean(payload.data?.isRegistered);
  } catch {
    return null;
  }
};
