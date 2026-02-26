"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ResultRow = {
  walletAddress: string;
  username: string | null;
};

export default function useAddressUsernames(addresses: string[]) {
  const cacheRef = useRef<Map<string, string | null>>(new Map());
  const [version, setVersion] = useState(0);

  const normalized = useMemo(() => {
    const unique = new Set<string>();
    for (const a of addresses) {
      if (typeof a !== "string") continue;
      const v = a.trim().toLowerCase();
      if (!v) continue;
      unique.add(v);
    }
    return Array.from(unique);
  }, [addresses]);

  useEffect(() => {
    let cancelled = false;

    const bumpVersion = () => {
      if (!cancelled) setVersion((v) => v + 1);
    };

    const setMissingAsNull = (missing: string[]) => {
      for (const addr of missing) cacheRef.current.set(addr, null);
    };

    const upsertResults = (results: ResultRow[]) => {
      for (const row of results) {
        if (!row?.walletAddress) continue;
        cacheRef.current.set(row.walletAddress.toLowerCase(), row.username ?? null);
      }
    };

    const ensureAllMissingHaveEntries = (missing: string[]) => {
      for (const addr of missing) {
        if (!cacheRef.current.has(addr)) cacheRef.current.set(addr, null);
      }
    };

    const run = async () => {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backend) return;

      const missing = normalized.filter((a) => !cacheRef.current.has(a));
      if (missing.length === 0) return;

      try {
        const res = await fetch(`${backend}/api/users/resolve-addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addresses: missing }),
        });

        const body = (await res.json()) as {
          success?: boolean;
          data?: { results?: ResultRow[] };
        };

        const results = body?.data?.results;
        if (!res.ok || !Array.isArray(results)) {
          setMissingAsNull(missing);
          bumpVersion();
          return;
        }

        upsertResults(results);
        ensureAllMissingHaveEntries(missing);
        bumpVersion();
      } catch {
        setMissingAsNull(missing);
        bumpVersion();
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [normalized]);

  const getUsername = (address: string) => {
    const key = address.trim().toLowerCase();
    return cacheRef.current.get(key) ?? null;
  };

  return {
    getUsername,
    _version: version,
  };
}
