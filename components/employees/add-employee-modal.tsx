"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ChevronLeft } from "lucide-react"
import { AddEmployeeSuccessModal } from "./add-employee-success-modal"
import { addEmployeeToSession } from "@/lib/localStorage"

interface AddEmployeeModalProps {
  onClose: () => void
  onEmployeeAdded?: () => void
}

export function AddEmployeeModal({ onClose, onEmployeeAdded }: Readonly<AddEmployeeModalProps>) {
  const [step, setStep] = useState<"form" | "success">("form")
  const [formData, setFormData] = useState({
    username: "",
    role: "",
    salary: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!formData.username || !formData.role || !formData.salary) {
      return
    }
    
    // Add employee to session storage
    addEmployeeToSession({
      username: formData.username,
      role: formData.role,
      salary: Number(formData.salary),
    })
    
    // Notify parent to refresh
    if (onEmployeeAdded) {
      onEmployeeAdded()
    }
    
    setStep("success")
  }

  const handleClose = () => {
    onClose()
  }

  if (step === "success") {
    return <AddEmployeeSuccessModal onClose={handleClose} />
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Add Employee</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600">Enter the details of your new employee to add them to your organization.</p>

          {/* Employee's username */}
          <div>
            <label htmlFor="employee-username" className="block text-sm font-medium text-gray-700 mb-2">Employee&apos;s username</label>
            <div className="relative">
              <Input
                id="employee-username"
                name="username"
                placeholder="Search username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full pl-10"
              />
              <svg
                className="absolute left-3 top-3 text-gray-400"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="employee-role" className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <Input
              id="employee-role"
              name="role"
              placeholder="Enter employee's role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          {/* Salary */}
          <div>
            <label htmlFor="employee-salary" className="block text-sm font-medium text-gray-700 mb-2">Salary (cNGN)</label>
            <Input
              id="employee-salary"
              name="salary"
              placeholder="e.g., 500,000"
              value={formData.salary}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button 
            onClick={handleSubmit} 
            disabled={!formData.username || !formData.role || !formData.salary}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
          >
            Add Employee
          </Button>
        </div>
      </div>
    </div>
  )
}
