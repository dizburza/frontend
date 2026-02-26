"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisChart } from "@/components/dashboard/analysis-chart";
import AddSignersModal from "@/components/organization/add-signers-modal";
import { useState } from "react";
import {
  mockOrganizations,
  mockWallet,
  mockProposals,
  mockTransactions,
} from "@/lib/static/mock-data";
import { getOrganizationSigners } from "@/lib/localStorage";
import Image from "next/image";
import { Copy, Info } from "lucide-react";
import Link from "next/link";
import useOrgSlug from "@/hooks/useOrgSlug";

export default function OrganizationDashboardPage() {
  const [isAddSignersOpen, setIsAddSignersOpen] = useState(false);
  const [signers, setSigners] = useState(getOrganizationSigners());

  const orgSlug = useOrgSlug();
  const viewAllTransactionsHref = orgSlug ? `/org/${orgSlug}/transactions` : "/";

  const org = mockOrganizations.current;
  const wallet = mockWallet.organization;
  const proposals = mockProposals.list;
  const transactions = mockTransactions.list;

  // Refresh signers when they're added
  const handleSignersAdded = () => {
    setSigners(getOrganizationSigners());
  };

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
                    {org.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-[#F2F1EC] rounded-xl text-amber-800 text-xs font-medium">
                      {org.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mt-2">📍 {org.location}</p>
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
                  Wallet : {wallet.address}
                </p>
                <button className="text-gray-400 hover:text-gray-600">
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
                    {wallet.balance.toLocaleString()}.00
                  </p>
                  <div className="flex items-center">
                    <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                    <span className="text-[#26297A] text-center">cNGN</span>
                  </div>
                </div>
                <p className="text-sm text-green-600">
                  ▲ {wallet.changePercent}% than last month
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
                <button
                  type="button"
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-8 gap-2">
                <div className="p-4 col-span-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-[#26297A] mb-2">
                    Active Employees
                  </p>
                  <p className="text-xl font-bold text-[#26297A]">
                    {org.totalEmployees}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 col-span-3 rounded-lg">
                  <p className="text-xs text-[#26297A] mb-2">Pending</p>
                  <div className="flex gap-2">
                    <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                    <p className="text-lg font-bold text-[#26297A]">275,000.00</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg col-span-3">
                  <p className="text-xs text-[#26297A] mb-2">Paid</p>
                  <div className="flex gap-2">
                    <Image src={"/cngn.svg"} alt="cNGN" width={24} height={24} />
                    <p className="text-lg font-bold text-[#26297A]">275,000.00</p>
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
                <button
                  type="button"
                  className="text-blue-600 text-sm font-medium hover:underline"
                >
                  View all
                </button>
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
                    {signers.map((signer: typeof org.signers[0], index: number) => (
                      <tr
                        key={signer.id}
                        className={index < signers.length - 1 ? "border-b border-gray-100" : ""}
                      >
                        <td className="py-3 px-2 text-gray-900">{index + 1}</td>
                        <td className="py-3 px-2 text-gray-900">
                          {signer.username}
                        </td>
                        <td className="py-3 px-2 text-gray-900">{signer.role}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                            {signer.status}
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
              <button type="button" className="text-blue-600 text-sm font-medium">
                View all
              </button>
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
            <CardTitle>Transaction History</CardTitle>
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
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Batch Name</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Initiated By</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Amount</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Type</th>
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((tx, index) => (
                  <tr
                    key={tx.id}
                    className={
                      index < Math.min(transactions.length, 5) - 1
                        ? "border-b border-gray-100"
                        : ""
                    }
                  >
                    <td className="py-3 px-2">{index + 1}</td>
                    <td className="py-3 px-2 text-gray-600 font-mono text-xs">{tx.transactionHash}</td>
                    <td className="py-3 px-2">{tx.batchName}</td>
                    <td className="py-3 px-2">{tx.initiatedBy}</td>
                    <td className="py-3 px-2">{tx.totalAmount.toLocaleString()} cNGN</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          tx.type === "Inflow"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          tx.status === "Completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
