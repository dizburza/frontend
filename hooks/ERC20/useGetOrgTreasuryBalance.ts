import useOrgSlug from "@/hooks/useOrgSlug";
import { useOrganizationBySlug } from "@/lib/api/organization";
import useGetCngnBalanceByAddress from "@/hooks/ERC20/useGetCngnBalanceByAddress";

const useGetOrgTreasuryBalance = () => {
  const orgSlug = useOrgSlug();
  const { data: organization } = useOrganizationBySlug(orgSlug);
  return useGetCngnBalanceByAddress(organization?.contractAddress);
};

export default useGetOrgTreasuryBalance;
