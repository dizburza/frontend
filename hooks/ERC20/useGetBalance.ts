import { useActiveAccount } from "thirdweb/react";
import useGetCngnBalanceByAddress from "@/hooks/ERC20/useGetCngnBalanceByAddress";

const useGetTokenBalance = () => {
  const account = useActiveAccount();
  return useGetCngnBalanceByAddress(account?.address);
};

export default useGetTokenBalance;
