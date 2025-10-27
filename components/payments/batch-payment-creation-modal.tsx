"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ChevronLeft } from "lucide-react"
import { Card } from "@/components/ui/card"

interface BatchPaymentCreationModalProps {
  onClose: () => void
}

const employees = [
  {
    id: 1,
    surname: "Adeoye",
    firstName: "Adetola",
    salary: "500,000",
    username: "@ade_ade_41fd",
    wallet: "0x54...41fd",
    role: "HR Manager",
  },
  {
    id: 2,
    surname: "Balogun",
    firstName: "Timi",
    salary: "420,000",
    username: "@tim_bal_932a",
    wallet: "0x19b...aa34",
    role: "Graphics Designer",
  },
  {
    id: 3,
    surname: "Hassan",
    firstName: "Amina",
    salary: "600,000",
    username: "@ami_has_782c",
    wallet: "0x32f...bb12",
    role: "Finance Officer",
  },
  {
    id: 4,
    surname: "Eze",
    firstName: "Chidera",
    salary: "750,000",
    username: "@chi_eze_621b",
    wallet: "0x91d...441a",
    role: "Product Manager",
  },
  {
    id: 5,
    surname: "Johnson",
    firstName: "Femi",
    salary: "850,000",
    username: "@fem_joh_703e",
    wallet: "0x82f...c913",
    role: "Software Engineer",
  },
  {
    id: 6,
    surname: "Uche",
    firstName: "Kelechi",
    salary: "700,000",
    username: "@kel_uch_584a",
    wallet: "0x66d...193b",
    role: "Operations Lead",
  },
  {
    id: 7,
    surname: "Ojo",
    firstName: "Tolu",
    salary: "580,000",
    username: "@tol_ojo_298d",
    wallet: "0x92f...77bc",
    role: "Business Analyst",
  },
  {
    id: 8,
    surname: "Yusuf",
    firstName: "Mariam",
    salary: "620,000",
    username: "@mar_yus_613b",
    wallet: "0x15d...ac22",
    role: "Accountant",
  },
  {
    id: 9,
    surname: "Adebayo",
    firstName: "Ridwan",
    salary: "800,000",
    username: "@rid_ade_990f",
    wallet: "0x48b...f61d",
    role: "Backend Developer",
  },
]

export function BatchPaymentCreationModal({ onClose }: BatchPaymentCreationModalProps) {
  const [step, setStep] = useState<"details" | "employees" | "preview">("details")
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([])
  const [formData, setFormData] = useState({
    batchName: "",
    paymentDate: "Oct 21,2025",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEmployeeToggle = (id: number) => {
    setSelectedEmployees((prev) => (prev.includes(id) ? prev.filter((empId) => empId !== id) : [...prev, id]))
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(employees.map((e) => e.id))
    }
  }

  const selectedEmployeeData = employees.filter((e) => selectedEmployees.includes(e.id))
  const totalAmount = selectedEmployeeData.reduce((sum, emp) => sum + Number.parseInt(emp.salary.replace(/,/g, "")), 0)

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-8 mb-8">
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === "details" || step === "employees" || step === "preview" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}
        >
          ✓
        </div>
        <span className="text-xs mt-2 text-gray-600">Details</span>
      </div>
      <div className="w-12 h-1 bg-gray-300"></div>
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === "employees" || step === "preview" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}
        >
          {step === "employees" || step === "preview" ? "✓" : "2"}
        </div>
        <span className="text-xs mt-2 text-gray-600">Select Employees</span>
      </div>
      <div className="w-12 h-1 bg-gray-300"></div>
      <div className="flex flex-col items-center">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step === "preview" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"}`}
        >
          3
        </div>
        <span className="text-xs mt-2 text-gray-600">Preview</span>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {step !== "details" && (
              <button
                onClick={() => setStep(step === "employees" ? "details" : "employees")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="text-xl font-semibold">Batch Payment Creation</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                <p className="text-gray-600 text-sm mb-4">Set up your payment batch name and approval requirements</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name</label>
                <Input
                  name="batchName"
                  placeholder="Enter batch name"
                  value={formData.batchName}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <Input
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
                <p className="text-gray-600 text-sm">Choose which employees to include in this payment batch</p>
              </div>

              {/* Search and Select All */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input placeholder="Search for Employee" className="w-full" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.length === employees.length}
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
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm w-12">#</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">SURNAME</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">FIRST NAME</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">SALARY (cNGN)</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">USERNAME</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">WALLET ADDRESS</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-sm">ROLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                        <td className="py-4 px-4 text-sm text-gray-900">{emp.salary}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{emp.username}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{emp.wallet}</td>
                        <td className="py-4 px-4 text-sm text-gray-900">{emp.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">{formData.batchName}</h3>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-gray-600 text-sm mb-1">Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedEmployeeData.length}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-gray-600 text-sm mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(totalAmount / 1000000).toFixed(3)}M<span className="text-sm">cNGN</span>
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-gray-600 text-sm mb-1">Payment Date</p>
                  <p className="text-2xl font-bold text-gray-900">{formData.paymentDate}</p>
                </Card>
              </div>

              {/* Payment Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Payment Breakdown</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedEmployeeData.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-900">
                          {emp.surname} {emp.firstName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {emp.username} • {emp.role}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">{emp.salary}</p>
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
                <Button variant="outline">Save Draft</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Proceed to Payment</Button>
              </>
            )}
            {step !== "preview" && (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(step === "details" ? "employees" : "preview")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={step === "employees" && selectedEmployees.length === 0}
                >
                  Next
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
