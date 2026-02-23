import {
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
} from "thirdweb/react";

// Custom hook to mimic useAccount
export const useAccount = () => {
  const account = useActiveAccount();
  return {
    address: account?.address,
    isConnected: !!account,
    account,
  };
};

// Custom hook to mimic useChainId
export const useChainId = () => {
  const activeChain = useActiveWalletChain();
  return activeChain?.id;
};

// Custom hook to mimic useAppKitProvider
export const useAppKitProvider = () => {
  const wallet = useActiveWallet();
  return { walletProvider: wallet };
};

// Utility function to check if wallet supports a method
export const walletSupports = (wallet: never, method: string): boolean => {
  return wallet && method in wallet && typeof wallet[method] === "function";
};
