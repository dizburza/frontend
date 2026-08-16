"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addressFromCacheKey, onAddressInvalidated } from "@/lib/cache-bus";

type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const INFLIGHT = new Map<string, Promise<unknown>>();

const storageKey = (key: string) => `dizburza:cache:${key}`;

const readPersisted = <T,>(key: string): CacheEntry<T> | null => {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const writePersisted = <T,>(key: string, entry: CacheEntry<T>) => {
  try {
    globalThis.localStorage?.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // Quota or private-mode failures are not worth breaking rendering over;
    // the in-memory cache still serves this session.
  }
};

export type CachedResource<T> = {
  data: T | null;
  error: Error | null;
  /** True only while a request is in flight with nothing cached to show. */
  isLoading: boolean;
  /** True while revalidating with stale data already on screen. */
  isValidating: boolean;
  lastUpdatedAt: number | null;
  refresh: () => void;
  mutate: (updater: (current: T | null) => T | null) => void;
};

/**
 * Stale-while-revalidate fetch cache backed by localStorage.
 *
 * The dashboard previously cached in a module-level Map, so every hard reload
 * or new tab re-ran a full fetch with a blank screen in between. Persisting
 * means a reload paints instantly from cache and revalidates behind it.
 */
export function useCachedResource<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options?: { staleTimeMs?: number; refreshEvent?: string }
): CachedResource<T> {
  const staleTimeMs = options?.staleTimeMs ?? 60_000;
  const refreshEvent = options?.refreshEvent;

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const readCache = useCallback((cacheKey: string): CacheEntry<T> | null => {
    const memory = MEMORY_CACHE.get(cacheKey) as CacheEntry<T> | undefined;
    if (memory) return memory;

    const persisted = readPersisted<T>(cacheKey);
    if (persisted) MEMORY_CACHE.set(cacheKey, persisted);
    return persisted;
  }, []);

  const initial = key ? readCache(key) : null;

  const [data, setData] = useState<T | null>(initial?.data ?? null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(
    initial?.fetchedAt ?? null
  );
  const [error, setError] = useState<Error | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [nonce, setNonce] = useState(0);
  // Tracks which nonce the effect has already acted on, so a manual refresh
  // bypasses freshness exactly once instead of disabling it from then on.
  const handledNonceRef = useRef(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!refreshEvent) return;
    const handler = () => refresh();
    globalThis.addEventListener(refreshEvent, handler);
    return () => globalThis.removeEventListener(refreshEvent, handler);
  }, [refreshEvent, refresh]);

  // Revalidate when the realtime stream reports activity for this key's address.
  useEffect(() => {
    if (!key) return;
    const owner = addressFromCacheKey(key);
    if (!owner) return;

    return onAddressInvalidated((address) => {
      if (address === owner) refresh();
    });
  }, [key, refresh]);

  /**
   * Write a value into the cache immediately, before the server confirms it.
   * Used for optimistic updates so a send reflects in the UI at once.
   */
  const mutate = useCallback(
    (updater: (current: T | null) => T | null) => {
      if (!key) return;

      const next = updater(
        (MEMORY_CACHE.get(key) as CacheEntry<T> | undefined)?.data ?? null
      );
      if (next === null) return;

      // Deliberately keeps the previous fetchedAt: this value is a guess, so it
      // must not look fresh enough to suppress the next revalidation.
      const previous = MEMORY_CACHE.get(key) as CacheEntry<T> | undefined;
      const entry: CacheEntry<T> = {
        data: next,
        fetchedAt: previous?.fetchedAt ?? 0,
      };

      MEMORY_CACHE.set(key, entry);
      writePersisted(key, entry);
      setData(next);
    },
    [key]
  );

  useEffect(() => {
    if (!key) {
      setData(null);
      setLastUpdatedAt(null);
      return;
    }

    let cancelled = false;

    const cached = readCache(key);
    if (cached) {
      setData(cached.data);
      setLastUpdatedAt(cached.fetchedAt);
    }

    const forced = nonce !== handledNonceRef.current;
    handledNonceRef.current = nonce;

    const isFresh = cached && Date.now() - cached.fetchedAt < staleTimeMs;
    if (isFresh && !forced) return;

    setIsValidating(true);
    setError(null);

    // Three dashboard cards mount at once against the same key; without this
    // they would each issue their own identical request.
    let request = INFLIGHT.get(key) as Promise<T> | undefined;
    if (!request) {
      request = fetcherRef.current();
      INFLIGHT.set(key, request);
      void request.finally(() => INFLIGHT.delete(key));
    }

    request
      .then((result) => {
        const entry: CacheEntry<T> = { data: result, fetchedAt: Date.now() };
        MEMORY_CACHE.set(key, entry);
        writePersisted(key, entry);

        if (cancelled) return;
        setData(result);
        setLastUpdatedAt(entry.fetchedAt);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error("Request failed"));
      })
      .finally(() => {
        if (!cancelled) setIsValidating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, staleTimeMs, nonce, readCache]);

  return {
    data,
    error,
    isLoading: isValidating && data === null,
    isValidating,
    lastUpdatedAt,
    refresh,
    mutate,
  };
}
