"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ChevronLeft, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { AddEmployeeSuccessModal } from "./add-employee-success-modal"
import { addEmployeeToSession } from "@/lib/localStorage"

// Local apiFetch helper
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050").replace(/\/$/, "").replace(/\/api$/, "")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }
  
  const response = await fetch(`${backendBaseUrl}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Request failed", message: "Request failed" }))

    const message =
      (typeof errorData?.message === "string" && errorData.message) ||
      (typeof errorData?.error === "string" && errorData.error) ||
      (typeof errorData?.details === "string" && errorData.details) ||
      `Request failed (HTTP ${response.status})`

    throw new Error(message)
  }
  
  return response.json()
}

async function backendFetchBlob(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token")
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5050").replace(/\/$/, "").replace(/\/api$/, "")
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${backendBaseUrl}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.blob()
}

interface AddEmployeeModalProps {
  onClose: () => void
  onEmployeeAdded?: () => void
  organizationId?: string
}

interface BulkUploadResult {
  added: number
  errors: Array<{ row: number; walletAddress: string; error: string }>
  details: Array<{ 
    walletAddress: string
    username: string 
    status: "added" | "skipped" | "error"
    isVerified: boolean
    message?: string 
  }>
}

interface FormData {
  username: string
  surname: string
  firstname: string
  walletAddress: string
  role: string
  salary: string
  department: string
  employeeId: string
}

// Sub-component for Single Employee Form
function SingleEmployeeForm({
  formData,
  onChange,
  onResolveUsername,
  isResolvingUsername,
  isAutofilled,
}: Readonly<{
  formData: FormData
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onResolveUsername: () => void
  isResolvingUsername: boolean
  isAutofilled: boolean
}>) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Enter the details of your new employee to add them to your organization.</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <div className="flex gap-2">
            <Input
              id="username"
              name="username"
              placeholder="johndoe"
              value={formData.username}
              onChange={onChange}
              className="w-full"
            />
            <Button
              type="button"
              variant="outline"
              onClick={onResolveUsername}
              disabled={!formData.username || isResolvingUsername}
              className="shrink-0"
            >
              {isResolvingUsername ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>
        <div>
          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <Input
            id="employeeId"
            name="employeeId"
            placeholder="EMP001"
            value={formData.employeeId}
            onChange={onChange}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="surname" className="block text-sm font-medium text-gray-700 mb-1">Surname *</label>
          <Input
            id="surname"
            name="surname"
            placeholder="Doe"
            value={formData.surname}
            onChange={onChange}
            disabled={isAutofilled}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <Input
            id="firstname"
            name="firstname"
            placeholder="John"
            value={formData.firstname}
            onChange={onChange}
            disabled={isAutofilled}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">Wallet Address *</label>
        <Input
          id="walletAddress"
          name="walletAddress"
          placeholder="0x..."
          value={formData.walletAddress}
          onChange={onChange}
          disabled={isAutofilled}
          className="w-full font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Job Role *</label>
          <Input
            id="role"
            name="role"
            placeholder="Software Engineer"
            value={formData.role}
            onChange={onChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <Input
            id="department"
            name="department"
            placeholder="Engineering"
            value={formData.department}
            onChange={onChange}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">Salary (cNGN) *</label>
        <Input
          id="salary"
          name="salary"
          type="number"
          placeholder="e.g., 500000"
          value={formData.salary}
          onChange={onChange}
          className="w-full"
        />
      </div>
    </div>
  )
}

// Sub-component for Upload Results Table
function UploadResultsTable({ details }: Readonly<{ details: BulkUploadResult["details"] }>) {
  if (details.length === 0) return null

  return (
    <div className="mt-3 max-h-40 overflow-y-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="pb-2">Wallet Address</th>
            <th className="pb-2">Username</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Verified</th>
            <th className="pb-2">Message</th>
          </tr>
        </thead>
        <tbody>
          {details.slice(0, 10).map((detail) => {
            let statusClass = "bg-red-100 text-red-700"
            if (detail.status === "added") {
              statusClass = "bg-green-100 text-green-700"
            } else if (detail.status === "skipped") {
              statusClass = "bg-yellow-100 text-yellow-700"
            }

            return (
              <tr key={`${detail.walletAddress}-${detail.status}-${detail.username}`} className="border-t border-gray-200">
              <td className="py-2 font-mono text-xs">{detail.walletAddress.slice(0, 6)}...{detail.walletAddress.slice(-4)}</td>
              <td className="py-2">{detail.username || "-"}</td>
              <td className="py-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
                  {detail.status}
                </span>
              </td>
              <td className="py-2">
                {detail.isVerified ? (
                  <span className="text-green-600 text-xs">✓</span>
                ) : (
                  <span className="text-orange-500 text-xs" title="User not yet registered on platform">⚠ Unverified</span>
                )}
              </td>
              <td className="py-2 text-xs text-gray-600">
                {detail.message || "-"}
              </td>
            </tr>
            )
          })}
          {details.length > 10 && (
            <tr>
              <td colSpan={5} className="py-2 text-gray-500 text-center">
                ... and {details.length - 10} more
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// Sub-component for Bulk Upload Section
function BulkUploadSection({
  isUploading,
  uploadError,
  uploadResult,
  onDownloadTemplate,
  onFileSelect,
  fileInputRef,
}: Readonly<{
  isUploading: boolean
  uploadError: string | null
  uploadResult: BulkUploadResult | null
  onDownloadTemplate: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}>) {
  const hasAddedEmployees = uploadResult && uploadResult.added > 0
  const resultContainerClass = hasAddedEmployees
    ? "bg-green-50 border border-green-200"
    : "bg-yellow-50 border border-yellow-200"

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Bulk Upload via CSV</h3>
            <p className="text-sm text-blue-700 mt-1">
              Upload multiple employees at once using a CSV file. Download the template to get started.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onDownloadTemplate}
        variant="outline"
        className="w-full gap-2"
      >
        <Download size={16} />
        Download CSV Template
      </Button>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">
          {isUploading ? "Uploading..." : "Click to upload or drag and drop your CSV file"}
        </p>
        <p className="text-xs text-gray-500">CSV files only</p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          variant="outline"
          className="mt-4"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Select File"
          )}
        </Button>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {uploadResult && (
        <div className={`rounded-lg p-4 ${resultContainerClass}`}>
          <div className="flex items-start gap-3">
            {hasAddedEmployees ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${hasAddedEmployees ? "text-green-900" : "text-yellow-900"}`}>
                {hasAddedEmployees 
                  ? `Successfully added ${uploadResult.added} employees` 
                  : "No employees were added"}
              </h4>
              
              {uploadResult.errors.length > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  {uploadResult.errors.length} errors occurred
                </p>
              )}

              <UploadResultsTable details={uploadResult.details} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Mode Toggle Component
