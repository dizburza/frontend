"use client"

import { useEffect, useMemo, useState } from "react"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, Search, MoreVertical } from "lucide-react"
import { BatchPaymentCreationModal } from "@/components/payments/batch-payment-creation-modal"
import { 
  useOrganizationBySlug, 
  useOrganizationBatches,
  useTransactionHistory,
  mapApiBatchToPaymentBatch,
  recordBatchApproval,
  recordBatchApprovalRevocation,
  recordBatchExecution,
  recordBatchCancellation 
} from "@/lib/api/organization"
import useOrgSlug from "@/hooks/useOrgSlug"
import { toast } from "sonner"
import { useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { baseSepolia } from "thirdweb/chains"
import { thirdwebClient } from "@/app/client"

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [actionLoadingBatch, setActionLoadingBatch] = useState<string | null>(null)
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)

  const getPageItems = (currentPage: number, total: number) => {
    const safeTotalPages = Math.max(1, total)
    const safeCurrent = Math.min(Math.max(1, currentPage), safeTotalPages)
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1)
    }
    const items: Array<number | "..."> = [1]
    const start = Math.max(2, safeCurrent - 1)
    const end = Math.min(safeTotalPages - 1, safeCurrent + 1)

    if (start > 2) items.push("...")
    for (let p = start; p <= end; p++) items.push(p)
    if (end < safeTotalPages - 1) items.push("...")
    items.push(safeTotalPages)

    return items
  }

  const orgSlug = useOrgSlug()
  const { data: organization } = useOrganizationBySlug(orgSlug)
  const { data: batchesData, loading: batchesLoading, error, refresh } = useOrganizationBatches(organization?._id || null)
  const { data: transactionsData } = useTransactionHistory(
    organization?.contractAddress || null,
    { limit: 200 }
  )

  const account = useActiveAccount()
  const { mutateAsync: sendAndConfirmTx } = useSendAndConfirmTransaction()

  const accountAddressLower = (account?.address || "").toLowerCase()

  const isBatchTerminal = (statusRaw?: string) =>
    statusRaw === "executed" || statusRaw === "cancelled" || statusRaw === "expired"

  const hasSignedApproval = (approvalSignerAddresses: string[]) =>
    approvalSignerAddresses.some((a) => a.toLowerCase() === accountAddressLower)

  const isSignerOrAdmin = useMemo(() => {
    const addr = account?.address
    if (!addr) return false
    const userIsSigner = (organization?.signers || []).some(
      (s) => s.address?.toLowerCase() === addr.toLowerCase() && s.isActive
    )
    return userIsSigner
  }, [account?.address, organization?.signers])

  const currentSignerName = useMemo(() => {
    const addr = account?.address
    if (!addr) return "Signer"
    const signer = (organization?.signers || []).find(
      (s) => s.address?.toLowerCase() === addr.toLowerCase()
    )
    return (signer?.name || "Signer").trim() || "Signer"
  }, [account?.address, organization?.signers])

  const paymentBatches = batchesData?.batches?.map(mapApiBatchToPaymentBatch) || []
  const stats = batchesData?.stats || { pending: 0, approved: 0, executed: 0, cancelled: 0 }
  const totalBatches = batchesData?.totalBatches || 0

  const transactions = transactionsData?.transactions ?? []

  const outflow = transactions
    .filter((t) => t.direction === "sent")
    .reduce((acc, t) => {
      const amt = Number.parseFloat(String(t.displayAmount || "0").replaceAll("-", ""))
      return acc + (Number.isFinite(amt) ? amt : 0)
    }, 0)

  const inflow = transactions
    .filter((t) => t.direction === "received")
    .reduce((acc, t) => {
      const amt = Number.parseFloat(String(t.displayAmount || "0").replaceAll("+", ""))
      return acc + (Number.isFinite(amt) ? amt : 0)
    }, 0)

  const handlePaymentCreated = () => {
    refresh()
    setShowBatchModal(false)
  }

  // Format amount for display
  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(3)}M`
    }
    return amount.toLocaleString()
  }

  let totalBatchesUpdatedText = "--"
  const latestBatchUpdatedAt = batchesData?.batches?.[0]?.updatedAt
  if (batchesLoading) {
    totalBatchesUpdatedText = "updating ..."
  } else if (latestBatchUpdatedAt) {
    totalBatchesUpdatedText = new Date(latestBatchUpdatedAt).toLocaleString()
  }

  const filteredBatches = paymentBatches.filter(batch =>
    batch.batchName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    setPage(1)
  }, [organization?._id, searchTerm, limit])

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * limit
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + limit)
  const pageItems = getPageItems(safePage, totalPages)

  if (error) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load payment batches: {error}</p>
          <Button onClick={refresh} className="mt-2" variant="outline">Try Again</Button>
        </div>
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === "executed") return "bg-green-100 text-green-700";
    if (normalizedStatus === "pending") return "bg-yellow-100 text-yellow-700";
    if (normalizedStatus === "approved") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const toShortAddress = (value: string) => {
    if (!value) return "--"
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const toggleBatchExpanded = (batchId: string) => {
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId))
  }

  const handleApproveBatch = async (batchName: string) => {
    if (actionLoadingBatch) return

    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Connect your wallet to continue")
        return
      }

      if (!organization?._id || !organization.contractAddress) {
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
        chain: baseSepolia,
      })

      const tx = prepareContractCall({
        contract,
        method: "function approveBatch(string batchName)",
        params: [batchName],
      })

      await sendAndConfirmTx(tx)

      await recordBatchApproval(batchName, {
        signerAddress: account.address,
        signerName: currentSignerName,
      })

      refresh()
      toast.success("Batch approved")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to approve batch"
      toast.error(msg)
    } finally {
      setActionLoadingBatch(null)
    }
  }

  const handleExecuteBatch = async (batchName: string) => {
    if (actionLoadingBatch) return

    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Connect your wallet to continue")
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
        chain: baseSepolia,
      })

      const tx = prepareContractCall({
        contract,
        method: "function executeBatchPayroll(string batchName)",
        params: [batchName],
      })

      const receipt = await sendAndConfirmTx(tx)

      await recordBatchExecution(batchName, {
        executorAddress: account.address,
        txHash: receipt.transactionHash,
      })

      refresh()
      toast.success("Batch executed")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to execute batch"
      toast.error(msg)
    } finally {
      setActionLoadingBatch(null)
    }
  }

  const handleRevokeApproval = async (batchName: string) => {
    if (actionLoadingBatch) return

    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Connect your wallet to continue")
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
        chain: baseSepolia,
      })

      const tx = prepareContractCall({
        contract,
        method: "function revokeBatchApproval(string batchName)",
        params: [batchName],
      })

      await sendAndConfirmTx(tx)

      await recordBatchApprovalRevocation(batchName, {
        signerAddress: account.address,
      })

      refresh()
      toast.success("Approval revoked")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to revoke approval"
      toast.error(msg)
    } finally {
      setActionLoadingBatch(null)
    }
  }

  const handleCancelBatch = async (batchName: string) => {
    if (actionLoadingBatch) return

    try {
      setActionLoadingBatch(batchName)

      if (!account?.address) {
        toast.error("Connect your wallet to continue")
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
        chain: baseSepolia,
      })

      const tx = prepareContractCall({
        contract,
        method: "function cancelBatch(string batchName)",
        params: [batchName],
      })

      await sendAndConfirmTx(tx)

      await recordBatchCancellation(batchName)
      refresh()
      toast.success("Batch cancelled")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to cancel batch"
      toast.error(msg)
    } finally {
      setActionLoadingBatch(null)
    }
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Dashboard</span>
        <span className="mx-2">›</span>
        <span>Treasury Payments</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Treasury Payments</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-700">Org Treasury</span>
            <span>Address:</span>
            <span className="font-mono text-gray-800">
              {organization?.contractAddress ? toShortAddress(organization.contractAddress) : "--"}
            </span>
          </div>
        </div>
        <Button onClick={() => setShowBatchModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          + Create New Batch
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Batches"
          value={totalBatches.toString()}
          lastUpdated={totalBatchesUpdatedText}
        />
        <StatCard label="Pending Approval" value={stats.pending.toString()} />
        <StatCard
          label="Outflow (cNGN)"
          value={outflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        />
        <StatCard
          label="Inflow (cNGN)"
          value={inflow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        />
      </div>

      {/* Payment Batches Table */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Payment Batches</h2>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <Input
              placeholder="Search batches"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 bg-transparent focus:ring-0"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Filters:</span>
              <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                Recent Batches
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort:</span>
              <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900">
                Date
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">BATCH NAME</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">INITIATED BY</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TOTAL AMOUNT (cNGN)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">DATE</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">EMPLOYEES</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">APPROVALS</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">TRANSACTION HASH</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-500">
                    No payment batches yet. Create your first batch to get started.
                  </td>
                </tr>
              ) : (
                paginatedBatches.flatMap((batch, index) => {
                  const isExpanded = expandedBatchId === batch.id
                  const approvalCountText = `${batch.approvalCount}/${batch.quorumRequired}`
                  const userHasApproved = hasSignedApproval(batch.approvalSignerAddresses)
                  const showActionButtons = isSignerOrAdmin && !isBatchTerminal(batch.statusRaw)
                  const isActionLoading = actionLoadingBatch !== null

                  const row = (
                    <tr key={batch.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4 text-sm text-gray-900">{startIndex + index + 1}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{batch.batchName}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">{(batch.creatorJobRole || "").trim() || toShortAddress(batch.creatorAddress)}</td>
                      <td className="py-4 px-4 text-sm font-semibold text-gray-900">
                        {formatAmount(batch.totalAmount)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{batch.date}</td>
                      <td className="py-4 px-4 text-sm text-gray-900">{batch.employees}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusStyle(batch.status)}`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>{approvalCountText}</span>
                          {batch.approvals.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleBatchExpanded(batch.id)}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              {isExpanded ? "Hide" : "View"}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {batch.txHash ? (
                          <a
                            href={`https://sepolia.basescan.org/tx/${batch.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {toShortAddress(batch.txHash)}
                          </a>
                        ) : "--"}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          {showActionButtons && (
                            <>
                              {userHasApproved && (
                                <Button
                                  variant="outline"
                                  className="h-8 px-3"
                                  disabled={isActionLoading}
                                  onClick={() => void handleRevokeApproval(batch.batchName)}
                                >
                                  {actionLoadingBatch === batch.batchName ? "Processing..." : "Revoke"}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                className="h-8 px-3"
                                disabled={isActionLoading || userHasApproved}
                                onClick={() => void handleApproveBatch(batch.batchName)}
                              >
                                {actionLoadingBatch === batch.batchName ? "Processing..." : "Approve"}
                              </Button>
                              <Button
                                className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                                disabled={isActionLoading || batch.approvalCount < batch.quorumRequired}
                                onClick={() => void handleExecuteBatch(batch.batchName)}
                              >
                                {actionLoadingBatch === batch.batchName ? "Processing..." : "Execute"}
                              </Button>
                              <Button
                                variant="outline"
                                className="h-8 px-3"
                                disabled={isActionLoading}
                                onClick={() => void handleCancelBatch(batch.batchName)}
                              >
                                {actionLoadingBatch === batch.batchName ? "Processing..." : "Cancel"}
                              </Button>
                            </>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )

                  const detailRow = isExpanded ? (
                    <tr key={`${batch.id}-approvals`} className="border-b border-gray-100 bg-gray-50">
                      <td colSpan={10} className="px-4 pb-4">
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-gray-700">Approvals</p>
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {batch.approvals.map((a) => (
                              <div
                                key={`${batch.id}-${a.signerAddress}-${a.approvedAt}`}
                                className="rounded border border-gray-200 bg-white px-3 py-2"
                              >
                                <p className="text-xs font-medium text-gray-900">{a.signerName || "Signer"}</p>
                                <p className="text-[10px] text-gray-600 font-mono">{toShortAddress(a.signerAddress)}</p>
                                <p className="text-[10px] text-gray-500">{new Date(a.approvedAt).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null

                  return detailRow ? [row, detailRow] : [row]
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              Page {safePage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <span>Rows:</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                disabled={batchesLoading}
                className="h-9 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700 disabled:opacity-50"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1 || batchesLoading}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
              >
                Prev
              </button>

              <div className="flex items-center gap-1">
                {(() => {
                  let ellipsisCount = 0
                  return pageItems.map((item) => {
                    if (item === "...") {
                      ellipsisCount += 1
                      const side = ellipsisCount === 1 ? "left" : "right"
                      return (
                        <span key={`ellipsis-${side}`} className="px-2 text-gray-500">
                          ...
                        </span>
                      )
                    }

                    const isActive = item === safePage
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        disabled={batchesLoading}
                        className={`h-9 min-w-9 rounded border text-sm disabled:opacity-50 ${
                          isActive
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  })
                })()}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={safePage >= totalPages || batchesLoading}
                className="px-3 py-2 rounded border border-gray-200 text-sm text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </Card>

      {showBatchModal && (
        <BatchPaymentCreationModal 
          organizationId={organization?._id}
          organizationAddress={organization?.contractAddress}
          onClose={() => setShowBatchModal(false)} 
          onPaymentCreated={handlePaymentCreated}
        />
      )}
    </div>
  )
}
