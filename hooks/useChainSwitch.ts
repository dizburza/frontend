"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  useSwitchActiveWalletChain,
  useActiveWallet,
  useActiveWalletChain,
} from "thirdweb/react";
import { baseSepolia } from "thirdweb/chains";

import { SUPPORTED_CHAIN_ID } from "@/constants/chain";

export const useChainSwitch = () => {
  const wallet = useActiveWallet();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();

  const isOnCorrectChain = activeChain?.id === SUPPORTED_CHAIN_ID;

  const switchToBaseSepolia = useCallback(async () => {
    if (!wallet) {
      toast.error("No wallet connected");
      return false;
    }

    if (isOnCorrectChain) {
      return true;
    }

    try {
      await switchChain(baseSepolia);
      toast.success("Successfully switched to Base Sepolia");
      return true;
    } catch (error) {
      console.error("Failed to switch chain:", error);

      // Handle different error types
      if (error instanceof Error) {
        if (error.message.includes("rejected")) {
          toast.info("Chain switch cancelled by user");
        } else if (error.message.includes("Unrecognized chain")) {
          toast.error(
            "Please add Base Sepolia network to your wallet manually",
          );
        } else {
          toast.error(`Failed to switch network: ${error.message}`);
        }
      } else {
        toast.error("Failed to switch to Base Sepolia network");
      }

      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallet, isOnCorrectChain]);

  const ensureCorrectChain = useCallback(async () => {
    if (!wallet) {
      toast.warning("Please connect your wallet first");
      return false;
    }

    if (!isOnCorrectChain) {
      toast.warning("Please switch to Lisk Sepolia network");
      return await switchToBaseSepolia();
    }

    return true;
  }, [wallet, isOnCorrectChain, switchToBaseSepolia]);

  return {
    isOnCorrectChain,
    switchToBaseSepolia,
    ensureCorrectChain,
    currentChainId: activeChain?.id,
  };
};
