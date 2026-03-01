"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisChart } from "@/components/dashboard/analysis-chart";
import AddSignersModal from "@/components/organization/add-signers-modal";
import { useMemo, useState } from "react";
import {
  mockProposals,
} from "@/lib/static/mock-data";
import Image from "next/image";
import { Copy, Info } from "lucide-react";
import Link from "next/link";
import useOrgSlug from "@/hooks/useOrgSlug";
import {
  useOrganizationBatches,
  useOrganizationBySlug,
  useOrganizationEmployees,
  useTransactionHistory,
} from "@/lib/api/organization";
import { useActiveAccount } from "thirdweb/react";
import useGetOrgTreasuryBalance from "@/hooks/ERC20/useGetOrgTreasuryBalance";

export default function OrganizationDashboardPage() {
  const [isAddSignersOpen, setIsAddSignersOpen] = useState(false);

  const orgSlug = useOrgSlug();
  const viewAllTransactionsHref = orgSlug ? `/org/${orgSlug}/transactions` : "/";
  const viewAllEmployeesHref = orgSlug ? `/org/${orgSlug}/employees` : "/";
  const viewAllPaymentsHref = orgSlug ? `/org/${orgSlug}/payments` : "/";
  const viewAllProposalsHref = orgSlug ? `/org/${orgSlug}/proposals` : "/";

  const { data: organization, loading: orgLoading, error: orgError, refresh: refreshOrg } =
    useOrganizationBySlug(orgSlug);

  const organizationId = organization?._id ?? null;
  const { data: employeesData } = useOrganizationEmployees(organizationId);
  const { data: batchesData } = useOrganizationBatches(organizationId);

  const account = useActiveAccount();
  const transactionsAddress = account?.address ?? organization?.contractAddress ?? null;
  const { data: transactionsData } = useTransactionHistory(transactionsAddress, { limit: 5, page: 1 });

  const treasuryBalance = useGetOrgTreasuryBalance();

  const proposals = mockProposals.list;

  const toShortAddress = (value: string) => {
    if (!value) return "--";
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  const getTxStatusClass = (status: "pending" | "confirmed" | "failed") => {
    if (status === "confirmed") return "bg-green-100 text-green-800";
    if (status === "pending") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const formatCngnAmount = (amount: string, displayAmount?: string) => {
    const normalized = String(displayAmount || "")
      .replaceAll("+", "")
      .replaceAll("-", "")
      .trim();

    if (normalized) {
      const parsed = Number.parseFloat(normalized);
      if (Number.isFinite(parsed)) {
        return parsed.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        });
      }
    }

    const base = Number.parseFloat(String(amount || "0"));
    const decimals = 6;
    const converted = base / 10 ** decimals;
    if (!Number.isFinite(converted)) return "--";

    return converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const signers = useMemo(() => {
    return (organization?.signers || []).map((s) => ({
      address: s.address,
      role: s.role,
      isActive: s.isActive,
    }));
  }, [organization?.signers]);

  const totalEmployees = employeesData?.totalEmployees ?? organization?.employees?.length ?? 0;
  const quorum = organization?.quorum ?? 0;

  const batchStats = batchesData?.stats || { pending: 0, approved: 0, executed: 0, cancelled: 0 };

  // Refresh signers when they're added
  const handleSignersAdded = () => {
    refreshOrg();
  };

  if (orgError) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load organization: {orgError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      {/* Welcome Banner */}
      <Card className="rounded-xl bg-white px-4 pt-4 mb-4">
        <div className="bg-[#373CD0] rounded-md relative h-32 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute top-4 left-1/2 w-16 h-16 bg-white rounded-full blur-2xl" />
            <div className="absolute top-20 right-1/2 w-20 h-20 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-4 right-12 w-12 h-12 bg-white rounded-full blur-2xl" />

            <svg
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 1600 900"
            >
              <defs>
                <pattern
                  id="diagonals"
                  x="0"
                  y="0"
                  width="200"
                  height="200"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="200"
                    y2="200"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <line
                    x1="200"
                    y1="0"
                    x2="0"
                    y2="200"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </pattern>
              </defs>
              <rect width="1600" height="900" fill="url(#diagonals)" />
            </svg>
          </div>

          <div className="relative z-10 px-8 py-4">
            <h1 className="text-lg font-bold ">
              Welcome to Dizburza for Organizations
            </h1>
            <p className="text-xs text-blue-100">
              Start managing approvals, payments, and finance
            </p>
          </div>
          <div className="absolute left-44 bottom-0 z-10">
            <Image
              src={"/bubbles-left.svg"}
              alt="org wallet design"
              width={300}
              height={300}
            />
          </div>
          <div className="absolute right-44 bottom-0 z-10">
            <Image
              src={"/bubbles.svg"}
              alt="org wallet design"
              width={500}
              height={500}
            />
          </div>
          <div className="absolute right-0 bottom-0 z-10">
            <Image
              src={"/org-wallet.svg"}
              alt="org wallet design"
              width={150}
              height={150}
            />
          </div>
        </div>

        {/* Organization Info Card */}
        <div className="pt-4 px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start gap-x-4 gap-y-2">
              <div className="relative bottom-8 z-10">
                <Image
                  src="/org-logo.svg"
                  alt="Org logo"
                  width={100}
                  height={100}
                />
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {orgLoading ? "Loading..." : (organization?.name || "--")}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-[#F2F1EC] rounded-xl text-amber-800 text-xs font-medium">
                      {organization?.metadata?.industry || "--"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">Quorum: {quorum}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 border-b-2 border-[#8286E9]"
                onClick={() => setIsAddSignersOpen(true)}
              >
                + Add Signers
              </Button>
              <Button variant="outline">Export ↓</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full mb-8">
        {/* Left Sidebar - Wallet */}
        <div className="lg:col-span-3 h-full">
          <Card className="h-full">
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  Treasury: {organization?.contractAddress ? toShortAddress(organization.contractAddress) : "--"}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (organization?.contractAddress) {
                      copyToClipboard(organization.contractAddress);
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <p className="text-sm text-gray-600">Total Balance</p>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {treasuryBalance === null ? "--" : treasuryBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div className="flex items-center">
                    <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                    <span className="text-[#26297A] text-center">cNGN</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {treasuryBalance === null ? "Balance data will appear here." : "Live on-chain treasury balance."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Content - Payroll Summary */}
        <div className="lg:col-span-5 h-full">
          <Card className="h-full">
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-semibold text-gray-900">
                  Payroll Summary
                </p>
                <Link href={viewAllPaymentsHref} className="text-blue-600 text-sm font-medium hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-8 gap-2">
                <div className="p-4 col-span-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#26297A] mb-2">
                    Active Employees
                  </p>
                  <p className="text-xl font-bold text-[#26297A]">
                    {totalEmployees}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 col-span-3 rounded-lg">
                  <p className="text-xs text-[#26297A] mb-2">Pending</p>
                  <div className="flex gap-2">
                    <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                    <p className="text-lg font-bold text-[#26297A]">{batchStats.pending.toLocaleString()}.00</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg col-span-3">
                  <p className="text-xs text-[#26297A] mb-2">Paid</p>
                  <div className="flex gap-2">
                    <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                    <p className="text-lg font-bold text-[#26297A]">{batchStats.executed.toLocaleString()}.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Authorized Signers */}
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  Authorized Signers
                </CardTitle>
                <Link href={viewAllEmployeesHref} className="text-blue-600 text-sm font-medium hover:underline">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-600 font-medium text-xs">
                        S/N
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium text-xs">
                        Wallet Address
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium text-xs">
                        Role
                      </th>
                      <th className="text-left py-2 px-2 text-gray-600 font-medium text-xs">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {signers.map((signer, index: number) => (
                      <tr
                        key={signer.address}
                        className={index < signers.length - 1 ? "border-b border-gray-100" : ""}
                      >
                        <td className="py-3 px-2 text-gray-900">{index + 1}</td>
                        <td className="py-3 px-2 text-gray-900">
                          {toShortAddress(signer.address)}
                        </td>
                        <td className="py-3 px-2 text-gray-900">{signer.role}</td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              signer.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {signer.isActive ? "active" : "inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis and Proposal History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <Card className="h-96">
          <AnalysisChart />
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Proposal History</CardTitle>
              <Link href={viewAllProposalsHref} className="text-blue-600 text-sm font-medium hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">#</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Proposal</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Time Left</th>
                    <th className="text-left py-2 px-2 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal, index) => (
                    <tr
                      key={proposal.id}
                      className={index < proposals.length - 1 ? "border-b border-gray-100" : ""}
                    >
                      <td className="py-3 px-2">{index + 1}</td>
                      <td className="py-3 px-2">{proposal.title}</td>
                      <td className="py-3 px-2 text-gray-600">{proposal.timeLeft}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            proposal.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {proposal.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>My Transactions</CardTitle>
            <Link href={viewAllTransactionsHref} className="text-blue-600 text-sm font-medium">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">#</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">TNX HASH</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Description</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">From</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">To</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Amount (cNGN)</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(transactionsData?.transactions || []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-500">
                      No transactions to display.
                    </td>
                  </tr>
                ) : (
                  (transactionsData?.transactions || []).map((tx, index) => (
                    <tr
                      key={tx._id}
                      className={
                        index < Math.min((transactionsData?.transactions || []).length, 5) - 1
                          ? "border-b border-gray-100"
                          : ""
                      }
                    >
                      <td className="py-3 px-2">{index + 1}</td>
                      <td className="py-3 px-2 text-gray-600 font-mono text-xs">{toShortAddress(tx.txHash)}</td>
                      <td className="py-3 px-2">{tx.description || tx.batchName || "Transaction"}</td>
                      <td className="py-3 px-2 text-gray-600 font-mono text-xs">{toShortAddress(tx.fromAddress)}</td>
                      <td className="py-3 px-2 text-gray-600 font-mono text-xs">{toShortAddress(tx.toAddress)}</td>
                      <td className="py-3 px-2">{formatCngnAmount(tx.amount, tx.displayAmount)}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 text-xs rounded ${getTxStatusClass(tx.status)}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <AddSignersModal
        isOpen={isAddSignersOpen}
        onClose={() => setIsAddSignersOpen(false)}
        onSignersAdded={handleSignersAdded}
      />
    </div>
  );
}
