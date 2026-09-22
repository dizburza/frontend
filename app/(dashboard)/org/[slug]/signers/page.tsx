"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { PillButton } from "@/components/ui/pill-button";
import { SectionCard } from "@/components/dashboard/section-card";
import useOrgSlug from "@/hooks/useOrgSlug";
import {
  fetchSignerChangeProposals,
  recordSignerChangeApproval,
  recordSignerChangeExecution,
  useOrganizationBySlug,
  type ApiSignerChangeProposal,
} from "@/lib/api/organization";
import { useSignerManagement } from "@/hooks/useSignerManagement";

const shortAddress = (value: string) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "--";

export default function OrganizationSignersPage() {
  const orgSlug = useOrgSlug();
  const account = useActiveAccount();
  const { data: organization, error, refresh: refreshOrg } = useOrganizationBySlug(orgSlug);

  const [proposals, setProposals] = useState<ApiSignerChangeProposal[]>([]);
  const [busyProposal, setBusyProposal] = useState<string | null>(null);

  const signers = useMemo(() => organization?.signers ?? [], [organization?.signers]);
  const quorum = organization?.quorum ?? 0;
  const signerManagement = useSignerManagement(organization?.contractAddress);

  const currentSignerName = useMemo(() => {
    const me = signers.find(
      (s) => s.address.toLowerCase() === account?.address?.toLowerCase()
    );
    return me?.name || account?.address || "Signer";
  }, [signers, account?.address]);

  const loadProposals = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const result = await fetchSignerChangeProposals(organization.id);
      setProposals(result.proposals ?? []);
    } catch {
      // The roster above is the page's job; a failed proposal read should not
      // replace it with an error screen.
    }
  }, [organization?.id]);

  useEffect(() => {
    void loadProposals();
  }, [loadProposals]);

  const pending = proposals.filter((p) => p.status === "pending" || p.status === "approved");

  const hasApproved = (proposal: ApiSignerChangeProposal) =>
    proposal.approvals.some(
      (a) => a.signerAddress.toLowerCase() === account?.address?.toLowerCase()
    );

  const handleApprove = async (proposal: ApiSignerChangeProposal) => {
    if (!organization?.id) return;

    setBusyProposal(proposal.proposalId);
    try {
      await signerManagement.approveSignerChange(proposal.proposalId);
      await recordSignerChangeApproval(organization.id, proposal.proposalId, {
        signerName: currentSignerName,
      });
      await loadProposals();
      toast.success("Approved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not approve this change");
    } finally {
      setBusyProposal(null);
    }
  };

  const handleExecute = async (proposal: ApiSignerChangeProposal) => {
    if (!organization?.id) return;

    setBusyProposal(proposal.proposalId);
    try {
      const txHash = await signerManagement.executeSignerChange(proposal.proposalId);
      await recordSignerChangeExecution(organization.id, proposal.proposalId, { txHash });
      await loadProposals();
      refreshOrg();
      toast.success("Signer change executed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not execute this change");
    } finally {
      setBusyProposal(null);
    }
  };

  if (error) {
    return (
      <div className="px-1 lg:px-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Failed to load organization: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-1 lg:px-10">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-1">
          <h1 className="font-nohemi text-3xl text-gray-600 lg:text-4xl">Signers</h1>
          <p className="text-xs text-zinc-700">
            {signers.length} signer{signers.length === 1 ? "" : "s"}, quorum of {quorum} needed to
            approve payroll.
          </p>
        </div>

        {/* Signers are promoted from the staff roster rather than added by
            address, so the only way in is through Employees. */}
        <PillButton asChild tone="primary" className="h-11">
          <Link href={orgSlug ? `/org/${orgSlug}/employees` : "/"}>Add from Employees</Link>
        </PillButton>
      </div>

      {pending.length > 0 ? (
        <SectionCard title="Pending Signer Changes">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-y border-gray-100 bg-neutral-100">
                  <th className="px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">
                    CHANGE
                  </th>
                  <th className="px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">
                    PERSON
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-normal tracking-wide text-neutral-600">
                    APPROVALS
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-normal tracking-wide text-neutral-600">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody>
                {pending.map((proposal) => {
                  const busy = busyProposal === proposal.proposalId;
                  const reachedQuorum = proposal.approvalCount >= proposal.quorumRequired;

                  return (
                    <tr key={proposal.proposalId} className="border-b border-gray-100">
                      <td className="px-3 py-4 text-xs font-medium text-neutral-800">
                        {proposal.isRemoval ? "Remove signer" : "Add signer"}
                      </td>
                      <td className="px-3 py-4 text-xs text-neutral-700">
                        <span className="block">{proposal.subjectName}</span>
                        <span className="block font-mono text-[11px] text-neutral-500">
                          {shortAddress(proposal.subjectAddress)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center text-xs font-semibold text-neutral-800">
                        {proposal.approvalCount}/{proposal.quorumRequired}
                      </td>
                      <td className="px-3 py-4 text-right">
                        {reachedQuorum ? (
                          <button
                            type="button"
                            onClick={() => void handleExecute(proposal)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-[4px] bg-[#4F51D9] px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                            Execute
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleApprove(proposal)}
                            disabled={busy || hasApproved(proposal)}
                            className="inline-flex items-center gap-2 rounded-[4px] border border-[#A8ACF2] bg-[#F0F1FD] px-4 py-2 text-xs font-medium text-[#1D1E49] disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                            {hasApproved(proposal) ? "Approved" : "Approve"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Authorized Signers">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-y border-gray-100 bg-neutral-100">
                <th className="w-12 px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">S/N</th>
                <th className="px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">NAME</th>
                <th className="px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">
                  WALLET ADDRESS
                </th>
                <th className="px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">ROLE</th>
                <th className="px-3 py-3 text-xs font-normal tracking-wide text-neutral-600">JOINED</th>
                <th className="px-3 py-3 text-center text-xs font-normal tracking-wide text-neutral-600">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {signers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-gray-500">
                    No signers yet.
                  </td>
                </tr>
              ) : (
                signers.map((signer, index) => (
                  <tr key={signer.address} className="border-b border-gray-100 hover:bg-surface-canvas">
                    <td className="px-3 py-4 text-xs text-gray-500">{index + 1}</td>
                    <td className="px-3 py-4 text-xs font-medium text-neutral-800">
                      {signer.name || "--"}
                    </td>
                    <td className="px-3 py-4 font-mono text-xs text-neutral-600">
                      {shortAddress(signer.address)}
                    </td>
                    <td className="px-3 py-4 text-xs capitalize text-neutral-600">{signer.role}</td>
                    <td className="px-3 py-4 text-xs text-neutral-600">
                      {signer.joinedAt
                        ? new Date(signer.joinedAt).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "--"}
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium leading-3 ${
                          signer.isActive ? "bg-green-50 text-lime-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {signer.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
