"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ChevronRight, Copy, Loader2, Search, X } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { PillButton } from "@/components/ui/pill-button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/dashboard/section-card";
import useOrgSlug from "@/hooks/useOrgSlug";
import {
  fetchSignerChangeProposals,
  recordSignerChangeApproval,
  recordSignerChangeExecution,
  useOrganizationBySlug,
  useOrganizationEmployees,
  type ApiSignerChangeProposal,
} from "@/lib/api/organization";
import {
  useOrganizationProposals,
  type Proposal,
  type ProposalStatus,
} from "@/lib/api/proposals";
import { statusClasses, statusLabel } from "@/lib/proposal-format";
import { useSignerManagement } from "@/hooks/useSignerManagement";

const shortAddress = (value: string) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "--";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

type ViewMode = "table" | "grid";

type SignerRow = {
  address: string;
  name: string;
  role: "owner" | "signer";
  joinedAt: string;
  isActive: boolean;
  username: string | null;
  avatar: string | null;
  proposalsCreated: number;
  totalVotes: number;
};

export default function OrganizationSignersPage() {
  const orgSlug = useOrgSlug();
  const base = orgSlug ? `/org/${orgSlug}` : "/";
  const account = useActiveAccount();
  const { data: organization, error, refresh: refreshOrg } = useOrganizationBySlug(orgSlug);

  const [proposals, setProposals] = useState<ApiSignerChangeProposal[]>([]);
  const [busyProposal, setBusyProposal] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [activeSigner, setActiveSigner] = useState<SignerRow | null>(null);

  const { data: employeesData } = useOrganizationEmployees(organization?.id || null);
  const { data: proposalData } = useOrganizationProposals(organization?.id ?? null);

  const signers = useMemo(() => organization?.signers ?? [], [organization?.signers]);
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

  const employeeByAddress = useMemo(() => {
    const map = new Map<string, { username: string | null; avatar: string | null }>();
    for (const e of employeesData?.employees ?? []) {
      map.set(e.walletAddress.toLowerCase(), {
        username: e.displayUsername || e.username || null,
        avatar: e.avatar || null,
      });
    }
    return map;
  }, [employeesData]);

  const allProposals = proposalData?.proposals ?? [];

  const rows: SignerRow[] = useMemo(
    () =>
      signers.map((signer) => {
        const key = signer.address.toLowerCase();
        const matched = employeeByAddress.get(key);
        const createdByThem = allProposals.filter(
          (p) => p.createdByAddress.toLowerCase() === key
        );
        const votesByThem = allProposals.reduce(
          (count, p) =>
            count + (p.votes.some((v) => v.voterAddress.toLowerCase() === key) ? 1 : 0),
          0
        );

        return {
          address: signer.address,
          name: signer.name,
          role: signer.role,
          joinedAt: signer.joinedAt,
          isActive: signer.isActive,
          username: matched?.username ?? null,
          avatar: matched?.avatar ?? null,
          proposalsCreated: createdByThem.length,
          totalVotes: votesByThem,
        };
      }),
    [signers, employeeByAddress, allProposals]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.address.toLowerCase().includes(term) ||
        (r.username ?? "").toLowerCase().includes(term)
    );
  }, [rows, search]);

  const activeCount = rows.filter((r) => r.isActive).length;

  const signerProposals = useMemo(() => {
    if (!activeSigner) return [];
    const key = activeSigner.address.toLowerCase();
    return allProposals.filter((p) => p.createdByAddress.toLowerCase() === key);
  }, [activeSigner, allProposals]);

  const signerActivity = useMemo(() => {
    if (!activeSigner) return [];
    const key = activeSigner.address.toLowerCase();
    return allProposals.filter((p) => p.votes.some((v) => v.voterAddress.toLowerCase() === key));
  }, [activeSigner, allProposals]);

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
    <div className="flex flex-col gap-6 px-1 lg:px-10">
      <div className="flex flex-col">
        <div className="flex items-center py-2 text-xs text-gray-400">
          <Link href={base} className="px-1 hover:underline">
            Dashboard
          </Link>
          <ChevronRight size={10} className="text-gray-500" />
          <span className="px-1">Signers</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <h1 className="font-nohemi text-3xl font-normal text-gray-600 lg:text-4xl">Signers</h1>

          <PillButton asChild tone="soft" className="h-11 w-52">
            <Link href={`${base}/proposals`}>
              New Proposal
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full outline outline-1 -outline-offset-1 outline-indigo-900">
                <span className="flex size-4 items-center justify-center rounded-full bg-indigo-950 pt-px text-center font-nohemi text-[10px] font-medium leading-none text-white">
                  {pending.length}
                </span>
              </span>
            </Link>
          </PillButton>
        </div>
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

      <div className="flex min-h-[600px] flex-col overflow-hidden rounded-lg bg-white xl:h-[835px]">
        <div className="flex h-14 shrink-0 items-center gap-0 bg-neutral-50 p-4">
          <Stat
            label="Total Signers"
            value={String(signers.length)}
            icon="/icons/vuesax/linear/profile-tick.svg"
          />
          <Stat
            label="Active Signers"
            value={String(activeCount)}
            icon="/icons/vuesax/outline/verify.svg"
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <div className="flex shrink-0 flex-col items-stretch justify-between gap-3 py-4 sm:h-20 sm:flex-row sm:items-center">
            <div className="flex w-60 items-center rounded-lg bg-slate-50 p-1 outline outline-1 -outline-offset-1 outline-indigo-200">
              <ViewToggle
                active={view === "grid"}
                icon={<GridIcon />}
                label="Grid"
                onClick={() => setView("grid")}
              />
              <ViewToggle
                active={view === "table"}
                icon={<TableIcon />}
                label="Table"
                onClick={() => setView("table")}
              />
            </div>

            <div className="relative w-full sm:w-96">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search for signers"
                className="h-9 rounded-lg border-0 bg-slate-50 pl-9 text-xs outline outline-[0.3px] -outline-offset-[0.3px] outline-indigo-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              {signers.length === 0 ? "No signers yet." : "No signers match your search."}
            </div>
          ) : view === "table" ? (
            <div className="min-h-0 flex-1 overflow-auto pb-4">
              <table className="w-full min-w-[900px] table-fixed text-left">
                {/* Every column is the same width, so the headers sit at an even
                    pitch instead of tracking each label's length. */}
                <colgroup>
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                  <col className="w-1/6" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr className="border-y border-gray-100 bg-zinc-200">
                    <Th className="text-left font-semibold">#</Th>
                    <Th>SIGNER</Th>
                    <Th className="text-center">ROLE</Th>
                    <Th className="text-center">TOTAL VOTES</Th>
                    <Th className="text-center">PROPOSAL CREATED</Th>
                    <Th className="text-center">STATUS</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((signer, index) => (
                    <tr
                      key={signer.address}
                      onClick={() => setActiveSigner(signer)}
                      className="cursor-pointer border-b border-gray-100 first:bg-slate-50 first:border-indigo-50 hover:bg-surface-canvas"
                    >
                      <Td className="text-sm font-semibold text-gray-500">{index + 1}</Td>
                      <Td>
                        <SignerIdentity signer={signer} />
                      </Td>
                      <Td className="text-center text-base font-semibold capitalize leading-5 text-neutral-500">
                        {signer.role}
                      </Td>
                      <Td className="text-center text-base font-semibold leading-5 text-neutral-800">
                        {signer.totalVotes}
                      </Td>
                      <Td className="text-center text-base font-semibold leading-5 text-neutral-800">
                        {signer.proposalsCreated}
                      </Td>
                      <Td className="text-center">
                        <StatusBadge active={signer.isActive} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-start gap-2 overflow-auto px-1 pb-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRows.map((signer) => (
                <SignerCard
                  key={signer.address}
                  signer={signer}
                  onViewDetails={() => setActiveSigner(signer)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {activeSigner ? (
        <SignerDetailsPanel
          signer={activeSigner}
          createdProposals={signerProposals}
          activityProposals={signerActivity}
          onClose={() => setActiveSigner(null)}
        />
      ) : null}
    </div>
  );
}

/** Name over handle, which is what keeps the table's cells on one baseline. */
function SignerIdentity({ signer }: { signer: SignerRow }) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-0.5">
      <span className="truncate font-nohemi text-base font-medium text-indigo-800">
        {signer.name || "--"}
      </span>
      <span className="truncate text-xs text-gray-500">
        {signer.username ? `@${signer.username}` : shortAddress(signer.address)}
      </span>
    </div>
  );
}

function SignerCard({
  signer,
  onViewDetails,
}: {
  signer: SignerRow;
  onViewDetails: () => void;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-1 outline outline-[0.3px] -outline-offset-[0.3px] outline-indigo-300">
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-2 rounded-sm border-b-[0.5px] border-indigo-100 bg-white p-2">
          <div className="flex min-w-0 items-center gap-1">
            <div className="relative size-9 shrink-0 overflow-hidden rounded-full border-[1.5px] border-indigo-200">
              <Image
                src={signer.avatar || "/images/sample-signer.jpg"}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="truncate font-nohemi text-xl font-medium text-zinc-800">
                {signer.name || "--"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <span className="truncate">
                  {signer.username ? `@${signer.username}` : shortAddress(signer.address)}
                </span>
                <span className="size-1 shrink-0 rounded-full bg-gray-300" />
                <span className="shrink-0 capitalize">{signer.role}</span>
              </span>
            </div>
          </div>
          <span
            className={`flex shrink-0 items-center justify-center rounded-3xl px-3 py-1 text-xs font-medium outline outline-[0.5px] -outline-offset-[0.5px] ${
              signer.isActive
                ? "bg-green-50 text-lime-900 outline-lime-500"
                : "bg-gray-100 text-gray-600 outline-gray-300"
            }`}
          >
            {signer.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex items-center">
          <div className="flex flex-1 items-center justify-center gap-1 border-r border-indigo-100 p-2">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white outline outline-[0.3px] outline-lime-500">
              <VoteIcon />
            </span>
            <span className="font-nohemi text-xs text-gray-600">
              {signer.totalVotes} Total Vote{signer.totalVotes === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex flex-1 items-center gap-1 p-2">
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-yellow-50 outline outline-[0.3px] outline-amber-300">
              <ProposalIcon />
            </span>
            <span className="font-nohemi text-xs text-gray-600">
              {signer.proposalsCreated} Proposal{signer.proposalsCreated === 1 ? "" : "s"} Created
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="flex items-center justify-center gap-2 overflow-hidden border-t-[0.5px] border-indigo-100 px-2 py-4 text-sm font-medium text-indigo-700 transition-colors hover:text-indigo-900"
        >
          View details
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function VoteIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden className="size-3">
      <path
        d="M4.74 10.25V4.6c0-.22.065-.435.187-.617l1.52-2.26a.78.78 0 0 1 .7-.34c.52 0 .9.49.785.995l-.29 1.28a.5.5 0 0 0 .49.61h1.61c.77 0 1.325.645 1.15 1.35l-.69 2.82c-.12.49-.58.835-1.1.835H4.74Z"
        stroke="#65A30D"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2.69 10.25h2.05V4.34H2.69c-.54 0-.98.35-.98.78v4.35c0 .43.44.78.98.78Z"
        stroke="#65A30D"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProposalIcon() {
  return (
    <svg viewBox="0 0 10 10" fill="none" aria-hidden className="size-2.5">
      <path
        d="M5.52018 1.14583H6.56185C6.72761 1.14583 6.88658 1.21168 7.00379 1.32889C7.121 1.4461 7.18685 1.60507 7.18685 1.77083M5.43685 7.975L3.88685 8.19583L4.10768 6.66667L8.08685 2.69167C8.26457 2.52607 8.49963 2.43591 8.7425 2.4402C8.98538 2.44448 9.21711 2.54287 9.38888 2.71464C9.56064 2.88641 9.65903 3.11814 9.66332 3.36101C9.6676 3.60389 9.57745 3.83895 9.41185 4.01667L5.43685 7.975ZM2.29102 0.3125H5.20768C5.20768 0.3125 5.52018 0.3125 5.52018 0.625V1.66667C5.52018 1.66667 5.52018 1.97917 5.20768 1.97917H2.29102C2.29102 1.97917 1.97852 1.97917 1.97852 1.66667V0.625C1.97852 0.625 1.97852 0.3125 2.29102 0.3125Z"
        stroke="#DEA045"
        strokeWidth="0.833333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.1875 7.81217V9.06217C7.1875 9.22794 7.12165 9.38691 7.00444 9.50412C6.88723 9.62133 6.72826 9.68717 6.5625 9.68717H0.9375C0.77174 9.68717 0.612769 9.62133 0.495558 9.50412C0.378348 9.38691 0.3125 9.22794 0.3125 9.06217V1.77051C0.3125 1.60475 0.378348 1.44578 0.495558 1.32857C0.612769 1.21136 0.77174 1.14551 0.9375 1.14551H1.97917M2.1875 3.64551H5.10417M2.1875 5.52051H3.22917"
        stroke="#DEA045"
        strokeWidth="0.833333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Inline rather than next/image, so the mark takes the tab's own colour. */
function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path
        d="M14.6667 5.513V2.82c0-1.06-.427-1.487-1.487-1.487h-2.693c-1.06 0-1.487.427-1.487 1.487v2.693c0 1.06.427 1.487 1.487 1.487h2.693c1.06 0 1.487-.427 1.487-1.487ZM7 5.68V2.653c0-.94-.427-1.32-1.487-1.32H2.82c-1.06 0-1.487.38-1.487 1.32v3.02c0 .947.427 1.32 1.487 1.32h2.693c1.06.007 1.487-.373 1.487-1.313ZM7 13.18v-2.693c0-1.06-.427-1.487-1.487-1.487H2.82c-1.06 0-1.487.427-1.487 1.487v2.693c0 1.06.427 1.487 1.487 1.487h2.693c1.06 0 1.487-.427 1.487-1.487Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.333h4M10 13h4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-4">
      <path
        d="M13.266 7.5H2.733c-1.28 0-1.9-.654-1.9-1.987V2.82c0-1.34.62-1.987 1.9-1.987h10.533c1.28 0 1.9.653 1.9 1.987v2.693c0 1.333-.62 1.987-1.9 1.987ZM2.733 1.833c-.673 0-.9.14-.9.987v2.693c0 .847.227.987.9.987h10.533c.674 0 .9-.14.9-.987V2.82c0-.847-.226-.987-.9-.987H2.733Z"
        fill="currentColor"
      />
      <path
        d="M13.266 15.166H2.733c-1.28 0-1.9-.653-1.9-1.987v-2.693c0-1.34.62-1.987 1.9-1.987h10.533c1.28 0 1.9.653 1.9 1.987v2.693c0 1.334-.62 1.987-1.9 1.987ZM2.733 9.5c-.673 0-.9.14-.9.987v2.693c0 .846.227.986.9.986h10.533c.674 0 .9-.14.9-.986v-2.693c0-.847-.226-.987-.9-.987H2.733Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ViewToggle({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 px-6 py-2 text-base transition-colors ${
        active
          ? "rounded-sm bg-[#4F51D9] font-medium text-white outline outline-2 outline-[#A8ACF2] shadow-[0px_2px_9px_-1.5px_rgba(13,15,74,0.25),inset_0px_-6px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_-2px_1px_0.5px_rgba(13,15,74,0.60),inset_0px_11px_8px_-3.5px_rgba(13,15,74,0.60),inset_0px_3px_1px_0px_rgba(13,15,74,0.22)]"
          : "rounded-full text-gray-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex w-24 items-center justify-center whitespace-nowrap rounded-3xl px-3 py-1.5 text-sm font-medium outline outline-[0.5px] -outline-offset-[0.5px] ${
        active
          ? "bg-green-50 text-lime-900 outline-lime-500"
          : "bg-gray-100 text-gray-600 outline-gray-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** The activity table states status as coloured text, not as a pill. */
const activityStatusColor: Record<ProposalStatus, string> = {
  open: "text-yellow-600",
  passed: "text-lime-700",
  rejected: "text-red-600",
  expired: "text-gray-500",
  cancelled: "text-gray-500",
};

function ActivityTh({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={`p-2 text-xs font-normal tracking-wide text-zinc-800 ${className}`}>
      {children}
    </th>
  );
}

function SignerDetailsPanel({
  signer,
  createdProposals,
  activityProposals,
  onClose,
}: {
  signer: SignerRow;
  createdProposals: Proposal[];
  activityProposals: Proposal[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const orgSlug = useOrgSlug();
  const base = orgSlug ? `/org/${orgSlug}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(signer.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-[700px] flex-col overflow-y-auto bg-white">
        <div className="flex items-center justify-between gap-2 p-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Back"
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="font-nohemi text-lg text-neutral-800">Signer Details</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-6 items-center justify-center rounded-full text-gray-400 outline outline-1 -outline-offset-1 outline-gray-300 transition-colors hover:text-gray-600"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex min-w-0 flex-col gap-4 px-6 pb-6">
          <div className="rounded-lg bg-slate-50 p-1 outline outline-[0.3px] -outline-offset-[0.3px] outline-indigo-300">
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-2 rounded-sm border-b-[0.5px] border-indigo-100 bg-white p-2">
                <div className="flex min-w-0 items-center gap-1">
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-full border-[1.5px] border-indigo-200">
                    <Image
                      src={signer.avatar || "/images/sample-signer.jpg"}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col items-start gap-1">
                    <span className="truncate font-nohemi text-xl font-medium text-zinc-800">
                      {signer.name || "--"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      <span className="truncate">
                        {signer.username ? `@${signer.username}` : shortAddress(signer.address)}
                      </span>
                      <span className="size-1 shrink-0 rounded-full bg-gray-300" />
                      <span className="shrink-0 capitalize">{signer.role}</span>
                    </span>
                  </div>
                </div>
                <StatusBadge active={signer.isActive} />
              </div>

              <div className="flex items-center gap-2 bg-white px-2 py-2">
                <span className="font-nohemi text-sm text-zinc-800">
                  {shortAddress(signer.address)}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy wallet address"
                  className="text-gray-400 transition-colors hover:text-indigo-700"
                >
                  <Copy size={12} />
                </button>
                {copied ? <span className="text-[10px] text-lime-700">Copied</span> : null}
              </div>

              <div className="flex items-center border-t-[0.5px] border-indigo-100">
                <div className="flex flex-1 items-center justify-center gap-1 border-r border-indigo-100 p-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white outline outline-[0.3px] outline-lime-500">
                    <VoteIcon />
                  </span>
                  <span className="font-nohemi text-xs text-gray-600">
                    {signer.totalVotes} Total Vote{signer.totalVotes === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-1 p-2">
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-yellow-50 outline outline-[0.3px] outline-amber-300">
                    <ProposalIcon />
                  </span>
                  <span className="font-nohemi text-xs text-gray-600">
                    {signer.proposalsCreated} Proposal
                    {signer.proposalsCreated === 1 ? "" : "s"} Created
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-6 overflow-hidden rounded-lg bg-slate-50 px-2 pb-2 pt-4 outline outline-[0.3px] -outline-offset-[0.3px] outline-indigo-300">
            <h3 className="px-2 font-nohemi text-base text-zinc-700">Proposals Created</h3>
            {createdProposals.length === 0 ? (
              <p className="px-2 pb-2 text-xs text-gray-500">
                This signer has not created any proposals.
              </p>
            ) : (
              // Scrolls sideways: the panel is narrow and these are cards, not rows.
              <div className="flex gap-3 overflow-x-auto pb-2">
                {createdProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="w-80 shrink-0 rounded-lg bg-slate-50 p-1 outline outline-[0.3px] -outline-offset-[0.3px] outline-indigo-300"
                  >
                    <div className="flex flex-col items-end gap-2 overflow-hidden rounded-sm bg-white p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-gray-100">
                      <span
                        className={`rounded-3xl px-2 py-1 text-[10px] font-medium ${statusClasses[proposal.status]}`}
                      >
                        {statusLabel[proposal.status]}
                      </span>

                      <div className="flex w-full flex-col gap-5">
                        <div className="flex flex-col gap-2">
                          <p className="font-nohemi text-2xl font-semibold text-zinc-800">
                            {proposal.title}
                          </p>
                          {proposal.description ? (
                            <p className="line-clamp-3 text-xs text-gray-500">
                              {proposal.description}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <span className="font-nohemi text-[10px] text-gray-500">
                              Created :{" "}
                              <span className="text-indigo-900">
                                {formatDate(proposal.createdAt)}
                              </span>
                            </span>
                            <span className="size-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1">
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-white outline outline-[0.3px] outline-lime-500">
                                <VoteIcon />
                              </span>
                              <span className="font-nohemi text-xs text-lime-900">
                                {proposal.votesFor + proposal.votesAgainst} votes
                              </span>
                            </span>
                          </span>
                          <Link
                            href={`${base}/proposals/${proposal.id}`}
                            className="flex shrink-0 items-center gap-2 text-sm font-medium text-indigo-700 hover:text-indigo-900"
                          >
                            View details
                            <ArrowRight size={16} strokeWidth={1.5} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 overflow-hidden rounded-lg bg-slate-50 py-2 outline outline-1 -outline-offset-1 outline-neutral-50">
            <h3 className="px-2 font-nohemi text-base text-zinc-700">Proposal Activity</h3>
            {activityProposals.length === 0 ? (
              <p className="px-2 pb-2 text-xs text-gray-500">
                This signer has not voted on any proposals.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[27%]" />
                    <col className="w-[17%]" />
                    <col className="w-[20%]" />
                    <col className="w-[20%]" />
                    <col className="w-[16%]" />
                  </colgroup>
                  <thead>
                    <tr className="h-14 border-y border-indigo-50 bg-zinc-200">
                      <ActivityTh className="text-left">PROPOSAL</ActivityTh>
                      <ActivityTh className="text-center">STATUS</ActivityTh>
                      <ActivityTh className="text-center">CREATED</ActivityTh>
                      <th className="px-2 py-1.5">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs tracking-wide text-zinc-800">VOTES</span>
                          <div className="flex">
                            <span className="border-r-[0.3px] border-gray-500 px-2 text-[8px] font-medium tracking-wide text-gray-600">
                              FOR
                            </span>
                            <span className="px-2 text-[8px] font-medium tracking-wide text-gray-600">
                              AGAINST
                            </span>
                          </div>
                        </div>
                      </th>
                      <ActivityTh className="whitespace-nowrap pr-3 text-center">
                        SIGNER&apos;S VOTE
                      </ActivityTh>
                    </tr>
                  </thead>
                  <tbody>
                    {activityProposals.map((proposal) => {
                      const vote = proposal.votes.find(
                        (v) => v.voterAddress.toLowerCase() === signer.address.toLowerCase()
                      );
                      return (
                        <tr key={proposal.id} className="h-12 border-b border-gray-50">
                          <td className="p-2 text-xs font-medium leading-3 text-gray-600">
                            {proposal.title}
                          </td>
                          <td
                            className={`p-2 text-center text-xs font-medium leading-3 ${activityStatusColor[proposal.status]}`}
                          >
                            {statusLabel[proposal.status]}
                          </td>
                          <td className="whitespace-nowrap p-2 text-center text-xs font-medium leading-3 text-gray-600">
                            {formatDate(proposal.createdAt)}
                          </td>
                          <td className="p-2">
                            <div className="flex justify-center">
                              <span className="border-r-[0.3px] border-gray-500 px-2 font-nohemi text-[10px] font-medium text-gray-600">
                                {proposal.votesFor}
                              </span>
                              <span className="px-2 font-nohemi text-[10px] font-medium text-gray-600">
                                {proposal.votesAgainst}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center text-xs font-medium capitalize leading-3 text-gray-600">
                            {vote?.choice ?? "--"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <span className="flex items-start gap-2 border-r border-gray-300 pl-2 pr-6 last:border-r-0">
      <span className="flex size-6 shrink-0 items-center justify-center bg-white outline outline-[0.75px] -outline-offset-[0.75px] outline-indigo-50">
        <Image src={icon} alt="" width={14} height={14} className="size-3.5" />
      </span>
      <span className="flex items-center gap-1">
        <span className="font-nohemi text-[10px] text-gray-500">{label} :</span>
        <span className="font-bricolage text-xl font-bold text-[#1D1E49]">{value}</span>
      </span>
    </span>
  );
}

function Th({
  children,
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={`truncate p-2 text-sm font-normal tracking-wide text-zinc-800 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-2 py-4 ${className}`}>{children}</td>;
}
