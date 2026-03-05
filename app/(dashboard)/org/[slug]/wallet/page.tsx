"use client";

import { BalanceCard } from "@/components/dashboard/balance-card";
import { IncomeExpenseCards } from "@/components/dashboard/income-expense-cards";
import { AnalysisChart } from "@/components/dashboard/analysis-chart";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { OrganizationPromotionCard } from "@/components/dashboard/organization-card";
import useOrgSlug from "@/hooks/useOrgSlug";
import { useOrganizationBySlug } from "@/lib/api/organization";

export default function WalletPage() {
  const orgSlug = useOrgSlug();
  const viewAllHref = orgSlug ? `/org/${orgSlug}/transactions` : "/";
  const { data: organization } = useOrganizationBySlug(orgSlug);
  const treasuryAddress = organization?.contractAddress ?? null;

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 w-full grid">
      <div>
        <OrganizationPromotionCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-9 gap-4 min-h-[300px] w-full">
        <div className="w-full lg:col-span-3 h-full">
          <BalanceCard />
        </div>
        <div className="w-full lg:col-span-2 h-full">
          <IncomeExpenseCards address={treasuryAddress} />
        </div>
        <div className="w-full lg:col-span-4 h-full">
          <AnalysisChart />
        </div>
      </div>
      <TransactionHistory viewAllHref={viewAllHref} limit={3} />
    </div>
  );
}
