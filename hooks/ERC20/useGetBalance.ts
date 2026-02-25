import { useWalletBalance, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

const useGetTokenBalance = () => {
  const account = useActiveAccount();

  const { data } = useWalletBalance({
    address: account?.address,
    chain: baseSepolia,
    client: thirdwebClient,
    tokenAddress: process.env.NEXT_PUBLIC_CNGN_ADDRESS,
  });

  return data?.displayValue ? Number.parseFloat(data.displayValue) : null;
};

export default useGetTokenBalance;
