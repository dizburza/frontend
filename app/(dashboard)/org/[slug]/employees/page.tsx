"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, Loader2, ChevronDown, Filter, X } from "lucide-react"
import { AddEmployeesDrawer } from "@/components/employees/add-employees-drawer"
import { ConfirmModal } from "@/components/employees/confirm-modal"
import { InviteLinkBar } from "@/components/employees/invite-link-bar"
import { EmployeeActions } from "@/components/employees/employee-actions"
import { PillButton } from "@/components/ui/pill-button"
import { SectionCard } from "@/components/dashboard/section-card"
import {
  mapApiEmployeeToEmployee,
  recordBootstrapSignerAdd,
  recordSignerChangeProposal,
  remindEmployee,
  removeOrganizationEmployee,
  reactivateOrganizationEmployee,
  updateOrganizationEmployee,
  useOrganizationBySlug,
  useOrganizationEmployees,
} from "@/lib/api/organization"
import useOrgSlug from "@/hooks/useOrgSlug"
import { useSignerManagement } from "@/hooks/useSignerManagement"
import useGetOrgTreasuryBalance from "@/hooks/ERC20/useGetOrgTreasuryBalance"
import { useToken } from "@/hooks/useToken"
import { useSessionIdentity } from "@/hooks/useSessionIdentity"

type Employee = ReturnType<typeof mapApiEmployeeToEmployee>

const HIGH_SALARY_THRESHOLD = 500_000

const shortAddress = (value: string) =>
  value && value.length >= 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value

