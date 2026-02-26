"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowUpDown, Loader2, ChevronDown, Copy, Check, X, Pencil, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddEmployeeModal } from "@/components/employees/add-employee-modal"
import { 
  useOrganizationBySlug, 
  useOrganizationEmployees,
  mapApiEmployeeToEmployee,
  updateOrganizationEmployee,
  removeOrganizationEmployee 
} from "@/lib/api/organization"
import useOrgSlug from "@/hooks/useOrgSlug"

// Helper component for copyable wallet address
function WalletAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)
  
  const shortenAddress = (addr: string) => {
    if (!addr || addr.length < 12) return addr
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{shortenAddress(address)}</span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Copy full address"
      >
        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
      </button>
    </div>
  )
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "new" | "high-salary">("all")
  const [sortBy, setSortBy] = useState<"name" | "salary" | "date">("name")
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
  const [pendingDeleteUsername, setPendingDeleteUsername] = useState<string | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<null | {
    id: string
    username: string
    jobRole: string
    salary: string
    department?: string
    employeeId?: string
    isSigner: boolean
  }>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const orgSlug = useOrgSlug()
  const { data: organization, loading: orgLoading } = useOrganizationBySlug(orgSlug)
  const { data: employeesData, loading: employeesLoading, error, refresh } = useOrganizationEmployees(organization?._id || null)

  const employees = employeesData?.employees?.map(mapApiEmployeeToEmployee) || []
  const totalEmployees = employeesData?.totalEmployees || 0

  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  useEffect(() => {
    if (!employeesLoading && employeesData) {
      setLastUpdatedAt(new Date())
    }
  }, [employeesLoading, employeesData])

  let lastUpdatedText = "-"
  if (employeesLoading) {
    lastUpdatedText = "updating ..."
  } else if (lastUpdatedAt) {
    lastUpdatedText = lastUpdatedAt.toLocaleString()
  }

  // Calculate stats from real data
  const totalSalaryPayout = employees.reduce((sum, emp) => sum + emp.salary, 0)
  const newEmployeesCount = employees.filter(emp => {
    if (!emp.joinedAt) return false
    const joinedDate = new Date(emp.joinedAt)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return joinedDate > oneMonthAgo
  }).length

  const stats = [
    { 
      label: "Total Salary Payout (cNGN)", 
      value: totalSalaryPayout.toLocaleString(),
      lastUpdated: lastUpdatedText,
    },
    { 
      label: "Total Employees", 
      value: totalEmployees.toString(), 
    },
    { 
      label: "New Employees", 
      value: newEmployeesCount.toString(), 
      lastUpdated: "" 
    },
    { 
      label: "Proposal Contributors", 
      value: "0", 
    },
  ]

  // Filter employees based on selected filter
  const getFilteredEmployees = () => {
    let filtered = employees.filter(
      (emp) =>
        emp.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.username.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Apply filter
    if (filterBy === "new") {
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
      filtered = filtered.filter(emp => {
        if (!emp.joinedAt) return false
        return new Date(emp.joinedAt) > oneMonthAgo
      })
    } else if (filterBy === "high-salary") {
      filtered = filtered.filter(emp => emp.salary >= 500) // 500k cNGN / 1000 = 500 (display value)
    }

    // Apply sort
    const sorted = [...filtered]
    if (sortBy === "name") {
      sorted.sort((a, b) => a.surname.localeCompare(b.surname))
    } else if (sortBy === "salary") {
      sorted.sort((a, b) => b.salary - a.salary)
    } else if (sortBy === "date") {
      sorted.sort((a, b) => {
        if (!a.joinedAt) return 1
        if (!b.joinedAt) return -1
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      })
    }

    return sorted
  }

  const filteredEmployees = getFilteredEmployees()

  const renderLastUpdatedBy = (employee: { lastAudit?: { performedByUsername?: string; performedByWalletAddress?: string; createdAt?: string } | null }) => {
    if (employee.lastAudit?.performedByUsername) {
      return (
        <div className="text-sm">
          <div className="font-medium text-gray-900">@{employee.lastAudit.performedByUsername}</div>
          {employee.lastAudit.createdAt ? (
            <div className="text-xs text-gray-500">{new Date(employee.lastAudit.createdAt).toLocaleString()}</div>
          ) : null}
        </div>
      )
    }

    if (employee.lastAudit?.performedByWalletAddress) {
      return (
        <div className="text-sm">
          <div className="font-medium text-gray-900 font-mono">{employee.lastAudit.performedByWalletAddress.slice(0, 6)}...{employee.lastAudit.performedByWalletAddress.slice(-4)}</div>
          {employee.lastAudit.createdAt ? (
            <div className="text-xs text-gray-500">{new Date(employee.lastAudit.createdAt).toLocaleString()}</div>
          ) : null}
        </div>
      )
    }

    return <span className="text-gray-400">-</span>
  }

  const filterOptions = [
    { value: "all", label: "All Employees" },
    { value: "new", label: "New Employees (Last 30 days)" },
    { value: "high-salary", label: "High Salary (≥500k cNGN)" },
  ]

  const sortOptions = [
    { value: "name", label: "Name (A-Z)" },
    { value: "salary", label: "Salary (High to Low)" },
    { value: "date", label: "Join Date (Newest)" },
  ]

  const getFilterLabel = () => filterOptions.find(opt => opt.value === filterBy)?.label || "All Employees"
  const getSortLabel = () => sortOptions.find(opt => opt.value === sortBy)?.label || "Name"

  const toChainSalary = (humanSalary: string) => {
    const trimmed = (humanSalary || "").trim()
    if (!trimmed) return undefined

    try {
      const asNumber = Number(trimmed)
      if (!Number.isFinite(asNumber)) return trimmed
      return String(Math.round(asNumber * 1_000_000))
    } catch {
      return trimmed
    }
  }

  const handleEmployeeAdded = () => {
    refresh()
    setShowAddEmployeeModal(false)
  }

  const handleSaveEdit = async () => {
    if (!editingEmployee || !organization?._id) return
    if (editingEmployee.isSigner) return

    setIsSavingEdit(true)
    try {
      await updateOrganizationEmployee(organization._id, editingEmployee.username, {
        jobRole: editingEmployee.jobRole,
        salary: toChainSalary(editingEmployee.salary),
        department: editingEmployee.department,
        employeeId: editingEmployee.employeeId,
      })
      setEditingEmployee(null)
      refresh()
      toast.success("Employee updated")
    } catch (err) {
      console.error("Failed to update employee:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update employee")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDeleteEmployee = async (username: string) => {
    if (!organization?._id) return

    setIsDeleting(true)
    try {
      await removeOrganizationEmployee(organization._id, username)
      refresh()
      toast.success("Employee removed")
    } catch (err) {
      console.error("Failed to remove employee:", err)
      toast.error(err instanceof Error ? err.message : "Failed to remove employee")
    } finally {
      setIsDeleting(false)
    }
  }

  const loading = orgLoading || employeesLoading

  if (loading) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load employees: {error}</p>
          <Button onClick={refresh} className="mt-2" variant="outline">Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Employee</h2>
              <button onClick={() => setEditingEmployee(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-employee-username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <Input id="edit-employee-username" value={editingEmployee.username} disabled className="w-full" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-employee-jobRole" className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
                  <Input
                    id="edit-employee-jobRole"
                    value={editingEmployee.jobRole}
                    onChange={(e) =>
                      setEditingEmployee((prev) =>
                        prev
                          ? {
                              ...prev,
                              jobRole: e.target.value,
                            }
                          : prev
                      )
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="edit-employee-department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <Input
                    id="edit-employee-department"
                    value={editingEmployee.department || ""}
                    onChange={(e) =>
                      setEditingEmployee((prev) =>
                        prev
                          ? {
                              ...prev,
                              department: e.target.value,
                            }
                          : prev
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-employee-salary" className="block text-sm font-medium text-gray-700 mb-1">Salary (cNGN)</label>
                  <Input
                    id="edit-employee-salary"
                    type="number"
                    value={editingEmployee.salary}
                    onChange={(e) =>
                      setEditingEmployee((prev) =>
                        prev
                          ? {
                              ...prev,
                              salary: e.target.value,
                            }
                          : prev
                      )
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="edit-employee-employeeId" className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <Input
                    id="edit-employee-employeeId"
                    value={editingEmployee.employeeId || ""}
                    onChange={(e) =>
                      setEditingEmployee((prev) =>
                        prev
                          ? {
                              ...prev,
                              employeeId: e.target.value,
                            }
                          : prev
                      )
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <Button
                onClick={handleSaveEdit}
                disabled={isSavingEdit || editingEmployee.isSigner}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSavingEdit ? (
                  <span className="inline-flex items-center"><Loader2 size={16} className="animate-spin mr-2" />Saving...</span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteUsername && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Remove Employee</h2>
              <button onClick={() => setPendingDeleteUsername(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-gray-700">Are you sure you want to remove this employee from the organization?</p>
              <p className="text-sm text-gray-900 font-medium">@{pendingDeleteUsername}</p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingDeleteUsername(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const username = pendingDeleteUsername
                  setPendingDeleteUsername(null)
                  await handleDeleteEmployee(username)
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <span className="inline-flex items-center"><Loader2 size={16} className="animate-spin mr-2" />Removing...</span>
                ) : (
                  "Remove"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Dashboard › Employees</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employees</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddEmployeeModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            + Add Employees
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent">
            Export
            <ArrowUpDown size={16} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            {stat.lastUpdated && <p className="text-xs text-gray-500 mt-2">Last updated: {stat.lastUpdated}</p>}
          </Card>
        ))}
      </div>

      {/* Employees List */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Employee&apos;s List</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search for Employee"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 relative">
            {/* Filter Dropdown */}
            <div className="relative" ref={filterRef}>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-transparent"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Filter size={16} />
                {getFilterLabel()}
                <ChevronDown size={14} />
              </Button>
              {showFilterDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterBy(option.value as typeof filterBy)
                        setShowFilterDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        filterBy === option.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-transparent"
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <ArrowUpDown size={16} />
                {getSortLabel()}
                <ChevronDown size={14} />
              </Button>
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as typeof sortBy)
                        setShowSortDropdown(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        sortBy === option.value ? "bg-blue-50 text-blue-600" : "text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>SURNAME</TableHead>
                <TableHead>FIRST NAME</TableHead>
                <TableHead>USERNAME</TableHead>
                <TableHead>WALLET ADDRESS</TableHead>
                <TableHead>ROLE</TableHead>
                <TableHead>SALARY (cNGN)</TableHead>
                <TableHead>LAST UPDATED BY</TableHead>
                <TableHead className="w-12">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-gray-500">
                    No employees found. Add your first employee to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                    <TableCell className="text-gray-700">{employee.surname}</TableCell>
                    <TableCell className="text-gray-700">{employee.firstName}</TableCell>
                    <TableCell className="text-gray-700">{employee.username}</TableCell>
                    <TableCell className="text-gray-700">
                      <WalletAddress address={employee.walletAddress} />
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {employee.isSigner ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          Signer
                        </span>
                      ) : (
                        <span className="text-gray-600">{employee.role}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-900 font-medium">{employee.salary.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-700">
                      {renderLastUpdatedBy(employee)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title={employee.isSigner ? "Signers cannot be edited" : "Edit"}
                          onClick={() => {
                            setEditingEmployee({
                              id: employee.id,
                              username: employee.username,
                              jobRole: employee.role,
                              salary: String(employee.salary || ""),
                              department: employee.department,
                              employeeId: employee.employeeId,
                              isSigner: employee.isSigner,
                            })
                          }}
                          disabled={employee.isSigner}
                        >
                          <Pencil size={16} className="text-gray-600" />
                        </button>
                        <button
                          type="button"
                          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                          title={employee.isSigner ? "Signers cannot be removed" : "Remove"}
                          onClick={() => setPendingDeleteUsername(employee.username)}
                          disabled={employee.isSigner || isDeleting}
                        >
                          <Trash2 size={16} className={employee.isSigner ? "text-gray-400" : "text-red-600"} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showAddEmployeeModal && (
        <AddEmployeeModal 
          organizationId={organization?._id}
          onClose={() => setShowAddEmployeeModal(false)} 
          onEmployeeAdded={handleEmployeeAdded}
        />
      )}
    </div>
  )
}
