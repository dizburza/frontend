import { useWalletBalance } from "thirdweb/react";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

const useGetCngnBalanceByAddress = (address?: string | null) => {
  const { data } = useWalletBalance({
    address: address || undefined,
    chain: baseSepolia,
    client: thirdwebClient,
    tokenAddress: process.env.NEXT_PUBLIC_CNGN_ADDRESS,
  });

  return data?.displayValue ? Number.parseFloat(data.displayValue) : null;
};

export default useGetCngnBalanceByAddress;
