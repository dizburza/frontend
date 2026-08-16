import { useBalance } from "@/hooks/useBalance";

/**
 * Kept as a thin shim so existing call sites don't change shape.
 *
 * Previously this wrapped thirdweb's `useWalletBalance`, which meant an RPC
 * `balanceOf` on every mount. It now reads the backend's cached value, which
 * paints instantly from localStorage and updates over the realtime stream.
 */
const useGetCngnBalanceByAddress = (address?: string | null) => {
  const { balance } = useBalance(address);
  return balance;
};

export default useGetCngnBalanceByAddress;
