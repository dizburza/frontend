"use client";

import { thirdwebClient, wallets } from "@/app/client";
import { useRouter } from "next/navigation";
import { ConnectButton, darkTheme, useActiveAccount } from "thirdweb/react";
import {
  getDisplayName,
  useAutoSwitchToBaseSepolia,
  useBasename,
  useConnectMetadata,
  useMounted,
  useRedirectOnFirstConnect,
} from "./connectWalletHelpers";
import { useChainSwitch } from "@/hooks/useChainSwitch";
import { baseSepolia } from "thirdweb/chains";

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
  const mounted = useMounted();
  const account = useActiveAccount();
  const router = useRouter();
  const { isOnCorrectChain, switchToBaseSepolia } = useChainSwitch();

  const metadata = useConnectMetadata();
  const { basename, isLoadingBasename } = useBasename(account?.address);

  useRedirectOnFirstConnect({ account, onConnect, router });
  useAutoSwitchToBaseSepolia({
    account,
    isOnCorrectChain,
    switchToBaseSepolia,
  });

  const displayName = getDisplayName({
    account,
    basename,
    isLoadingBasename,
    label,
  });

  const renderConnectedDetailsButton = () => {
    return (
      <span
        className="inline-flex h-10 cursor-pointer min-w-[140px] max-w-[220px] items-center justify-center rounded-md bg-[#454ADE] px-3 text-sm font-medium text-white shadow-sm ring-1 ring-white/10 hover:bg-[#3f44d0] active:bg-[#373bba"
      >
        <span className="truncate">
          {displayName}
        </span>
      </span>
    );
  };

  if (!mounted) {
    return (
      <span
        className={
          connectButtonClassName ||
          "inline-flex h-10 min-w-[140px] items-center justify-center rounded-md bg-[#454ADE] px-3 text-sm font-medium text-white"
        }
      >
        {label}
      </span>
    );
  }

  return (
    <div>
      <ConnectButton
        client={thirdwebClient}
        appMetadata={metadata}
        connectButton={{
          label: account ? displayName : label,
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
  );
};

export default ConnectWallet;
