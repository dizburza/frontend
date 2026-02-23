"use client";

import { thirdwebClient, wallets } from "@/app/client";
import { useEffect, useState } from "react";
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import type { Account } from "thirdweb/wallets";
import { useChainSwitch } from "@/hooks/useChainSwitch";
import { baseSepolia } from "thirdweb/chains";
import { getBasename } from "@superdevfavour/basename";
import { useRouter } from "next/navigation";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: unknown;
};

type AuthCheckData = {
  isRegistered: boolean;
  user?: {
    role?: "employee" | "signer" | "admin";
  };
};

const isHexPrefixedAddress = (address: string): address is `0x${string}` => {
  return address.startsWith("0x");
};

interface ConnectWalletProps {
  onConnect?: () => void;
  label?: string;
  connectButtonClassName?: string;
}

const ConnectWallet = ({
  onConnect,
  label = "Connect Wallet",
  connectButtonClassName,
}: ConnectWalletProps) => {
  const [mounted, setMounted] = useState(false);
  const account = useActiveAccount();
  const router = useRouter();
  const [prevAccount, setPrevAccount] = useState<Account | undefined>(
    undefined,
  );
  const [basename, setBasename] = useState<string | null>(null);
  const [isLoadingBasename, setIsLoadingBasename] = useState(false);
  const { isOnCorrectChain, switchToBaseSepolia } = useChainSwitch();

  const origin =
    globalThis.window === undefined
      ? "https://craftlinkhq.com"
      : globalThis.location.origin;

  const metadata = {
    name: "craftLink",
    description: "The Future of Decentralized Commerce",
    url: origin,
    icons: ["https://assets.reown.com/reown-profile-pic.png"],
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Basename for connected wallet
  useEffect(() => {
    const fetchBasename = async () => {
      if (!account?.address) {
        setBasename(null);
        return;
      }

      if (!isHexPrefixedAddress(account.address)) {
        setBasename(null);
        return;
      }

      try {
        setIsLoadingBasename(true);
        const name = await getBasename(account.address);
        setBasename(name || null);
      } catch (error) {
        console.log("No Basename found or error fetching:", error);
        setBasename(null);
      } finally {
        setIsLoadingBasename(false);
      }
    };

    fetchBasename();
  }, [account?.address]);

  useEffect(() => {
    const redirectForAccount = async () => {
      if (!account || prevAccount) return;

      if (onConnect) {
        onConnect();
      }

      try {
        const res = await fetch(
          `/api/auth/check/${account.address}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          router.push("/setup-profile");
          return;
        }

        const payload = (await res.json()) as ApiResponse<AuthCheckData>;
        const data = payload.data;
        const isRegistered = Boolean(data?.isRegistered);
        const role = data?.user?.role;

        if (!isRegistered) {
          router.push("/setup-profile");
          return;
        }

        if (role === "admin" || role === "signer") {
          router.push("/organization");
          return;
        }

        if (role === "employee") {
          router.push("/personal/wallet");
          return;
        }

        router.push("/setup-profile");
      } catch {
        router.push("/setup-profile");
      }
    };

    redirectForAccount();
    setPrevAccount(account);
  }, [account, prevAccount, onConnect, router]);

  // Auto-switch to correct chain when wallet connects
  useEffect(() => {
    if (account && !isOnCorrectChain) {
      // Small delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        switchToBaseSepolia();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [account, isOnCorrectChain, switchToBaseSepolia]);

  // Format display name: Basename or shortened address
  const getDisplayName = () => {
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

  const renderConnectedDetailsButton = () => {
    return (
      <span
        className="inline-flex h-10 min-w-[140px] max-w-[220px] items-center justify-center rounded-md bg-[#454ADE] px-3 text-sm font-medium text-white shadow-sm ring-1 ring-white/10 hover:bg-[#3f44d0] active:bg-[#373bba"
      >
        <span className="truncate">
          {getDisplayName()}
        </span>
      </span>
    );
  };

  if (!mounted) return null;

  return (
    <div>
      <div className="hidden md:flex">
        <ConnectButton
          client={thirdwebClient}
          appMetadata={metadata}
          connectButton={{
            label: account ? getDisplayName() : label,
            className: connectButtonClassName,
          }}
          detailsButton={{
            render: renderConnectedDetailsButton,
          }}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          chain={baseSepolia}
          chains={[baseSepolia]}
          theme={darkTheme({
            colors: {
              primaryButtonBg: "#454ADE",
              primaryButtonText: "hsl(0, 0%, 100%)",
            },
          })}
        />
      </div>
      <div className="md:hidden flex">
        <ConnectButton
          client={thirdwebClient}
          appMetadata={metadata}
          connectButton={{
            label: account ? getDisplayName() : label,
            className: connectButtonClassName,
          }}
          detailsButton={{
            render: renderConnectedDetailsButton,
          }}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          chain={baseSepolia}
          chains={[baseSepolia]}
          theme={darkTheme({
            colors: {
              primaryButtonBg: "#454ADE",
              primaryButtonText: "hsl(0, 0%, 100%)",
            },
          })}
        />
      </div>
    </div>
  );
};

export default ConnectWallet;
