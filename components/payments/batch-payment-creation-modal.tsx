"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ChevronLeft, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { SuccessModal } from "@/components/success-modal"
import { mapApiEmployeeToEmployee, recordBatchCreation, useOrganizationEmployees } from "@/lib/api/organization"
import { toast } from "sonner"
import { useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react"
import { getContract, prepareContractCall } from "thirdweb"
import { baseSepolia } from "thirdweb/chains"
import { thirdwebClient } from "@/app/client"

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
  const account = useActiveAccount()
  const { mutateAsync: sendAndConfirmTx } = useSendAndConfirmTransaction()
  const [step, setStep] = useState<"details" | "employees" | "preview" | "success">("details")
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    batchName: "",
    paymentDate: "Oct 21,2025",
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
        toast.error("Connect your wallet to continue")
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

      // Convert human salary to base units (cNGN decimals = 6)
      const recipients = selectedEmployeeData.map((e) => e.walletAddress)
      const amounts = selectedEmployeeData.map((e) => {
        const v = Number(e.salary || 0)
        const base = Math.round(v * 1_000_000)
        return BigInt(base)
      })

      const contract = getContract({
        client: thirdwebClient,
        address: organizationAddress,
        chain: baseSepolia,
      })

      const tx = prepareContractCall({
        contract,
        method:
          "function createBatchPayroll(string batchName, address[] recipients, uint256[] amounts)",
        params: [batchName, recipients, amounts],
      })

      await sendAndConfirmTx(tx)

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

  const renderStepIndicator = () => {
    const detailsActive = step === "details" || step === "employees" || step === "preview"
    const employeesActive = step === "employees" || step === "preview"
    const previewActive = step === "preview"

    const baseCircleClass = "w-10 h-10 rounded-full flex items-center justify-center font-semibold"
    const activeCircleClass = "bg-blue-600 text-white"
    const inactiveCircleClass = "bg-gray-300 text-gray-600"

    const detailsCircleClass = `${baseCircleClass} ${detailsActive ? activeCircleClass : inactiveCircleClass}`
    const employeesCircleClass = `${baseCircleClass} ${employeesActive ? activeCircleClass : inactiveCircleClass}`
    const previewCircleClass = `${baseCircleClass} ${previewActive ? activeCircleClass : inactiveCircleClass}`
    const employeesCircleText = employeesActive ? "✓" : "2"

    return (
      <div className="flex items-center justify-center gap-8 mb-8">
        <div className="flex flex-col items-center">
          <div className={detailsCircleClass}>✓</div>
          <span className="text-xs mt-2 text-gray-600">Details</span>
        </div>
        <div className="w-12 h-1 bg-gray-300"></div>
        <div className="flex flex-col items-center">
          <div className={employeesCircleClass}>{employeesCircleText}</div>
          <span className="text-xs mt-2 text-gray-600">Select Employees</span>
        </div>
        <div className="w-12 h-1 bg-gray-300"></div>
        <div className="flex flex-col items-center">
          <div className={previewCircleClass}>3</div>
          <span className="text-xs mt-2 text-gray-600">Preview</span>
        </div>
      </div>
    )
  }

  // Show success modal
  if (step === "success") {
    return (
      <SuccessModal
        title="Batch Payment Created"
        icon="check"
        summary={[
          {
            label: "Batch Name",
            value: formData.batchName,
          },
          {
            label: "Total Amount",
            value: formatAmount(totalAmount),
          },
          {
            label: "Employees",
            value: selectedEmployeeData.length.toString(),
          },
          {
            label: "Payment Date",
            value: formData.paymentDate,
          },
        ]}
        onClose={onClose}
      />
    )
  }

  let employeesTableBody: React.ReactNode
  if (employeesLoading) {
    employeesTableBody = (
      <tr>
        <td colSpan={7} className="py-10 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading employees...
          </div>
        </td>
      </tr>
    )
  } else if (employeesError) {
    employeesTableBody = (
      <tr>
        <td colSpan={7} className="py-10 text-center text-gray-500">
          Failed to load employees: {employeesError}
        </td>
      </tr>
    )
  } else if (filteredEmployees.length === 0) {
    employeesTableBody = (
      <tr>
        <td colSpan={7} className="py-10 text-center text-gray-500">
          No employees found.
        </td>
      </tr>
    )
  } else {
    employeesTableBody = filteredEmployees.map((emp) => (
      <tr
        key={emp.id}
        className="border-b border-gray-100 hover:bg-gray-50"
      >
        <td className="py-4 px-4">
          <input
            type="checkbox"
            checked={selectedEmployees.includes(emp.id)}
            onChange={() => handleEmployeeToggle(emp.id)}
            className="w-4 h-4"
          />
        </td>
        <td className="py-4 px-4 text-sm text-gray-900">{emp.surname}</td>
        <td className="py-4 px-4 text-sm text-gray-900">{emp.firstName}</td>
        <td className="py-4 px-4 text-sm text-gray-900">
          {formatAmount(Number(emp.salary || 0))}
        </td>
        <td className="py-4 px-4 text-sm text-gray-600">
          {emp.displayUsername ? `@${emp.displayUsername}` : `@${emp.username}`}
        </td>
        <td className="py-4 px-4 text-sm text-gray-600">{emp.walletAddress}</td>
        <td className="py-4 px-4 text-sm text-gray-900">{emp.role}</td>
      </tr>
    ))
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {step !== "details" && (
              <button
                onClick={() =>
                  setStep(step === "employees" ? "details" : "employees")
                }
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="text-xl font-semibold">Batch Payment Creation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {renderStepIndicator()}

          {/* Step 1: Details */}
          {step === "details" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Basic Details</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Set up your payment batch name and approval requirements
                </p>
              </div>

              <div>
                <label
                  htmlFor="batchName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Batch Name
                </label>
                <Input
                  id="batchName"
                  name="batchName"
                  placeholder="Enter batch name"
                  value={formData.batchName}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="paymentDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Payment Date
                </label>
                <Input
                  id="paymentDate"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Step 2: Select Employees */}
          {step === "employees" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Select Employees</h3>
                <p className="text-gray-600 text-sm">
                  Choose which employees to include in this payment batch
                </p>
              </div>

              {/* Search and Select All */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input
                    placeholder="Search for Employee"
                    className="w-full"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filteredEmployees.length > 0 && selectedEmployees.length === filteredEmployees.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Select All</span>
                </label>
              </div>

              {/* Employee List */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm w-12">
                        #
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        SURNAME
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        FIRST NAME
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        SALARY (cNGN)
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        USERNAME
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        WALLET ADDRESS
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">
                        ROLE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeesTableBody}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {formData.batchName}
                </h3>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-gray-600 text-sm mb-1">Employees</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedEmployeeData.length}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-gray-600 text-sm mb-1">Total Amount (cNGN)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(totalAmount)}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-gray-600 text-sm mb-1">Payment Date</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formData.paymentDate}
                  </p>
                </Card>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Payment Breakdown
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedEmployeeData.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {emp.surname} {emp.firstName}
                        </p>
                        <p className="text-xs text-gray-600">
                          @{emp.displayUsername || emp.username} • {emp.role}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {formatAmount(Number(emp.salary || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div>
            {step === "preview" && (
              <Button variant="outline" onClick={() => setStep("employees")}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === "preview" && (
              <>
                <Button variant="outline" onClick={() => setStep("details")}>
                  Save Draft
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  disabled={
                    isSubmitting || !formData.batchName || selectedEmployees.length === 0
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                >
                  {isSubmitting ? "Submitting..." : "Proceed to Payment"}
                </Button>
              </>
            )}
            {step !== "preview" && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    setStep(step === "details" ? "employees" : "preview")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={
                    isSubmitting ||
                    (step === "employees" && selectedEmployees.length === 0) ||
                    (step === "details" && !formData.batchName)
                  }
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
