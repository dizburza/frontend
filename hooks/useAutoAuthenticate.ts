"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useActiveAccount } from "thirdweb/react";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      username: string;
      fullName?: string;
      role?: string;
    };
  };
  error?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050";

// Global event name for auth completion
const AUTH_COMPLETED_EVENT = "auth:completed";

const TOKEN_STORAGE_KEY = "token";
const TOKEN_WALLET_STORAGE_KEY = "token_wallet";

export function clearAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_WALLET_STORAGE_KEY);
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
 * Validates if a JWT token is still valid by checking expiry
 * Note: This is a client-side check, actual validation happens server-side
 */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    
    // Decode payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

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
  
  // Track if we've already attempted auth for this session
  const attemptedRef = useRef<Set<string>>(new Set());
  // Track if auth is currently in progress to prevent duplicates
  const inProgressRef = useRef(false);

  /**
   * Get auth message from backend
   */
  const getAuthMessage = useCallback(async (address: string): Promise<string | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/message/${address}`);
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
    message: string, 
    signature: string
  ): Promise<LoginResponse | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          message,
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
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          // Don't set error here if user rejected - signMessage handles that
        }));
        return;
      }

      // 3. Login
      const loginResult = await login(address, message, signature);
      if (!loginResult?.success || !loginResult.data?.token) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: loginResult?.error || "Login failed",
        });
        return;
      }

      // 4. Save token
      localStorage.setItem(TOKEN_STORAGE_KEY, loginResult.data.token);
      localStorage.setItem(TOKEN_WALLET_STORAGE_KEY, address);
      
      // Mark as attempted for this address
      attemptedRef.current.add(address);
      
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
      // Wallet disconnected - reset state
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Check if we already have a valid token bound to this wallet
    const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const tokenWallet = localStorage.getItem(TOKEN_WALLET_STORAGE_KEY);
    const hasValidToken = isTokenValid(existingToken);
    const isTokenForThisWallet = tokenWallet?.toLowerCase() === address.toLowerCase();

    if (hasValidToken && isTokenForThisWallet) {
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return;
    }

    if (hasValidToken && !isTokenForThisWallet) {
      // Avoid using a token created for a different wallet; backend may reject with 401/403.
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_WALLET_STORAGE_KEY);
    }

    // No valid token - trigger auth flow
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
