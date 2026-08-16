"use client";

import { useEffect, useState } from "react";
import { getTokenConfig, type TokenConfig } from "@/lib/token";

/**
 * The token this deployment pays in, for anything that needs to name or
 * picture it.
 *
 * The symbol used to be the literal "cNGN" in about thirty five labels, so
 * changing the payroll token meant grepping JSX and hoping. Anything showing a
 * currency to a user reads it from here instead.
 */
export function useToken(): {
  token: TokenConfig | null;
  symbol: string;
  logoUrl: string;
} {
  const [token, setToken] = useState<TokenConfig | null>(null);

  useEffect(() => {
    let cancelled = false;

    getTokenConfig()
      .then((config) => {
        if (!cancelled) setToken(config);
      })
      .catch(() => {
        // A label falling back to the empty string is better than a crash, and
        // the amount beside it is still correct.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    token,
    symbol: token?.symbol ?? "",
    logoUrl: token?.logoUrl ?? "/token.svg",
  };
}