export default function EmployeesPage() {
  const { symbol } = useToken()
  const { address } = useSessionIdentity()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState<"all" | "joined" | "pending" | "high-salary">("all")
  const [sortBy, setSortBy] = useState<"name" | "salary" | "date">("name")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const [editing, setEditing] = useState<Employee | null>(null)
  const [editDraft, setEditDraft] = useState({
    jobRole: "",
    salary: "",
    department: "",
    employeeId: "",
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const [pendingSuspend, setPendingSuspend] = useState<Employee | null>(null)
  const [pendingSigner, setPendingSigner] = useState<Employee | null>(null)
  const [pendingReminder, setPendingReminder] = useState<Employee | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [showSuspended, setShowSuspended] = useState(false)
  const [reactivatingUsername, setReactivatingUsername] = useState<string | null>(null)

  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false)
      }
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [])

  const orgSlug = useOrgSlug()
  const base = orgSlug ? `/org/${orgSlug}` : "/"
  const { data: organization, loading: orgLoading, refresh: refreshOrg } =
    useOrganizationBySlug(orgSlug)
  const {
    data: employeesData,
    loading: employeesLoading,
    error,
    refresh,
  } = useOrganizationEmployees(organization?.id || null)

  const treasuryBalance = useGetOrgTreasuryBalance()
  const signerManagement = useSignerManagement(organization?.contractAddress)

  const employees = useMemo(
    () => (employeesData?.employees ?? []).map(mapApiEmployeeToEmployee),
    [employeesData]
  )

  const totalEmployees = employeesData?.totalEmployees ?? 0
  const activeEmployees = useMemo(() => employees.filter((e) => e.isActive), [employees])
  const suspendedEmployees = useMemo(() => employees.filter((e) => !e.isActive), [employees])
  const joinedCount = activeEmployees.filter((e) => e.hasJoined).length
  const pendingCount = activeEmployees.length - joinedCount

  /** The name this signer is recorded under when they approve something. */
  const currentSignerName = useMemo(() => {
    const me = (organization?.signers ?? []).find(
      (s) => s.address.toLowerCase() === address
    )
    return me?.name || address || "Signer"
  }, [organization?.signers, address])

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    let rows = employees.filter(
      (e) =>
        e.surname.toLowerCase().includes(term) ||
        e.firstName.toLowerCase().includes(term) ||
        e.username.toLowerCase().includes(term) ||
        (e.email ?? "").toLowerCase().includes(term)
    )

    // Suspended rows have their own section below, findable there rather than
    // through this filter, so the main roster never shows them.
    rows = rows.filter((e) => e.isActive)

    if (filterBy === "joined") rows = rows.filter((e) => e.hasJoined)
    else if (filterBy === "pending") rows = rows.filter((e) => !e.hasJoined)
    else if (filterBy === "high-salary") {
      // The backend already formatted this into the human figure, so the
      // threshold is the amount the label promises.
      rows = rows.filter((e) => e.salary >= HIGH_SALARY_THRESHOLD)
    }

    const sorted = [...rows]
    if (sortBy === "name") sorted.sort((a, b) => a.surname.localeCompare(b.surname))
    else if (sortBy === "salary") sorted.sort((a, b) => b.salary - a.salary)
    else {
      sorted.sort((a, b) => {
        if (!a.joinedAt) return 1
        if (!b.joinedAt) return -1
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
      })
    }

    return sorted
  }, [employees, searchTerm, filterBy, sortBy])

  useEffect(() => {
    setPage(1)
  }, [organization?.id, searchTerm, filterBy, sortBy, limit])

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * limit
  const paginated = filtered.slice(startIndex, startIndex + limit)

  const openEdit = (employee: Employee) => {
    setEditing(employee)
    setEditDraft({
      jobRole: employee.role || "",
      salary: String(employee.salary || ""),
      department: employee.department || "",
      employeeId: employee.employeeId || "",
    })
  }

  const handleSaveEdit = async () => {
    if (!editing || !organization?.id) return

    setIsSavingEdit(true)
    try {
      await updateOrganizationEmployee(organization.id, editing.username, {
        jobRole: editDraft.jobRole,
        // Sent as the human figure. The backend scales it by the token's
        // decimals, which is the only place that knows the precision.
        salary: editDraft.salary.trim() || undefined,
        department: editDraft.department,
        employeeId: editDraft.employeeId,
      })
      setEditing(null)
      refresh()
      toast.success("Employee updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update employee")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleSuspend = async () => {
    if (!pendingSuspend || !organization?.id) return

    setIsWorking(true)
    try {
      await removeOrganizationEmployee(organization.id, pendingSuspend.username)
      setPendingSuspend(null)
      refresh()
      toast.success("Employee suspended")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suspend employee")
    } finally {
      setIsWorking(false)
    }
  }

  // No confirmation: undone by the same action, unlike a suspension, which
  // has consequences (payroll exclusion) that make a confirm step worth the
  // extra click.
  const handleReactivate = async (employee: Employee) => {
    if (!organization?.id) return

    setReactivatingUsername(employee.username)
    try {
      await reactivateOrganizationEmployee(organization.id, employee.username)
      refresh()
      toast.success(`${employee.firstName || "Employee"} reactivated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reactivate employee")
    } finally {
      setReactivatingUsername(null)
    }
  }

  const handleSendReminder = async () => {
    if (!pendingReminder || !organization?.id) return

    const membershipId = pendingReminder.membershipId
    if (!membershipId) {
      toast.error("This employee record cannot be reminded yet")
      return
    }

    setIsWorking(true)
    try {
      await remindEmployee(organization.id, membershipId)
      setPendingReminder(null)
      toast.success("Reminder sent")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send the reminder")
    } finally {
      setIsWorking(false)
    }
  }

  /**
   * Promotion is one call while the organization is still filling its declared
   * signer seats, and a quorum-gated proposal once it is constituted. The
   * contract enforces that either way; this only picks the call that will not
   * revert, and records the proposal so other signers can see it waiting.
   */
  /**
   * Exports what the filters are currently showing rather than the whole
   * roster, since the figure on screen is the one someone means to take away.
   */
  const handleExport = () => {
    if (filtered.length === 0) {
      toast.message("There is nothing to export")
      return
    }

    const quote = (value: string | number | null | undefined) => {
      const text = String(value ?? "")
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
    }

    const rows = [
      ["Surname", "First Name", "Email", "Phone", "Role", `Salary (${symbol || ""})`, "Username", "Wallet Address", "Status"],
      ...filtered.map((e) => [
        e.surname,
        e.firstName,
        e.email ?? "",
        e.phoneNumber ?? "",
        e.role ?? "",
        e.salary,
        e.username,
        e.walletAddress ?? "",
        e.hasJoined ? "Joined" : "Not Joined",
      ]),
    ]
      .map((row) => row.map(quote).join(","))
      .join("\n")

    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `${organization?.slug ?? "employees"}-employees.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleAddAsSigner = async () => {
    if (!pendingSigner || !organization?.id || !organization.contractAddress) return

    const subject = pendingSigner.walletAddress
    if (!subject) {
      toast.error("This employee has no wallet address yet")
      return
    }

    setIsWorking(true)
    try {
      const constituted = await signerManagement.isConstituted()

      if (constituted) {
        const { proposalId, signerEpoch } = await signerManagement.proposeSignerChange(
          subject,
          false
        )

        await recordSignerChangeProposal(organization.id, {
          proposalId,
          organizationAddress: organization.contractAddress,
          subjectAddress: subject,
          subjectName: `${pendingSigner.firstName} ${pendingSigner.surname}`.trim(),
          isRemoval: false,
          signerEpoch,
          createdByName: currentSignerName,
        })

        toast.success("Signer change proposed. It needs quorum approval to take effect.")
      } else {
        await signerManagement.addSigner(subject)
        await recordBootstrapSignerAdd(organization.id, {
          subjectAddress: subject,
          subjectName: `${pendingSigner.firstName} ${pendingSigner.surname}`.trim(),
        })
        toast.success("Signer added")
      }

      setPendingSigner(null)
      refresh()
      refreshOrg()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add this signer")
    } finally {
      setIsWorking(false)
    }
  }

  const filterOptions = [
    { value: "all", label: "All Employees" },
    { value: "joined", label: "Joined" },
    { value: "pending", label: "Pending Invitations" },
    { value: "high-salary", label: `High Salary (>=500k ${symbol})` },
  ]

  const sortOptions = [
    { value: "name", label: "Alphabet" },
    { value: "salary", label: "Salary (High to Low)" },
    { value: "date", label: "Join Date (Newest)" },
  ]

  const loading = orgLoading || employeesLoading

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center px-1 lg:px-10">
        <Loader2 className="size-8 animate-spin text-[#4F51D9]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-1 lg:px-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Failed to load employees: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-1 lg:px-10">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">
            <Link href={base} className="hover:underline">
              Dashboard
            </Link>{" "}
            &rsaquo; Employees
          </p>
          <h1 className="font-nohemi text-3xl text-gray-600 lg:text-4xl">Employees</h1>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <PillButton tone="primary" className="h-11" onClick={() => setShowAddEmployeeModal(true)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 8h8M8 4v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Add Employees
          </PillButton>
          <PillButton asChild tone="soft" className="h-11">
            <Link href={`${base}/payments`}>Create Batch Payment</Link>
          </PillButton>
          <PillButton tone="soft" className="h-11" onClick={handleExport}>
            Export
            <Image src="/icons/export.svg" alt="" width={16} height={16} className="size-4" />
          </PillButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg bg-white px-5 py-4 outline outline-[0.5px] -outline-offset-[0.5px] outline-zinc-100">
        <Stat label="Total Employees" value={String(totalEmployees)} icon="/icons/people.svg" />
        <Divider />
        <Stat label="Joined" value={String(joinedCount)} icon="/icons/briefcase.svg" />
        <Divider />
        <Stat label="Pending Invitations" value={String(pendingCount)} icon="/icons/note-2.svg" />
        <div className="ml-auto">
          <Stat
            label={`Available Balance (${symbol || "--"})`}
            value={
              treasuryBalance === null
                ? "--"
                : treasuryBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })
            }
            icon="/icons/bank.svg"
          />
        </div>
      </div>

      {organization?.id ? <InviteLinkBar organizationId={organization.id} /> : null}

      <SectionCard title="Employee's List">
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search employees by name, username..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Dropdown
              ref={filterRef}
              icon={<Filter size={14} />}
              prefix="Filters :"
              label={filterOptions.find((o) => o.value === filterBy)?.label ?? "All"}
              open={showFilterDropdown}
              onToggle={() => setShowFilterDropdown((v) => !v)}
              options={filterOptions}
              value={filterBy}
              onSelect={(v) => {
                setFilterBy(v as typeof filterBy)
                setShowFilterDropdown(false)
              }}
            />
            <Dropdown
              ref={sortRef}
              icon={<ArrowUpDown size={14} />}
              prefix="Sort :"
              label={sortOptions.find((o) => o.value === sortBy)?.label ?? "Alphabet"}
              open={showSortDropdown}
              onToggle={() => setShowSortDropdown((v) => !v)}
              options={sortOptions}
              value={sortBy}
              onSelect={(v) => {
                setSortBy(v as typeof sortBy)
                setShowSortDropdown(false)
              }}
            />
          </div>
        </div>

        <div>
          <table className="w-full table-fixed text-left">
            {/* Proportions from the design's fixed widths at a 1608px table. */}
            <colgroup>
              <col className="w-[3%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[12%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead>
              <tr className="border-y border-gray-100 bg-neutral-100">
                <Th>
                  <span className="text-sm font-semibold text-gray-800">#</span>
                </Th>
                <Th>SURNAME</Th>
                <Th>FIRST NAME</Th>
                <Th>EMAIL</Th>
                <Th>PHONE</Th>
                <Th>ROLE</Th>
                <Th className="text-center">SALARY ({symbol || "--"})</Th>
                <Th>USERNAME</Th>
                <Th>WALLET ADDRESS</Th>
                <Th className="text-right">ACTION</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-gray-500">
                    No employees found. Add your first employee to get started.
                  </td>
                </tr>
              ) : (
                paginated.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className="border-b border-gray-100 transition-colors hover:bg-surface-canvas"
                  >
                    <Td>
                      <span className="text-sm font-semibold text-gray-500">
                        {startIndex + index + 1}
                      </span>
                    </Td>
                    <Td>
                      <div className="truncate font-semibold text-neutral-500">
                        {employee.surname || "--"}
                      </div>
                    </Td>
                    <Td>
                      <div className="truncate font-semibold text-neutral-500">
                        {employee.firstName || "--"}
                      </div>
                    </Td>
                    <Td>
                      <div className="truncate font-semibold text-indigo-600">
                        {employee.email || "--"}
                      </div>
                    </Td>
                    <Td>
                      <div className="truncate font-semibold text-neutral-500">
                        {employee.phoneNumber || "--"}
                      </div>
                    </Td>
                    <Td>
                      {employee.isSigner ? (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-purple-100 px-3 py-2 text-xs font-medium leading-3 text-purple-700">
                          Signer
                        </span>
                      ) : (
                        <div className="truncate font-semibold text-neutral-500">
                          {employee.role}
                        </div>
                      )}
                    </Td>
                    <Td className="text-center font-semibold text-neutral-800">
                      {employee.salary.toLocaleString()}
                    </Td>
                    <Td>
                      {employee.hasJoined ? (
                        <div className="truncate font-semibold text-neutral-800">
                          {employee.displayUsername || employee.username
                            ? `@${employee.displayUsername || employee.username}`
                            : "--"}
                        </div>
                      ) : (
                        <Badge>Not Joined</Badge>
                      )}
                    </Td>
                    <Td>
                      {employee.walletAddress ? (
                        <div className="truncate font-semibold text-neutral-800">
                          {shortAddress(employee.walletAddress)}
                        </div>
                      ) : (
                        <Badge>Not Connected</Badge>
                      )}
                    </Td>
                    <Td>
                      <EmployeeActions
                        hasJoined={employee.hasJoined}
                        isSigner={employee.isSigner}
                        isActive={employee.isActive}
                        onEdit={() => openEdit(employee)}
                        onAddAsSigner={() => setPendingSigner(employee)}
                        onSendReminder={() => setPendingReminder(employee)}
                        onSuspend={() => setPendingSuspend(employee)}
                        onReactivate={() => handleReactivate(employee)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>
              Page {safePage} of {totalPages}
            </span>
            <span className="flex items-center gap-2">
              Rows:
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 rounded border border-gray-200 bg-white px-2 text-sm text-gray-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages}
              className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </SectionCard>

      {suspendedEmployees.length > 0 ? (
        <SectionCard title={`Suspended Employees (${suspendedEmployees.length})`}>
          <button
            type="button"
            onClick={() => setShowSuspended((v) => !v)}
            className="flex items-center gap-2 self-start text-sm font-medium text-neutral-600 hover:text-neutral-800"
          >
            <ChevronDown
              size={16}
              className={`transition-transform ${showSuspended ? "rotate-180" : ""}`}
            />
            {showSuspended ? "Hide" : "Show"}
          </button>

          {showSuspended ? (
            <div className="flex flex-col divide-y divide-gray-100">
              {suspendedEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-700">
                      {[employee.surname, employee.firstName].filter(Boolean).join(" ") ||
                        employee.username ||
                        "Unnamed"}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {employee.role} &middot;{" "}
                      {employee.walletAddress ? shortAddress(employee.walletAddress) : "--"}
                    </p>
                  </div>
                  <PillButton
                    tone="soft"
                    className="h-9 shrink-0 px-4"
                    disabled={reactivatingUsername === employee.username}
                    onClick={() => handleReactivate(employee)}
                  >
                    {reactivatingUsername === employee.username ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : null}
                    Reactivate
                  </PillButton>
                </div>
              ))}
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {showAddEmployeeModal && organization?.id ? (
        <AddEmployeesDrawer
          organizationId={organization.id}
          onClose={() => setShowAddEmployeeModal(false)}
          onAdded={refresh}
        />
      ) : null}

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="font-nohemi text-xl text-[#1D1E49]">Edit Employee</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <Field label="Username">
                <Input value={editing.displayUsername || editing.username || "--"} disabled />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Job Role">
                  <Input
                    value={editDraft.jobRole}
                    onChange={(e) => setEditDraft((d) => ({ ...d, jobRole: e.target.value }))}
                  />
                </Field>
                <Field label="Department">
                  <Input
                    value={editDraft.department}
                    onChange={(e) => setEditDraft((d) => ({ ...d, department: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label={`Salary (${symbol || "--"})`}>
                  <Input
                    type="number"
                    value={editDraft.salary}
                    onChange={(e) => setEditDraft((d) => ({ ...d, salary: e.target.value }))}
                  />
                </Field>
                <Field label="Employee ID">
                  <Input
                    value={editDraft.employeeId}
                    onChange={(e) => setEditDraft((d) => ({ ...d, employeeId: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6">
              <PillButton
                tone="primary"
                className="w-full"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? <Loader2 className="size-4 animate-spin" /> : null}
                Save Changes
              </PillButton>
            </div>
          </div>
        </div>
      ) : null}

      {pendingSuspend ? (
        <ConfirmModal
          icon={<Image src="/icons/glyphs-poly_user-comment.svg" alt="" width={56} height={56} />}
          title="Suspend employee?"
          body={
            <>
              {pendingSuspend.firstName || "This employee"} will no longer be eligible to receive
              payments from the organization while suspended.
            </>
          }
          confirmLabel="Yes, Suspend employee"
          tone="danger"
          busy={isWorking}
          onCancel={() => setPendingSuspend(null)}
          onConfirm={handleSuspend}
        />
      ) : null}

      {pendingSigner ? (
        <ConfirmModal
          icon={<Image src="/icons/fa6-solid_user-pen.svg" alt="" width={56} height={56} />}
          title="Add as signer"
          body={
            <>
              Are you sure you want to add {pendingSigner.firstName || "this employee"} as an
              authorized signer for this organization?
            </>
          }
          confirmLabel="Yes, Add Signer"
          busy={isWorking}
          onCancel={() => setPendingSigner(null)}
          onConfirm={handleAddAsSigner}
        />
      ) : null}

      {pendingReminder ? (
        <ConfirmModal
          icon={<Image src="/icons/emojione-v1_bell.svg" alt="" width={56} height={56} />}
          title="Send reminder?"
          body={
            <>
              We will try to email{" "}
              <span className="font-semibold text-neutral-800">{pendingReminder.email}</span>.
              Delivery is limited at the moment, so copy the invitation link above the list and
              send it yourself if it does not arrive.
            </>
          }
          confirmLabel="Yes, Send Reminder"
          busy={isWorking}
          onCancel={() => setPendingReminder(null)}
          onConfirm={handleSendReminder}
        />
      ) : null}
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <span className="flex items-start gap-2">
      <span className="flex size-6 shrink-0 items-center justify-center bg-white outline outline-[0.75px] -outline-offset-[0.75px] outline-indigo-50">
        <Image src={icon} alt="" width={14} height={14} className="size-3.5" />
      </span>
      <span className="flex items-center gap-1">
        <span className="font-nohemi text-[10px] text-gray-500">{label} :</span>
        <span className="font-bricolage text-xl font-bold text-[#1D1E49]">{value}</span>
      </span>
    </span>
  )
}

function Divider() {
  return <span className="hidden h-6 w-px bg-neutral-200 sm:block" />
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-100 px-3 py-2 text-xs font-medium leading-3 text-gray-500">
      {children}
    </span>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`truncate px-1.5 py-3 text-[11px] font-normal tracking-tight text-neutral-600 ${className}`}
    >
      {children}
    </th>
  )
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-1.5 py-4 text-xs leading-4 ${className}`}>{children}</td>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

type DropdownProps = {
  icon: React.ReactNode
  prefix: string
  label: string
  open: boolean
  onToggle: () => void
  options: { value: string; label: string }[]
  value: string
  onSelect: (value: string) => void
}

const Dropdown = ({
  ref,
  icon,
  prefix,
  label,
  open,
  onToggle,
  options,
  value,
  onSelect,
}: DropdownProps & { ref: React.RefObject<HTMLDivElement | null> }) => (
  <div className="relative" ref={ref}>
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      {icon}
      <span className="text-neutral-500">{prefix}</span>
      {label}
      <ChevronDown size={14} />
    </button>
    {open ? (
      <div className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#EEF0FC] ${
              value === option.value ? "bg-[#EEF0FC] text-[#4F51D9]" : "text-neutral-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    ) : null}
  </div>
)
