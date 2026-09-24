"use client"

import { activeChain } from "@/constants/chain";
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PillButton } from "@/components/ui/pill-button"
import { BatchPaymentCreationModal } from "@/components/payments/batch-payment-creation-modal"
import {
  useOrganizationBySlug,
  useOrganizationBatches,
  mapApiBatchToPaymentBatch,
  recordBatchApproval,
  recordBatchApprovalRevocation,
  recordBatchExecution,
  recordBatchCancellation,
} from "@/lib/api/organization"
import useOrgSlug from "@/hooks/useOrgSlug"
import { useActiveAccount } from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { thirdwebClient } from "@/app/client"
import { useToken } from "@/hooks/useToken"
import { useSponsoredTransaction } from "@/hooks/useSponsoredTransaction"
import useGetOrgTreasuryBalance from "@/hooks/ERC20/useGetOrgTreasuryBalance"

type SortKey = "date" | "amount" | "name"

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Amount (High to Low)" },
  { value: "name", label: "Batch Name" },
]

const shortHash = (value: string) =>
  value && value.length >= 12 ? `${value.slice(0, 8)}...` : value || "--"

export default function PaymentsPage() {
  const { symbol } = useToken()
  const [searchTerm, setSearchTerm] = useState("")
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [actionLoadingBatch, setActionLoadingBatch] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>("date")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  const orgSlug = useOrgSlug()
  const base = orgSlug ? `/org/${orgSlug}` : "/"
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const { data: batchesData, loading: batchesLoading, error, refresh } = useOrganizationBatches(
    organization?.id || null
  )

  const treasuryBalance = useGetOrgTreasuryBalance()

  const account = useActiveAccount()
  const { send, canSign } = useSponsoredTransaction()

  const accountAddressLower = (account?.address || "").toLowerCase()

  const isBatchTerminal = (statusRaw?: string) =>
    statusRaw === "executed" || statusRaw === "cancelled" || statusRaw === "expired"

  const hasSignedApproval = (approvalSignerAddresses: string[]) =>
    approvalSignerAddresses.some((a) => a.toLowerCase() === accountAddressLower)

  const isSignerOrAdmin = useMemo(() => {
    const addr = account?.address
    if (!addr) return false
    return (organization?.signers || []).some(
      (s) => s.address?.toLowerCase() === addr.toLowerCase() && s.isActive
    )
  }, [account?.address, organization?.signers])

  const currentSignerName = useMemo(() => {
    const addr = account?.address
    if (!addr) return "Signer"
    const signer = (organization?.signers || []).find(
      (s) => s.address?.toLowerCase() === addr.toLowerCase()
    )
    return (signer?.name || "Signer").trim() || "Signer"
  }, [account?.address, organization?.signers])

  const paymentBatches = useMemo(
    () => (batchesData?.batches ?? []).map(mapApiBatchToPaymentBatch),
    [batchesData]
  )
  const totalBatches = batchesData?.totalBatches ?? 0

  const lastPayrollAmount = useMemo(() => {
    const executed = paymentBatches.filter((b) => b.statusRaw === "executed")
    if (executed.length === 0) return null
    return executed.reduce((latest, b) => (b.date > latest.date ? b : latest), executed[0])
      .totalAmount
  }, [paymentBatches])

  const pendingApprovalCount = batchesData?.stats?.pending ?? 0

  const handlePaymentCreated = () => {
    refresh()
    setShowBatchModal(false)
  }

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const rows = paymentBatches.filter((b) => b.batchName.toLowerCase().includes(term))

    const sorted = [...rows]
    if (sortBy === "amount") sorted.sort((a, b) => b.totalAmount - a.totalAmount)
    else if (sortBy === "name") sorted.sort((a, b) => a.batchName.localeCompare(b.batchName))
    else sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return sorted
  }, [paymentBatches, searchTerm, sortBy])

  useEffect(() => {
    setPage(1)
  }, [organization?.id, searchTerm, sortBy, limit])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * limit
  const paginated = filtered.slice(startIndex, startIndex + limit)

  const handleApproveBatch = async (batchName: string) => {
    if (actionLoadingBatch) return
    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Still getting your account ready, try again in a moment")
        return
      }
      if (!organization?.id || !organization.contractAddress) {
        toast.error("Missing organization details")
        return
      }
      if (!isSignerOrAdmin) {
        toast.error("Only signers can approve batches")
        return
      }

      const contract = getContract({
        client: thirdwebClient,
        address: organization.contractAddress,
        chain: activeChain,
      })
      const tx = prepareContractCall({
        contract,
        method: "function approveBatch(string batchName)",
        params: [batchName],
      })

      await send(tx)
      await recordBatchApproval(batchName, {
        signerAddress: account.address,
        signerName: currentSignerName,
      })

      refresh()
      toast.success("Batch approved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to approve batch")
    } finally {
      setActionLoadingBatch(null)
    }
  }

  const handleExecuteBatch = async (batchName: string) => {
    if (actionLoadingBatch) return
    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Still getting your account ready, try again in a moment")
        return
      }
      if (!organization?.contractAddress) {
        toast.error("Missing organization contract address")
        return
      }
      if (!isSignerOrAdmin) {
        toast.error("Only signers can execute batches")
        return
      }

      const contract = getContract({
        client: thirdwebClient,
        address: organization.contractAddress,
        chain: activeChain,
      })
      const tx = prepareContractCall({
        contract,
        method: "function executeBatchPayroll(string batchName)",
        params: [batchName],
      })

      const { transactionHash } = await send(tx)
      await recordBatchExecution(batchName, {
        executorAddress: account.address,
        txHash: transactionHash,
      })

      refresh()
      toast.success("Batch executed")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to execute batch")
    } finally {
      setActionLoadingBatch(null)
    }
  }

  const handleRevokeApproval = async (batchName: string) => {
    if (actionLoadingBatch) return
    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Still getting your account ready, try again in a moment")
        return
      }
      if (!organization?.contractAddress) {
        toast.error("Missing organization contract address")
        return
      }
      if (!isSignerOrAdmin) {
        toast.error("Only signers can revoke approvals")
        return
      }

      const contract = getContract({
        client: thirdwebClient,
        address: organization.contractAddress,
        chain: activeChain,
      })
      const tx = prepareContractCall({
        contract,
        method: "function revokeBatchApproval(string batchName)",
        params: [batchName],
      })

      await send(tx)
      await recordBatchApprovalRevocation(batchName, { signerAddress: account.address })

      refresh()
      toast.success("Approval revoked")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to revoke approval")
    } finally {
      setActionLoadingBatch(null)
    }
  }

  const handleCancelBatch = async (batchName: string) => {
    if (actionLoadingBatch) return
    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Still getting your account ready, try again in a moment")
        return
      }
      if (!organization?.contractAddress) {
        toast.error("Missing organization contract address")
        return
      }
      if (!isSignerOrAdmin) {
        toast.error("Only signers can cancel batches")
        return
      }

      const contract = getContract({
        client: thirdwebClient,
        address: organization.contractAddress,
        chain: activeChain,
      })
      const tx = prepareContractCall({
        contract,
        method: "function cancelBatch(string batchName)",
        params: [batchName],
      })

      await send(tx)
      await recordBatchCancellation(batchName)

      refresh()
      toast.success("Batch cancelled")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel batch")
    } finally {
      setActionLoadingBatch(null)
    }
  }

  if (error) {
    return (
      <div className="px-1 lg:px-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Failed to load payment batches: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-1 lg:px-10">
      <div className="flex flex-col">
        <div className="flex items-center py-2 text-xs text-gray-400">
          <Link href={base} className="px-1 hover:underline">
            Dashboard
          </Link>
          <ChevronRight size={10} className="text-gray-500" />
          <Link href={`${base}/employees`} className="px-1 hover:underline">
            Employees
          </Link>
          <ChevronRight size={10} className="text-gray-500" />
          <span className="px-1">Payroll</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <h1 className="font-nohemi text-3xl font-normal text-gray-600 lg:text-4xl">Payroll</h1>
          <PillButton tone="primary" className="h-11" onClick={() => setShowBatchModal(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 8h8M8 4v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Create Batch Payment
          </PillButton>
        </div>
      </div>

      <div className="min-h-[600px] overflow-hidden rounded-lg bg-white xl:h-[835px]">
        <div className="flex h-14 shrink-0 items-center bg-neutral-50 p-4">
          <Stat
            label="Total Payroll"
            unit={symbol}
            value={totalBatches === 0 ? "--" : filtered.reduce((s, b) => s + b.totalAmount, 0).toLocaleString()}
            icon="/icons/vuesax/outline/convert-card.svg"
          />
          <Stat
            label="Last Payroll"
            unit={symbol}
            value={lastPayrollAmount === null ? "--" : lastPayrollAmount.toLocaleString()}
            icon="/icons/vuesax/broken/money-tick.svg"
          />
          <Stat
            label="Pending Approval"
            value={String(pendingApprovalCount)}
            icon="/icons/vuesax/linear/user-minus.svg"
          />
          <div className="ml-auto">
            <Stat
              label="Available Balance"
              unit={symbol}
              value={
                treasuryBalance === null
                  ? "--"
                  : treasuryBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })
              }
              icon="/icons/document-text.svg"
              noBorder
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex h-9 w-full max-w-xs items-center overflow-hidden rounded-full pl-4 outline outline-[0.3px] -outline-offset-[0.3px] outline-neutral-300">
              <Input
                placeholder="Search batches"
                className="h-9 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="flex h-9 items-center bg-indigo-50 px-4 outline outline-[0.3px] -outline-offset-[0.3px] outline-neutral-100">
                <Image src="/icons/vuesax/linear/search-normal.svg" alt="" width={16} height={16} className="size-4" />
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-2 text-neutral-600">
                <Image src="/icons/vuesax/linear/sort.svg" alt="" width={16} height={16} className="size-4" />
                <span>Filters :</span>
                <span className="text-sm font-medium text-neutral-800">Recent Batches</span>
                <ChevronDown size={14} className="text-neutral-400" />
              </div>

              <div className="relative" ref={sortRef}>
                <button
                  type="button"
                  onClick={() => setShowSortDropdown((v) => !v)}
                  className="flex items-center gap-1 rounded-lg bg-slate-50 p-2 text-neutral-600"
                >
                  <Image src="/icons/vuesax/linear/setting-4.svg" alt="" width={16} height={16} className="size-4" />
                  <span>Sort :</span>
                  <span className="text-sm font-medium text-neutral-800">
                    {sortOptions.find((o) => o.value === sortBy)?.label ?? "Date"}
                  </span>
                  <ChevronDown size={14} className="text-neutral-400" />
                </button>

                {showSortDropdown ? (
                  <div className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value)
                          setShowSortDropdown(false)
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#EEF0FC] ${
                          sortBy === option.value ? "bg-[#EEF0FC] text-[#4F51D9]" : "text-neutral-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] table-fixed text-left">
              <colgroup>
                <col className="w-[3%]" />
                <col className="w-[12%]" />
                <col className="w-[20%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="h-14 border-y border-gray-100 bg-neutral-100">
                  <Th className="font-semibold text-gray-800">#</Th>
                  <Th>TNX HASH</Th>
                  <Th className="text-center">BATCH NAME</Th>
                  <Th className="text-center">INITIATED BY</Th>
                  <Th className="text-center">
                    AMOUNT <span className="font-bold">({symbol || "--"})</span>
                  </Th>
                  <Th className="text-center">TYPE</Th>
                  <Th className="text-center">RECIPIENTS</Th>
                  <Th className="text-center">STATUS</Th>
                  <Th className="text-center">DATE</Th>
                </tr>
              </thead>
              <tbody>
                {batchesLoading ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center">
                      <Loader2 className="mx-auto size-6 animate-spin text-[#4F51D9]" />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-sm text-gray-500">
                      No payment batches yet. Create your first batch to get started.
                    </td>
                  </tr>
                ) : (
                  paginated.map((batch, index) => {
                    return (
                      <tr key={batch.id} className="border-b border-gray-100 hover:bg-surface-canvas">
                        <Td className="text-sm font-semibold text-gray-500">{startIndex + index + 1}</Td>
                        <Td>
                          {batch.txHash ? (
                            <a
                              href={`https://sepolia.basescan.org/tx/${batch.txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="truncate font-semibold text-neutral-500 hover:text-indigo-600"
                            >
                              {shortHash(batch.txHash)}
                            </a>
                          ) : (
                            <span className="truncate font-semibold text-neutral-500">--</span>
                          )}
                        </Td>
                        <Td className="text-center font-semibold text-neutral-500">{batch.batchName}</Td>
                        <Td className="text-center font-semibold text-neutral-500">
                          {(batch.creatorJobRole || "").trim() ||
                            `${batch.creatorAddress.slice(0, 6)}...${batch.creatorAddress.slice(-4)}`}
                        </Td>
                        <Td className="text-center font-semibold text-neutral-800">
                          {batch.totalAmount.toLocaleString()}
                        </Td>
                        <Td className="text-center font-semibold text-neutral-500">Outflow</Td>
                        <Td className="text-center font-semibold text-neutral-500">{batch.employees}</Td>
                        <Td className="text-center">
                          <StatusPill status={batch.status} />
                        </Td>
                        <Td>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-center text-xs font-semibold text-neutral-800">
                              {batch.date}
                            </span>
                          </div>
                        </Td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!batchesLoading && paginated.some((b) => isSignerOrAdmin && !isBatchTerminal(b.statusRaw)) ? (
            <div className="flex flex-col gap-2">
              {paginated
                .filter((b) => isSignerOrAdmin && !isBatchTerminal(b.statusRaw))
                .map((batch) => {
                  const userHasApproved = hasSignedApproval(batch.approvalSignerAddresses)
                  const isActionLoading = actionLoadingBatch !== null
                  const isBusy = actionLoadingBatch === batch.batchName

                  return (
                    <div
                      key={`${batch.id}-actions`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 px-4 py-3 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-100"
                    >
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-800">{batch.batchName}</span>
                        <span>
                          {batch.approvalCount}/{batch.quorumRequired} approvals
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {userHasApproved ? (
                          <PillButton
                            tone="soft"
                            size="sm"
                            disabled={isActionLoading || !canSign}
                            title={canSign ? undefined : "Still getting your account ready"}
                            onClick={() => void handleRevokeApproval(batch.batchName)}
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                            Revoke
                          </PillButton>
                        ) : (
                          <PillButton
                            tone="soft"
                            size="sm"
                            disabled={isActionLoading || !canSign}
                            title={canSign ? undefined : "Still getting your account ready"}
                            onClick={() => void handleApproveBatch(batch.batchName)}
                          >
                            {isBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                            Approve
                          </PillButton>
                        )}
                        <PillButton
                          tone="primary"
                          size="sm"
                          disabled={isActionLoading || batch.approvalCount < batch.quorumRequired || !canSign}
                          title={canSign ? undefined : "Still getting your account ready"}
                          onClick={() => void handleExecuteBatch(batch.batchName)}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                          Execute
                        </PillButton>
                        <PillButton
                          tone="soft"
                          size="sm"
                          disabled={isActionLoading || !canSign}
                          title={canSign ? undefined : "Still getting your account ready"}
                          onClick={() => void handleCancelBatch(batch.batchName)}
                        >
                          {isBusy ? <Loader2 size={14} className="animate-spin" /> : null}
                          Cancel
                        </PillButton>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : null}

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <span className="text-sm text-gray-600">
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1 || batchesLoading}
                className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={safePage >= totalPages || batchesLoading}
                className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showBatchModal && (
        <BatchPaymentCreationModal
          organizationId={organization?.id}
          organizationAddress={organization?.contractAddress}
          onClose={() => setShowBatchModal(false)}
          onPaymentCreated={handlePaymentCreated}
        />
      )}
    </div>
  )
}

function Stat({
  label,
  unit,
  value,
  icon,
  noBorder = false,
}: {
  label: string
  unit?: string
  value: string
  icon: string
  noBorder?: boolean
}) {
  return (
    <span
      className={`flex items-start gap-2 pl-2 pr-6 ${noBorder ? "" : "border-r border-gray-300"}`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center bg-white outline outline-[0.75px] -outline-offset-[0.75px] outline-indigo-50">
        <Image src={icon} alt="" width={14} height={14} className="size-3.5" />
      </span>
      <span className="flex items-center gap-1">
        <span className="font-nohemi text-[10px] text-gray-500">
          {label}
          {unit ? ` (${unit})` : ""} :
        </span>
        <span className="font-bricolage text-xl font-bold text-[#1D1E49]">{value}</span>
      </span>
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const classes =
    normalized === "executed" || normalized === "completed"
      ? "bg-green-50 text-lime-700"
      : normalized === "pending"
        ? "bg-amber-50 text-yellow-600"
        : normalized === "cancelled" || normalized === "expired" || normalized === "failed"
          ? "bg-pink-100 text-red-600"
          : "bg-blue-50 text-blue-700"

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium leading-3 ${classes}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`truncate px-1.5 py-3 text-[11px] font-normal tracking-tight text-neutral-600 ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-1.5 py-4 text-xs leading-4 ${className}`}>{children}</td>
}
