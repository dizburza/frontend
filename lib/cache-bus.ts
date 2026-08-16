"use client";

/**
 * Cross-hook cache invalidation.
 *
 * Data for one address is spread across several cached resources (balance,
 * summary, chart, history, each with their own key). When the backend pushes
 * "something changed for 0xabc", every resource scoped to that address needs to
 * revalidate, without each hook having to know the others exist.
 */

type Listener = (address: string) => void;

const listeners = new Set<Listener>();
const organizationListeners = new Set<Listener>();

/** Cache keys are namespaced `<resource>:<address>:<...>`. */
export const addressFromCacheKey = (key: string): string | null => {
  const parts = key.split(":");
  return parts.length >= 2 ? parts[1].toLowerCase() : null;
};

export const onAddressInvalidated = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const invalidateAddress = (address: string) => {
  notify(listeners, address.toLowerCase());
};

/**
 * A second channel keyed by organization id.
 *
 * Governance data is scoped to an organization, not to a wallet, so it cannot
 * ride the address channel: invalidating the treasury address would refetch
 * balances and history that a vote never touched.
 */
export const onOrganizationInvalidated = (
  listener: (organizationId: string) => void
): (() => void) => {
  organizationListeners.add(listener);
  return () => organizationListeners.delete(listener);
};

export const invalidateOrganization = (organizationId: string) => {
  notify(organizationListeners, organizationId);
};

function notify(subscribers: Set<Listener>, key: string) {
  for (const listener of subscribers) {
    try {
      listener(key);
    } catch {
      // A misbehaving subscriber must not stop the others being notified.
    }
  }
}
