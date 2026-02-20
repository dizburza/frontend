"use client";

import { BalanceCard } from "@/components/dashboard/balance-card";
import { IncomeExpenseCards } from "@/components/dashboard/income-expense-cards";
import { AnalysisChart } from "@/components/dashboard/analysis-chart";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { OrganizationPromotionCard } from "@/components/dashboard/organization-card";

export default function WalletPage() {
  return (
    <div className="space-y-8 px-8 py-8 w-full grid">
      <div><OrganizationPromotionCard /></div>
      <div className="grid lg:grid-cols-9 max-h-[300px]  w-full gap-x-4">
        <div className="w-full col-span-3 h-full">
          <BalanceCard />
        </div>
        <div className="w-full col-span-2 h-full">
          {" "}
          <IncomeExpenseCards />
        </div>
        <div className="w-full col-span-4 h-full">
          {" "}
          <AnalysisChart />
        </div>
      </div>
      <TransactionHistory />
    </div>
  );
}
