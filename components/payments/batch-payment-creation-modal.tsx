"use client"

import { activeChain } from "@/constants/chain";
import type React from "react"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { PillButton } from "@/components/ui/pill-button"
import { ChevronLeft, Loader2 } from "lucide-react"
import {
  fetchTaxPreview,
  mapApiEmployeeToEmployee,
  recordBatchCreation,
  useOrganizationEmployees,
  type TaxPreviewResponse,
} from "@/lib/api/organization"
import { toast } from "sonner"
import { useActiveAccount } from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { thirdwebClient } from "@/app/client"
import { toBaseUnits } from "@/lib/token"
import { useToken } from "@/hooks/useToken"
import { useSponsoredTransaction } from "@/hooks/useSponsoredTransaction"

const steps = [
  { key: "details", label: "Details" },
  { key: "employees", label: "Select Employees" },
  { key: "preview", label: "Preview" },
] as const

const today = () =>
  new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

const shortAddress = (value: string) =>
  value && value.length >= 12 ? `${value.slice(0, 5)}...${value.slice(-4)}` : value || "--"

interface BatchPaymentCreationModalProps {
  onClose: () => void
  onPaymentCreated?: () => void
  organizationId?: string
  organizationAddress?: string
}

export function BatchPaymentCreationModal({
  onClose,
  onPaymentCreated,
  organizationId,
  organizationAddress,
}: Readonly<BatchPaymentCreationModalProps>) {
  const { symbol } = useToken()
  const account = useActiveAccount()
  const { send, canSign } = useSponsoredTransaction()
  const [step, setStep] = useState<"details" | "employees" | "preview" | "success">("details")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taxPreview, setTaxPreview] = useState<TaxPreviewResponse | null>(null)
  const [taxLoading, setTaxLoading] = useState(false)
  const [formData, setFormData] = useState({
    batchName: "",
    paymentDate: today(),
    description: "",
  })

  const { data: employeesData, loading: employeesLoading, error: employeesError } = useOrganizationEmployees(organizationId || null)

  const employees = useMemo(() => {
    const apiEmployees = employeesData?.employees || []
    return apiEmployees
      .map(mapApiEmployeeToEmployee)
      .filter((e) => !e.isSigner)
  }, [employeesData])

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) => {
      return (
        e.surname.toLowerCase().includes(q) ||
        e.firstName.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        e.walletAddress.toLowerCase().includes(q)
      )
    })
  }, [employeeSearch, employees])

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(3)}M`
    }
    return amount.toLocaleString()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEmployeeToggle = (id: string) => {
    setSelectedEmployees((prev) => (prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(filteredEmployees.map((e) => e.id))
    }
  }

  const handleProceedToPayment = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      if (!account?.address) {
        toast.error("Still getting your account ready, try again in a moment")
        return
      }

      if (!organizationId || !organizationAddress) {
        toast.error("Missing organization details")
        return
      }

      const batchName = formData.batchName.trim()
      if (!batchName) {
        toast.error("Batch name is required")
        return
      }

      if (selectedEmployeeData.length === 0) {
        toast.error("Select at least one employee")
        return
      }

      // Scaled by the token's real decimals rather than an assumed six, and
      // through BigInt rather than a float, so a large payroll cannot lose
      // precision on its way into the contract call.
      const recipients = selectedEmployeeData.map((e) => e.walletAddress)
      const amounts = await Promise.all(
        selectedEmployeeData.map((e) => toBaseUnits(e.salary || 0))
      )

      const contract = getContract({
        client: thirdwebClient,
        address: organizationAddress,
        chain: activeChain,
      })

      const tx = prepareContractCall({
        contract,
        method:
          "function createBatchPayroll(string batchName, address[] recipients, uint256[] amounts)",
        params: [batchName, recipients, amounts],
      })

      await send(tx)

      await recordBatchCreation({
        batchName,
        organizationId,
        organizationAddress,
        creatorAddress: account.address,
        recipients: selectedEmployeeData.map((e, idx) => ({
          userId: e.id,
          walletAddress: e.walletAddress,
          amount: amounts[idx].toString(),
          employeeName: `${e.firstName} ${e.surname}`.trim(),
        })),
      })

      if (onPaymentCreated) {
        onPaymentCreated()
      }

      setStep("success")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create batch"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedEmployeeData = employees.filter((e) => selectedEmployees.includes(e.id))
  const totalAmount = selectedEmployeeData.reduce((sum, emp) => sum + Number(emp.salary || 0), 0)

  // Fetched rather than computed here: PAYE is progressive and depends on the
  // organization's regime and each member's salaryIsGross, so a rate assumed in
  // the browser would not match what the receipt ends up carrying.
  useEffect(() => {
    if (step !== "preview" || !organizationId || selectedEmployeeData.length === 0) return

    const addresses = selectedEmployeeData.map((e) => e.walletAddress).filter(Boolean)
    if (addresses.length === 0) return

    let cancelled = false
    setTaxLoading(true)

    fetchTaxPreview(organizationId, addresses)
      .then((result) => {
        if (!cancelled) setTaxPreview(result)
      })
      .catch(() => {
        // The batch can still be raised without the estimate, so the columns
        // fall back to showing the salary alone rather than blocking review.
        if (!cancelled) setTaxPreview(null)
      })
      .finally(() => {
        if (!cancelled) setTaxLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, organizationId, selectedEmployees.join(",")])

  const taxByAddress = useMemo(() => {
    const map = new Map<string, TaxPreviewResponse["lines"][number]>()
    for (const line of taxPreview?.lines ?? []) {
      map.set(line.address.toLowerCase(), line)
    }
    return map
  }, [taxPreview])

  const showTax = (taxPreview?.taxEnabled ?? false) && taxByAddress.size > 0

  // Summed from the same lines the table renders, so the totals cannot drift
  // from the rows above them.
  const sumLines = (pick: (line: TaxPreviewResponse["lines"][number]) => string) =>
    selectedEmployeeData.reduce((sum, emp) => {
      const line = taxByAddress.get(emp.walletAddress.toLowerCase())
      return sum + (line ? Number(pick(line)) : 0)
    }, 0)

  const grossTotal = showTax ? sumLines((l) => l.grossFormatted) : totalAmount
  const taxTotal = showTax ? sumLines((l) => l.taxFormatted) : 0
  const netTotal = showTax ? sumLines((l) => l.netFormatted) : totalAmount

  const stepIndex = steps.findIndex((s) => s.key === step)

  const renderStepIndicator = () => (
    <div className="flex w-72 flex-col gap-2">
      <div className="flex items-center">
        {steps.map((s, index) => (
          <div key={s.key} className="contents">
            {index > 0 ? (
              <div
                className={`h-0.5 flex-1 ${index <= stepIndex ? "bg-indigo-300" : "bg-gray-300"}`}
              />
            ) : null}
            {index < stepIndex ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="size-3">
                  <path
                    d="M2.5 6.2 4.8 8.5 9.5 3.8"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <Image
                src={index === stepIndex ? "/icons/step-dot-active.svg" : "/icons/step-dot-pending.svg"}
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <span
            key={s.key}
            className={`text-xs ${
              index < stepIndex ? "font-medium text-indigo-700" : "text-neutral-600"
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )

  // Show success modal
  if (step === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">
        <div className="flex w-full max-w-[552px] flex-col items-center gap-10 rounded-xl bg-white p-10 shadow-[0px_16px_135px_0px_rgba(24,34,57,0.12)] outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-300">
          <div className="flex flex-col items-center gap-8">
            <Image
              src="/illustrations/batch-submitted.svg"
              alt=""
              width={160}
              height={160}
              className="size-40"
            />

            <div className="flex flex-col items-center gap-3">
              <h2 className="text-center font-nohemi text-3xl font-medium text-zinc-600">
                Batch payment submitted
              </h2>
              <p className="text-center text-base text-neutral-600">
                {formData.batchName} has been submitted successfully and is waiting for the
                required approvals.
              </p>
            </div>
          </div>

          <PillButton tone="primary" className="w-full py-4" onClick={onClose}>
            View Batch
          </PillButton>
        </div>
      </div>
    )
  }

  let employeesTableBody: React.ReactNode
  if (employeesLoading) {
    employeesTableBody = (
      <tr>
        <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            Loading employees...
          </span>
        </td>
      </tr>
    )
  } else if (employeesError) {
    employeesTableBody = (
      <tr>
        <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
          Failed to load employees: {employeesError}
        </td>
      </tr>
    )
  } else if (filteredEmployees.length === 0) {
    employeesTableBody = (
      <tr>
        <td colSpan={7} className="py-10 text-center text-sm text-gray-500">
          No employees found.
        </td>
      </tr>
    )
  } else {
    employeesTableBody = filteredEmployees.map((emp, index) => (
      <tr
        key={emp.id}
        onClick={() => handleEmployeeToggle(emp.id)}
        className="cursor-pointer border-b border-gray-100 hover:bg-slate-50"
      >
        <SelectTd>
          <span className="flex items-center gap-2.5">
            <Checkbox
              checked={selectedEmployees.includes(emp.id)}
              onChange={() => handleEmployeeToggle(emp.id)}
              label={`Select ${emp.firstName} ${emp.surname}`.trim()}
            />
            <span className="text-sm font-semibold text-gray-500">{index + 1}</span>
          </span>
        </SelectTd>
        <SelectTd className="truncate text-center font-semibold text-neutral-500">
          {emp.surname}
        </SelectTd>
        <SelectTd className="truncate text-center font-semibold text-neutral-500">
          {emp.firstName}
        </SelectTd>
        <SelectTd className="text-center font-semibold text-neutral-800">
          {formatAmount(Number(emp.salary || 0))}
        </SelectTd>
        <SelectTd className="truncate text-center font-semibold text-neutral-800">
          @{emp.displayUsername || emp.username}
        </SelectTd>
        <SelectTd className="truncate text-center font-semibold text-neutral-800">
          {shortAddress(emp.walletAddress)}
        </SelectTd>
        <SelectTd className="truncate text-center font-semibold text-neutral-500">
          {emp.role}
        </SelectTd>
      </tr>
    ))
  }

  if (step === "details") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="flex w-[554px] flex-col gap-10 rounded-[20px] bg-white p-12 shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] -outline-offset-[0.5px] outline-neutral-300">
          <div className="flex flex-col items-center gap-10">
            <ModalHeader onClose={onClose} />
            {renderStepIndicator()}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-base font-medium text-neutral-500">Basic Details</p>
            <p className="text-xs text-neutral-600">
              Set up your payment batch name and approval requirements
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-5">
              <DetailsField
                id="batchName"
                label="Batch Name"
                placeholder="Enter batch name"
                value={formData.batchName}
                onChange={handleInputChange}
              />
              <DetailsField
                id="paymentDate"
                label="Payment Date"
                placeholder="Enter payment date"
                value={formData.paymentDate}
                onChange={handleInputChange}
              />
              <DetailsField
                id="description"
                label="Description (optional)"
                placeholder="September monthly payroll"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <PillButton
              tone="primary"
              className="w-full"
              onClick={() => setStep("employees")}
              disabled={!formData.batchName.trim()}
            >
              Next
            </PillButton>
          </div>
        </div>
      </div>
    )
  }

  if (step === "employees") {
    const allSelected =
      filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">
        <div className="flex w-full max-w-[1237px] flex-col gap-10 rounded-[20px] bg-white p-12 shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] -outline-offset-[0.5px] outline-neutral-300">
          <ModalHeader onBack={() => setStep("details")} onClose={onClose} />

          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-base font-medium text-neutral-500">Select Employees</p>
                <p className="text-xs text-neutral-600">
                  Choose which employees to include in this payment batch
                </p>
              </div>
              {renderStepIndicator()}
            </div>

            <div className="flex flex-col gap-5 rounded-[20px] p-5 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-100">
              <div className="flex flex-col">
                <div className="flex h-10 items-center">
                  <p className="font-nohemi text-xl font-medium leading-6 text-neutral-600">
                    Employee&apos;s List
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <div className="flex h-9 w-64 items-center overflow-hidden rounded-full pl-4 outline outline-[0.3px] -outline-offset-[0.3px] outline-neutral-300">
                    <Input
                      placeholder="Search for Employee"
                      className="h-9 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                    />
                    <span className="flex h-9 items-center bg-indigo-50 px-4 outline outline-[0.3px] -outline-offset-[0.3px] outline-neutral-100">
                      <Image
                        src="/icons/vuesax/linear/search-normal.svg"
                        alt=""
                        width={16}
                        height={16}
                        className="size-4"
                      />
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 p-2">
                    <Checkbox
                      checked={allSelected}
                      onChange={handleSelectAll}
                      label="Select all employees"
                    />
                    <span className="text-sm font-medium text-neutral-800">Select All</span>
                  </div>
                </div>
              </div>

              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[980px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[5%]" />
                    <col className="w-[15%]" />
                    <col className="w-[15%]" />
                    <col className="w-[11%]" />
                    <col className="w-[19%]" />
                    <col className="w-[17%]" />
                    <col className="w-[18%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr className="h-14 border-y border-gray-100 bg-neutral-100">
                      <SelectTh className="text-left text-sm font-semibold text-gray-800">#</SelectTh>
                      <SelectTh className="text-center">SURNAME</SelectTh>
                      <SelectTh className="text-center">FIRST NAME</SelectTh>
                      <SelectTh className="text-center">SALARY ({symbol || "--"})</SelectTh>
                      <SelectTh className="text-center">USERNAME</SelectTh>
                      <SelectTh className="text-center">WALLET ADDRESS</SelectTh>
                      <SelectTh className="text-center">ROLE</SelectTh>
                    </tr>
                  </thead>
                  <tbody>{employeesTableBody}</tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <PillButton tone="soft" onClick={() => setStep("details")}>
                Back
              </PillButton>
              <PillButton
                tone="primary"
                onClick={() => setStep("preview")}
                disabled={selectedEmployees.length === 0}
              >
                Next
              </PillButton>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-6">
      <div className="flex w-full max-w-[1237px] flex-col gap-10 rounded-[20px] bg-white p-12 shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] -outline-offset-[0.5px] outline-neutral-300">
        <ModalHeader onBack={() => setStep("employees")} onClose={onClose} />

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-base font-medium text-neutral-500">Review</p>
              <p className="max-w-sm text-xs text-neutral-600">
                Review employee payments, deductions, and total payroll before submitting for
                approval.
              </p>
            </div>
            {renderStepIndicator()}
          </div>

          <div className="flex flex-col items-start gap-4 lg:flex-row">
            <div className="w-full rounded-[20px] p-4 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-100 lg:w-[730px]">
              <div className="max-h-[300px] overflow-auto">
                <table className="w-full min-w-[600px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                    <col className="w-[25%]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr className="h-14 border-y border-gray-100 bg-neutral-100">
                      <SelectTh className="text-center">NAMES</SelectTh>
                      <SelectTh className="text-center">
                        {showTax ? `GROSS SALARY (${symbol || "--"})` : `SALARY (${symbol || "--"})`}
                      </SelectTh>
                      {showTax ? (
                        <>
                          <SelectTh className="text-center">TAX</SelectTh>
                          <SelectTh className="text-center">NET PAY ({symbol || "--"})</SelectTh>
                        </>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedEmployeeData.map((emp) => {
                      const line = taxByAddress.get(emp.walletAddress.toLowerCase())
                      return (
                        <tr key={emp.id} className="border-b border-gray-100">
                          <SelectTd className="truncate text-center font-semibold text-neutral-500">
                            {`${emp.surname} ${emp.firstName}`.trim()}
                          </SelectTd>
                          <SelectTd className="text-center font-semibold text-neutral-800">
                            {line
                              ? Number(line.grossFormatted).toLocaleString()
                              : formatAmount(Number(emp.salary || 0))}
                          </SelectTd>
                          {showTax ? (
                            <>
                              <SelectTd className="text-center font-semibold text-neutral-800">
                                {line ? Number(line.taxFormatted).toLocaleString() : "--"}
                              </SelectTd>
                              <SelectTd className="text-center font-semibold text-neutral-800">
                                {line ? Number(line.netFormatted).toLocaleString() : "--"}
                              </SelectTd>
                            </>
                          ) : null}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex w-full flex-1 flex-col gap-6 rounded-lg bg-neutral-50 px-2 pb-2 pt-4 outline outline-1 -outline-offset-1 outline-zinc-200">
              <div className="px-2">
                <p className="font-nohemi text-xs font-medium tracking-wide text-zinc-600">
                  PAYROLL SUMMARY
                </p>
              </div>

              <div className="rounded-sm bg-white p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-200">
                <SummaryRow label="Employees" value={String(selectedEmployeeData.length)} />
                <SummaryRow
                  label={showTax ? "Gross Payroll" : "Total Payroll"}
                  unit={symbol}
                  value={grossTotal.toLocaleString()}
                />
                {showTax ? (
                  <>
                    <SummaryRow label="Total Tax" unit={symbol} value={taxTotal.toLocaleString()} />
                    <SummaryRow
                      label="Employee Payments"
                      unit={symbol}
                      value={netTotal.toLocaleString()}
                    />
                  </>
                ) : null}
                {/* Every write is sponsored, so there is no network fee to
                    report here. Quoting one would bill the sender for gas the
                    paymaster paid. */}
                <SummaryRow
                  label="Total Outflow"
                  unit={symbol}
                  value={(showTax ? netTotal : grossTotal).toLocaleString()}
                  emphasis
                />
              </div>

              {taxLoading ? (
                <p className="px-2 pb-2 text-[10px] text-zinc-500">Estimating deductions...</p>
              ) : null}

              {showTax && taxPreview && !taxPreview.regimeVerified ? (
                <p className="px-2 pb-2 text-[10px] leading-relaxed text-amber-700">
                  These figures come from an unverified tax table and are an estimate.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <PillButton tone="soft" onClick={() => setStep("employees")}>
              Back
            </PillButton>
            <PillButton
              tone="primary"
              onClick={handleProceedToPayment}
              disabled={
                isSubmitting ||
                !formData.batchName ||
                selectedEmployees.length === 0 ||
                !canSign
              }
              title={canSign ? undefined : "Still getting your account ready"}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              Submit for Approval
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalHeader({ onBack, onClose }: { onBack?: () => void; onClose: () => void }) {
  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-8">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          // Kept in the layout when there is nowhere to go back to, so the
          // title sits at the same x on every step.
          className={`text-neutral-500 transition-colors hover:text-neutral-700 ${onBack ? "" : "invisible"}`}
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-nohemi text-2xl font-medium text-blue-950">Batch Payment Creation</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-8 items-center justify-center rounded-sm bg-rose-100 transition-colors hover:bg-rose-200"
      >
        <Image
          src="/icons/vuesax/linear/octagonal-close-icon.svg"
          alt=""
          width={20}
          height={20}
          className="size-5"
        />
      </button>
    </div>
  )
}

function SummaryRow({
  label,
  unit,
  value,
  emphasis = false,
}: {
  label: string
  unit?: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 border-b-[0.3px] border-zinc-300 px-2.5 py-3 last:border-b-0 ${
        emphasis ? "bg-gray-200" : ""
      }`}
    >
      <span className="flex flex-col items-start">
        <span className={`text-xs ${emphasis ? "font-medium text-zinc-800" : "text-zinc-500"}`}>
          {label}
        </span>
        {unit ? <span className="text-[10px] text-zinc-500">({unit})</span> : null}
      </span>
      <span className="font-nohemi text-sm font-medium text-neutral-700">{value}</span>
    </div>
  )
}

function SelectTh({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`truncate p-2 text-xs font-normal tracking-wide text-neutral-600 ${className}`}
    >
      {children}
    </th>
  )
}

function SelectTd({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`p-2 py-4 text-xs leading-4 ${className}`}>{children}</td>
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex size-3 shrink-0 items-center justify-center rounded-[2px] border ${
        checked ? "border-indigo-600 bg-indigo-600" : "border-zinc-400"
      }`}
    >
      {checked ? (
        <svg viewBox="0 0 10 10" fill="none" aria-hidden="true" className="size-2.5">
          <path
            d="M2 5.2 4 7.2 8 3"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </button>
  )
}

function DetailsField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs text-neutral-500">
        {label}
      </label>
      <Input
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-auto rounded-lg border-0 bg-slate-50 p-4 text-sm text-gray-600 shadow-none outline outline-1 -outline-offset-1 outline-indigo-200 focus-visible:ring-0"
      />
    </div>
  )
}

