"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";

import { PillButton } from "@/components/ui/pill-button";
import { BatchPaymentPromo } from "@/components/dashboard/batch-payment-promo";
import { StatCard } from "@/components/dashboard/stat-card";
import { TreasuryCard } from "@/components/dashboard/treasury-card";
import { ProposalHistory } from "@/components/dashboard/proposal-history";
import { AuthorizedSigners } from "@/components/dashboard/authorized-signers";
import { PaymentActivity } from "@/components/dashboard/payment-activity";
import { BatchPaymentCreationModal } from "@/components/payments/batch-payment-creation-modal";

import useOrgSlug from "@/hooks/useOrgSlug";
import {
  useOrganizationBatches,
  useOrganizationBySlug,
  useOrganizationEmployees,
  useTransactionHistory,
} from "@/lib/api/organization";
import { useOrganizationProposals } from "@/lib/api/proposals";
import useGetOrgTreasuryBalance from "@/hooks/ERC20/useGetOrgTreasuryBalance";
import { useToken } from "@/hooks/useToken";

export default function OrganizationDashboardPage() {
  const { symbol } = useToken();
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const orgSlug = useOrgSlug();
  const base = orgSlug ? `/org/${orgSlug}` : "/";

  const { data: organization, loading: orgLoading, error: orgError } =
    useOrganizationBySlug(orgSlug);

  const organizationId = organization?.id ?? null;
  const { data: employeesData } = useOrganizationEmployees(organizationId);
  const { data: batchesData, refresh: refreshBatches } = useOrganizationBatches(organizationId);
  const { data: proposalData } = useOrganizationProposals(organizationId);

  const account = useActiveAccount();
  const transactionsAddress = organization?.contractAddress ?? account?.address ?? null;
  const { data: transactionsData, refresh: refreshTransactions } = useTransactionHistory(
    transactionsAddress,
    { limit: 5, page: 1 }
  );

  const treasuryBalance = useGetOrgTreasuryBalance();

  const proposals = useMemo(() => (proposalData?.proposals ?? []).slice(0, 3), [proposalData]);
  const openProposalCount = useMemo(
    () => (proposalData?.proposals ?? []).filter((p) => p.status === "open").length,
    [proposalData]
  );

  const signers = useMemo(
    () =>
      (organization?.signers ?? []).map((s) => ({
        address: s.address,
        role: s.role,
        isActive: s.isActive,
      })),
    [organization?.signers]
  );

  const batches = useMemo(() => batchesData?.batches ?? [], [batchesData]);

  // The most recent batch that actually paid out. Formatted server side, so
  // nothing here needs to know the token's precision.
  const lastPayroll = useMemo(() => {
    const executed = batches
      .filter((batch) => batch.status === "executed")
      .sort(
        (a, b) =>
          new Date(b.executedAt ?? b.updatedAt).getTime() -
          new Date(a.executedAt ?? a.updatedAt).getTime()
      );

    const latest = executed[0];
    if (!latest?.totalAmountFormatted) return "--";

    const amount = Number.parseFloat(latest.totalAmountFormatted);
    if (!Number.isFinite(amount)) return "--";

    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }, [batches]);

  const totalEmployees = employeesData?.totalEmployees ?? organization?.employees?.length ?? 0;

  const handleBatchCreated = () => {
    setIsBatchModalOpen(false);
    refreshBatches();
    refreshTransactions();
  };

  if (orgError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">Failed to load organization: {orgError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-1 lg:px-10">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-nohemi text-3xl text-gray-600 lg:text-4xl">
            Hi {orgLoading ? "there" : organization?.name || "there"}!
          </h1>
          <p className="text-xs text-zinc-700">
            Here is what is happening with {organization?.name || "your organization"} today
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <PillButton asChild tone="soft" className="h-11">
            <Link href={`${base}/proposals`}>
              New Proposal
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full outline outline-1 -outline-offset-1 outline-indigo-900">
                <span className="flex size-4 items-center justify-center rounded-full bg-[#1D1E49] text-[10px] font-medium leading-none text-white">
                  <span className="translate-y-[0.5px]">{openProposalCount}</span>
                </span>
              </span>
            </Link>
          </PillButton>

          <PillButton asChild tone="primary" className="h-11">
            <Link href={`${base}/employees`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 8h8M8 4v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Employees
            </Link>
          </PillButton>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-[minmax(0,556px)_minmax(0,1fr)]">
        <BatchPaymentPromo onCreate={() => setIsBatchModalOpen(true)} />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatCard
            label="Employees"
            href={`${base}/employees`}
            hint="People on the payroll of this organization."
            value={String(totalEmployees)}
            icon={<Image src="/icons/people.svg" alt="" width={14} height={14} className="size-3.5" />}
          />
          <StatCard
            label={`Last Payroll (${symbol || "--"})`}
            href={`${base}/payments`}
            hint="Total of the most recently executed batch."
            value={lastPayroll}
            icon={<Image src="/icons/transaction-minus.svg" alt="" width={14} height={14} className="size-3.5" />}
          />
          <StatCard
            label="Signers"
            href={`${base}/signers`}
            hint="Addresses that can approve payroll."
            value={String(signers.length)}
            icon={<Image src="/icons/user-edit.svg" alt="" width={14} height={14} className="size-3.5" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-[minmax(0,556px)_minmax(0,1fr)]">
        <TreasuryCard address={organization?.contractAddress ?? null} balance={treasuryBalance} />

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <ProposalHistory proposals={proposals} viewAllHref={`${base}/proposals`} />
          <AuthorizedSigners signers={signers} viewAllHref={`${base}/signers`} />
        </div>
      </div>

      <PaymentActivity
        transactions={transactionsData?.transactions ?? []}
        batches={batches}
        viewAllHref={`${base}/transactions`}
      />

      {isBatchModalOpen ? (
        <BatchPaymentCreationModal
          organizationId={organization?.id}
          organizationAddress={organization?.contractAddress}
          onClose={() => setIsBatchModalOpen(false)}
          onPaymentCreated={handleBatchCreated}
        />
      ) : null}
    </div>
  );
}