function ModeToggle({
  mode,
  onChange,
}: Readonly<{
  mode: "single" | "bulk"
  onChange: (mode: "single" | "bulk") => void
}>) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onChange("single")}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          mode === "single"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Single Employee
      </button>
      <button
        onClick={() => onChange("bulk")}
        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
          mode === "bulk"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Bulk Upload (CSV)
      </button>
    </div>
  )
}

// Modal Header Component
function ModalHeader({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Add Employees</h2>
      </div>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X size={24} />
      </button>
    </div>
  )
}

// Modal Footer Component
function ModalFooter({
  mode,
  isSubmitDisabled,
  onSubmit,
  onDone,
}: Readonly<{
  mode: "single" | "bulk"
  isSubmitDisabled: boolean
  onSubmit: () => void
  onDone: () => void
}>) {
  return (
    <div className="p-6 border-t border-gray-200">
      {mode === "single" ? (
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitDisabled}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
        >
          Add Employee
        </Button>
      ) : (
        <Button 
          onClick={onDone}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Done
        </Button>
      )}
    </div>
  )
}

export function AddEmployeeModal({ onClose, onEmployeeAdded, organizationId }: Readonly<AddEmployeeModalProps>) {
  const [mode, setMode] = useState<"single" | "bulk">("single")
  const [step, setStep] = useState<"form" | "success">("form")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isResolvingUsername, setIsResolvingUsername] = useState(false)
  const [isAutofilled, setIsAutofilled] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    username: "",
    surname: "",
    firstname: "",
    walletAddress: "",
    role: "",
    salary: "",
    department: "",
    employeeId: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === "username") {
      setIsAutofilled(false)
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resolveUsername = async () => {
    const username = formData.username.trim()
    if (!username) return

    setIsResolvingUsername(true)
    try {
      const response = await apiFetch(`/api/users/search/${encodeURIComponent(username)}`)
      const user = response?.data?.user || response?.user
      if (!user) {
        throw new Error("User not found")
      }

      setFormData((prev) => ({
        ...prev,
        surname: user.surname || "",
        firstname: user.firstname || "",
        walletAddress: user.walletAddress || "",
      }))
      setIsAutofilled(true)
    } catch (err) {
      console.error("Failed to resolve username:", err)
      alert(err instanceof Error ? err.message : "Failed to resolve username")
      setIsAutofilled(false)
    } finally {
      setIsResolvingUsername(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.role || !formData.salary) {
      return
    }
    
    try {
      if (organizationId) {
        await apiFetch(`/api/organizations/${organizationId}/employees`, {
          method: "POST",
          body: JSON.stringify({
            username: formData.username,
            walletAddress: formData.walletAddress,
            surname: formData.surname,
            firstname: formData.firstname,
            jobRole: formData.role,
            salary: formData.salary,
            department: formData.department || "General",
            employeeId: formData.employeeId,
          }),
        })
      } else {
        addEmployeeToSession({
          username: formData.username,
          role: formData.role,
          salary: Number(formData.salary),
        })
      }
      
      if (onEmployeeAdded) {
        onEmployeeAdded()
      }
      
      setStep("success")
    } catch (err) {
      console.error("Failed to add employee:", err)
      alert(err instanceof Error ? err.message : "Failed to add employee")
    }
  }

  const downloadTemplate = async () => {
    try {
      if (!organizationId) {
        const template = `surname,firstname,walletAddress,jobRole,salary,department,employeeId
Doe,John,0x1234567890abcdef1234567890abcdef12345678,Software Engineer,500000,Engineering,EMP001`
        const blob = new Blob([template], { type: "text/csv" })
        const url = globalThis.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = "employee-template.csv"
        a.click()
        globalThis.URL.revokeObjectURL(url)
        return
      }

      const blob = await backendFetchBlob(`/api/organizations/${organizationId}/employees/template`)
      const url = globalThis.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "employee-template.csv"
      a.click()
      globalThis.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to download template:", err)
      alert("Failed to download template")
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      setUploadError("Please upload a CSV file")
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadResult(null)

    try {
      const csvData = await file.text()
      
      if (!organizationId) {
        setUploadError("Organization ID required for bulk upload")
        setIsUploading(false)
        return
      }

      const response = await apiFetch(`/api/organizations/${organizationId}/employees/bulk`, {
        method: "POST",
        body: JSON.stringify({ csvData }),
      })

      setUploadResult(response.data)
      
      if (response.data.added > 0 && onEmployeeAdded) {
        onEmployeeAdded()
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to process CSV")
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (step === "success") {
    return <AddEmployeeSuccessModal onClose={handleClose} />
  }

  const hasUsername = Boolean(formData.username.trim())
  const hasManualIdentity = Boolean(formData.walletAddress.trim()) && Boolean(formData.surname.trim()) && Boolean(formData.firstname.trim())
  const isSubmitDisabled = !formData.role || !formData.salary || (!hasUsername && !hasManualIdentity)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <ModalHeader onClose={handleClose} />

        <div className="px-6 pt-4">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        <div className="p-6">
          {mode === "single" ? (
            <SingleEmployeeForm
              formData={formData}
              onChange={handleInputChange}
              onResolveUsername={resolveUsername}
              isResolvingUsername={isResolvingUsername}
              isAutofilled={isAutofilled}
            />
          ) : (
            <BulkUploadSection
              isUploading={isUploading}
              uploadError={uploadError}
              uploadResult={uploadResult}
              onDownloadTemplate={downloadTemplate}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
            />
          )}
        </div>

        <ModalFooter
          mode={mode}
          isSubmitDisabled={isSubmitDisabled}
          onSubmit={handleSubmit}
          onDone={handleClose}
        />
      </div>
    </div>
  )
}
