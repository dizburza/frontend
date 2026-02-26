"use client";

import { BalanceCard } from "@/components/dashboard/balance-card";
import { IncomeExpenseCards } from "@/components/dashboard/income-expense-cards";
import { AnalysisChart } from "@/components/dashboard/analysis-chart";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { OrganizationPromotionCard } from "@/components/dashboard/organization-card";

export default function WalletPage() {
  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-6 w-full">
      <div><OrganizationPromotionCard /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-9 min-h-[300px] w-full gap-4">
        <div className="w-full md:col-span-2 lg:col-span-3 h-full">
          <BalanceCard />
        </div>
        <div className="w-full md:col-span-2 lg:col-span-2 h-full">
          <IncomeExpenseCards />
        </div>
        <div className="w-full md:col-span-2 lg:col-span-4 h-full">
          <AnalysisChart />
        </div>
      </div>
      <TransactionHistory viewAllHref="/personal/transactions" limit={3} />
    </div>
  );
}
