"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";
import { endSession, fetchSessionProfile, hasSessionFor } from "@/lib/session";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      username: string;
      fullName?: string;
      role?: string;
    };
  };
  error?: string;
}

// Global event name for auth completion
const AUTH_COMPLETED_EVENT = "auth:completed";

export function clearAuthStorage() {
  // Clears the session cookie server-side; nothing sensitive is held locally.
  void endSession();

  try {
    localStorage.removeItem("accountType");

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("authCheck:")) keys.push(k);
    }

    for (const k of keys) {
      localStorage.removeItem(k);
    }
  } catch {
    // ignore
  }
}

/**
 * Hook to automatically authenticate user when wallet connects
 * 
 * Flow:
 * 1. Detect wallet connection
 * 2. Check if valid token exists
 * 3. If no valid token, trigger auth flow:
 *    - Get auth message from backend
 *    - Sign message with wallet
 *    - Login with signature
 *    - Save token to localStorage
 *    - Dispatch global event for other hooks to retry
 */
export function useAutoAuthenticate() {
  const account = useActiveAccount();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  
  // Addresses whose sign-in failed, so a rejected signature is not re-prompted
  // in a loop. Success is deliberately not recorded here: the session hint
  // already stops a signed-in address from signing again, and latching on
  // success meant a disconnect followed by a reconnect was refused outright,
  // because this hook lives at the root and its refs outlive the connection.
  const attemptedRef = useRef<Set<string>>(new Set());
  // Track if auth is currently in progress to prevent duplicates
  const inProgressRef = useRef(false);

  /**
   * Get auth message from backend
   */
  const getAuthMessage = useCallback(async (address: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/auth/message/${address}`, {
        credentials: "include",
      });
      const data = await response.json();
      
      if (data.success && data.data?.message) {
        return data.data.message;
      }
      return null;
    } catch (error) {
      console.error("[useAutoAuthenticate] Failed to get auth message:", error);
      return null;
    }
  }, []);

  /**
   * Sign message with connected wallet
   */
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!account) return null;
    
    try {
      // Use thirdweb's signMessage method
      const signature = await account.signMessage({ message });
      return signature;
    } catch (error) {
      console.error("[useAutoAuthenticate] Failed to sign message:", error);
      // User rejected the signature
      if (error instanceof Error && error.message?.includes("rejected")) {
        setAuthState(prev => ({
          ...prev,
          error: "Signature rejected. Please sign the message to continue.",
        }));
      }
      return null;
    }
  }, [account]);

  /**
   * Login with signature
   */
  const login = useCallback(async (
    address: string,
    signature: string
  ): Promise<LoginResponse | null> => {
    try {
      // Signature only. The server rebuilds the message from the challenge it
      // issued, so there is nothing here worth forging.
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The response sets an httpOnly session cookie; nothing is returned
        // for the client to store.
        credentials: "include",
        body: JSON.stringify({
          walletAddress: address,
          signature,
        }),
      });
      
      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      console.error("[useAutoAuthenticate] Login failed:", error);
      return null;
    }
  }, []);

  /**
   * Main authentication flow
   */
  const performAuth = useCallback(async (address: string) => {
    // Prevent duplicate auth attempts
    if (inProgressRef.current) return;
    if (attemptedRef.current.has(address)) return;
    
    inProgressRef.current = true;
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 1. Get auth message
      const message = await getAuthMessage(address);
      if (!message) {
        attemptedRef.current.add(address);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: "Failed to get authentication message",
        });
        return;
      }

      // 2. Sign message
      const signature = await signMessage(message);
      if (!signature) {
        attemptedRef.current.add(address);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          // Don't set error here if user rejected - signMessage handles that
        }));
        return;
      }

      // 3. Login
      const loginResult = await login(address, signature);
      if (!loginResult?.success) {
        attemptedRef.current.add(address);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: loginResult?.error || "Login failed",
        });
        return;
      }

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      // 5. Dispatch global event so other hooks can retry
      globalThis.dispatchEvent(new CustomEvent(AUTH_COMPLETED_EVENT));
      
      console.log("[useAutoAuthenticate] Authentication successful");
    } catch (error) {
      console.error("[useAutoAuthenticate] Auth flow error:", error);
      attemptedRef.current.add(address);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: "Authentication failed",
      });
    } finally {
      inProgressRef.current = false;
    }
  }, [getAuthMessage, signMessage, login]);

  /**
   * Clear auth state and retry
   */
  const retry = useCallback(() => {
    if (account?.address) {
      attemptedRef.current.delete(account.address);
      performAuth(account.address);
    }
  }, [account?.address, performAuth]);

  /**
   * Effect: Monitor wallet connection and trigger auth when needed
   */
  useEffect(() => {
    const address = account?.address;
    
    if (!address) {
      // Disconnecting forgets the failures too, so reconnecting is a fresh
      // start rather than something a latch from the last connection refuses.
      attemptedRef.current.clear();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // The session cookie is httpOnly, so this reads the non-secret hint the
    // backend sets alongside it. Believing it costs no round trip, which is the
    // whole point, but it is checked behind rather than taken on trust: the two
    // cookies can disagree, and a hint that outlives its session would otherwise
    // leave this convinced it is signed in while every request is refused.
    if (hasSessionFor(address)) {
      setAuthState({ isAuthenticated: true, isLoading: false, error: null });

      let live = true;
      void fetchSessionProfile().then((profile) => {
        // `fetchSessionProfile` clears the hint on a 401, so by here the state
        // is already corrected and signing in is the right next move.
        if (!live || profile || hasSessionFor(address)) return;

        setAuthState({ isAuthenticated: false, isLoading: false, error: null });
        void performAuth(address);
      });

      return () => {
        live = false;
      };
    }

    // No session for this wallet, so sign in
    performAuth(address);
  }, [account?.address, performAuth]);

  return {
    ...authState,
    retry,
  };
}

/**
 * Hook to listen for authentication completion events
 * Use this to trigger retries in data-fetching hooks
 */
export function useAuthCompleted(callback: () => void) {
  useEffect(() => {
    const handleAuthCompleted = () => {
      callback();
    };
    
    globalThis.addEventListener(AUTH_COMPLETED_EVENT, handleAuthCompleted);
    return () => {
      globalThis.removeEventListener(AUTH_COMPLETED_EVENT, handleAuthCompleted);
    };
  }, [callback]);
}

export default useAutoAuthenticate;
