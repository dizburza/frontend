"use client";

/**
 * Every sign-in option reaches thirdweb's enclave, so a blip there reads to the
 * user as the whole app being broken. `ConnectButton` has no `onError`, and the
 * connect flow is driven inside its own modal, so the fetch is the only place
 * the failure is visible to us.
 */

const WALLET_HOST_SUFFIX = ".thirdweb.com";

export const WALLET_SERVICE_FAILURE_EVENT = "wallet-service:unreachable";

export type WalletServiceFailure = "offline" | "unreachable";

let installed = false;

const isWalletServiceUrl = (url: string) => {
  try {
    return new URL(url, globalThis.location?.href).hostname.endsWith(WALLET_HOST_SUFFIX);
  } catch {
    return false;
  }
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const methodOf = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method) return init.method.toUpperCase();
  if (input instanceof Request) return input.method.toUpperCase();
  return "GET";
};

const urlOf = (input: RequestInfo | URL) => {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
};

/**
 * Retry transient wallet-service failures before the user ever sees one.
 *
 * Only GETs are retried. A POST that threw may still have reached the server,
 * and replaying a sign-in blind is worse than reporting it. Requests to
 * anything other than the wallet host are passed straight through.
 */
export function installWalletServiceRetry() {
  if (installed || typeof globalThis.fetch !== "function") return;
  installed = true;

  const original = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isWalletServiceUrl(urlOf(input))) return original(input, init);

    // A GET carries no body, so the same input is safe to send again.
    const attempts = methodOf(input, init) === "GET" ? 3 : 1;
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        return await original(input, init);
      } catch (error) {
        lastError = error;
        if (attempt < attempts - 1) await wait(300 * 2 ** attempt);
      }
    }

    // Being offline and the service being down need different words, and the
    // user can only act on one of them.
    globalThis.dispatchEvent(
      new CustomEvent<WalletServiceFailure>(WALLET_SERVICE_FAILURE_EVENT, {
        detail: navigator.onLine ? "unreachable" : "offline",
      })
    );

    throw lastError;
  };
}
