"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import {
  addEmployees,
  reviewEmployees,
  type EmployeeSeed,
  type SeedResults,
} from "@/lib/api/organization"
import { useToken } from "@/hooks/useToken"

type Mode = "manual" | "csv"
type Stage = "choose" | "manual" | "upload" | "review" | "done"

interface AddEmployeesDrawerProps {
  organizationId: string
  onClose: () => void
  /** Fires once anything was actually written, so the roster can refetch. */
  onAdded: () => void
}

const EMPTY: EmployeeSeed = {
  surname: "",
  firstname: "",
  email: "",
  phone: "",
  jobRole: "",
  salary: "",
}

export function AddEmployeesDrawer({
  organizationId,
  onClose,
  onAdded,
}: Readonly<AddEmployeesDrawerProps>) {
  const { symbol } = useToken()

  const [mode, setMode] = useState<Mode>("manual")
  const [stage, setStage] = useState<Stage>("choose")
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState<EmployeeSeed>(EMPTY)
  const [csv, setCsv] = useState<{ name: string; text: string } | null>(null)
  const [review, setReview] = useState<SeedResults | null>(null)
  const [result, setResult] = useState<SeedResults | null>(null)

  const fileInput = useRef<HTMLInputElement>(null)

  const set = (field: keyof EmployeeSeed) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const manualReady =
    form.surname.trim() && form.firstname.trim() && form.email.trim() && form.jobRole.trim() && form.salary.trim()

  const handleContinue = () => setStage(mode === "manual" ? "manual" : "upload")

  const handleTemplate = () => {
    // Built here rather than fetched: the columns are the contract, and a
    // download should not fail because the API is briefly unreachable.
    const rows = [
      "surname,firstname,email,phone,jobRole,salary",
      "Adeoye,Adetola,adetola@example.com,+2348012345678,HR Manager,500000",
    ].join("\n")

    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "employee-template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Upload a CSV file")
      return
    }

    const text = await file.text()
    setCsv({ name: file.name, text })
    setBusy(true)

    try {
      setReview(await reviewEmployees(organizationId, { csvData: text }))
      setStage("review")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file")
      setCsv(null)
    } finally {
      setBusy(false)
    }
  }

  const handleSubmit = async () => {
    setBusy(true)

    try {
      const payload = csv ? { csvData: csv.text } : { employees: [form] }
      const outcome = await addEmployees(organizationId, payload)

      // A file where every row failed wrote nothing, so it stays on the review
      // rather than claiming success.
      if (outcome.added === 0) {
        setReview(outcome)
        setStage("review")
        toast.error("Nothing was added. Check the rows marked below.")
        return
      }

      setResult(outcome)
      setStage("done")
      onAdded()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add employees")
    } finally {
      setBusy(false)
    }
  }

  const back = () => {
    if (stage === "review") setStage(csv ? "upload" : "manual")
    else setStage("choose")
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <aside className="flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {stage !== "choose" && stage !== "done" ? (
              <button
                type="button"
                onClick={back}
                disabled={busy}
                aria-label="Back"
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : null}
            <h2 className="font-inter text-base font-medium text-zinc-800">Add Employees</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {stage === "choose" ? (
            <ChooseMode mode={mode} onChange={setMode} onTemplate={handleTemplate} />
          ) : null}

          {stage === "manual" ? (
            <ManualForm form={form} onChange={set} symbol={symbol} />
          ) : null}

          {stage === "upload" ? (
            <UploadCsv
              fileName={csv?.name}
              busy={busy}
              inputRef={fileInput}
              onPick={() => fileInput.current?.click()}
              onFile={handleFile}
            />
          ) : null}

          {stage === "review" && review ? <ReviewList results={review} symbol={symbol} /> : null}

          {stage === "done" && result ? <Done results={result} /> : null}
        </div>

        <footer className="border-t border-gray-100 px-6 py-4">
          {stage === "choose" ? (
            <Actions onCancel={onClose} onConfirm={handleContinue} confirmLabel="Continue" />
          ) : null}

          {stage === "manual" ? (
            <Actions
              onCancel={onClose}
              onConfirm={handleSubmit}
              confirmLabel="Add Employees"
              busy={busy}
              disabled={!manualReady}
            />
          ) : null}

          {stage === "review" && review ? (
            <Actions
              onCancel={onClose}
              onConfirm={handleSubmit}
              confirmLabel="Add Employees"
              busy={busy}
              disabled={review.added === 0}
            />
          ) : null}

          {stage === "done" ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-[4px] bg-[#4F51D9] px-4 py-3 font-inter text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Done
            </button>
          ) : null}
        </footer>
      </aside>
    </div>
  )
}

function Actions({
  onCancel,
  onConfirm,
  confirmLabel,
  busy = false,
  disabled = false,
}: Readonly<{
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  busy?: boolean
  disabled?: boolean
}>) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="flex-1 rounded-[4px] bg-[#F7F8FE] px-4 py-3 font-inter text-sm font-medium text-blue-950 transition-colors hover:bg-indigo-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={busy || disabled}
        className="flex flex-1 items-center justify-center gap-2 rounded-[4px] bg-[#4F51D9] px-4 py-3 font-inter text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {confirmLabel}
      </button>
    </div>
  )
}

function ChooseMode({
  mode,
  onChange,
  onTemplate,
}: Readonly<{ mode: Mode; onChange: (mode: Mode) => void; onTemplate: () => void }>) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="font-inter text-sm font-medium text-zinc-800">Add Employees</h3>
        <p className="font-inter text-xs text-neutral-500">
          Choose how you&rsquo;d like to add employees to your organization.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ModeCard
          title="Add Manually"
          hint="Add one employee at a time with their details."
          icon="/icons/add-manually-icon.svg"
          selected={mode === "manual"}
          onSelect={() => onChange("manual")}
        />
        <ModeCard
          title="Upload CSV"
          hint="Add multiple employees at once using our template."
          icon="/icons/upload-csv-icon.svg"
          selected={mode === "csv"}
          onSelect={() => onChange("csv")}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg bg-[#F7F8FE] p-4">
        <div className="flex items-start gap-3">
          <Image src="/icons/glyphs-poly_user-comment.svg" alt="" width={28} height={28} />
          <div className="flex flex-col">
            <p className="font-inter text-xs font-medium text-zinc-800">
              Need the CSV Template?
            </p>
            <p className="font-inter text-[11px] text-neutral-500">
              Download our CSV template to see the required fields.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onTemplate}
          className="shrink-0 font-inter text-xs font-medium text-[#4F51D9] hover:underline"
        >
          Download Template
        </button>
      </div>
    </div>
  )
}

function ModeCard({
  title,
  hint,
  icon,
  selected,
  onSelect,
}: Readonly<{
  title: string
  hint: string
  icon: string
  selected: boolean
  onSelect: () => void
}>) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col gap-3 rounded-lg border p-4 text-left transition-colors ${
        selected ? "border-[#4F51D9] bg-[#F7F8FE]" : "border-gray-200 bg-white hover:bg-neutral-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-inter text-xs font-medium text-zinc-800">{title}</span>
        <span
          className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-[#4F51D9]" : "border-gray-300"
          }`}
        >
          {selected ? <span className="size-2 rounded-full bg-[#4F51D9]" /> : null}
        </span>
      </div>
      <p className="font-inter text-[11px] leading-4 text-neutral-500">{hint}</p>
      <Image src={icon} alt="" width={120} height={80} className="mt-1 h-20 w-full object-contain" />
    </button>
  )
}

function ManualForm({
  form,
  onChange,
  symbol,
}: Readonly<{
  form: EmployeeSeed
  onChange: (field: keyof EmployeeSeed) => (value: string) => void
  symbol: string
}>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-inter text-sm font-medium text-zinc-800">Add Employees Manually</h3>
        <p className="font-inter text-xs text-neutral-500">
          Enter the employee&rsquo;s details, then share the invitation link with them.
        </p>
      </div>

      <Field label="First Name" value={form.firstname} onChange={onChange("firstname")} placeholder="Enter first name" />
      <Field label="Last Name" value={form.surname} onChange={onChange("surname")} placeholder="Enter last name" />
      <Field label="Email" type="email" value={form.email} onChange={onChange("email")} placeholder="Enter email address" />
      <Field label="Phone Number" value={form.phone ?? ""} onChange={onChange("phone")} placeholder="Enter phone number" />
      <Field label="Job title / Role" value={form.jobRole} onChange={onChange("jobRole")} placeholder="Enter job title / role" />
      <Field
        label={`Salary${symbol ? ` (${symbol})` : ""}`}
        type="number"
        value={form.salary}
        onChange={onChange("salary")}
        placeholder="Enter salary"
      />
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: Readonly<{
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-inter text-xs font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-inter text-sm text-zinc-800 outline-none placeholder:text-gray-400 focus:border-[#4F51D9]"
      />
    </label>
  )
}

function UploadCsv({
  fileName,
  busy,
  inputRef,
  onPick,
  onFile,
}: Readonly<{
  fileName?: string
  busy: boolean
  inputRef: React.RefObject<HTMLInputElement | null>
  onPick: () => void
  onFile: (file: File | undefined) => void
}>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h3 className="font-inter text-sm font-medium text-zinc-800">Upload Employee List</h3>
        <p className="font-inter text-xs text-neutral-500">
          Upload a CSV file containing your employees.
        </p>
      </div>

      <button
        type="button"
        onClick={onPick}
        disabled={busy}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onFile(e.dataTransfer.files?.[0])
        }}
        className="flex flex-col items-center justify-center gap-2 rounded-lg bg-[#F7F8FE] px-6 py-10 transition-colors hover:bg-indigo-50 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-7 animate-spin text-[#4F51D9]" />
        ) : (
          <Image src="/icons/gallery-add.svg" alt="" width={28} height={28} />
        )}
        <p className="font-inter text-xs text-neutral-600">
          {fileName ?? (
            <>
              Drop file here or <span className="font-medium text-[#4F51D9]">Upload</span>
            </>
          )}
        </p>
        <p className="font-inter text-[11px] text-gray-400">
          Supported format &middot; CSV file. Max size 150MB.
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  )
}

function ReviewList({ results, symbol }: Readonly<{ results: SeedResults; symbol: string }>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-inter text-sm font-medium text-zinc-800">Review Employee List</h3>
        <p className="font-inter text-xs text-neutral-500">
          We found {results.details.length} {results.details.length === 1 ? "employee" : "employees"} in your file.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100">
              <Th>#</Th>
              <Th>SURNAME</Th>
              <Th>FIRST NAME</Th>
              <Th>EMAIL</Th>
              <Th>PHONE</Th>
              <Th>ROLE</Th>
              <Th className="text-right">SALARY ({symbol || "--"})</Th>
              <Th>STATUS</Th>
            </tr>
          </thead>
          <tbody>
            {results.details.map((row) => (
              <tr key={`${row.row}-${row.email}`} className="border-b border-gray-50">
                <Td>{row.row}</Td>
                <Td>{row.surname || "-"}</Td>
                <Td>{row.firstname || "-"}</Td>
                <Td className="text-indigo-600">{row.email || "-"}</Td>
                <Td>{row.phone || "-"}</Td>
                <Td>{row.jobRole || "-"}</Td>
                <Td className="text-right">{formatAmount(row.salary)}</Td>
                <Td>
                  <StatusPill status={row.status} message={row.message} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Grouping only says how many, never which: a row that cannot be added is
 * marked in the table so the person fixing the file can find it.
 */
function StatusPill({
  status,
  message,
}: Readonly<{ status: SeedOutcomeStatus; message?: string }>) {
  const tone =
    status === "added"
      ? "bg-green-50 text-green-600"
      : "bg-red-50 text-red-500"

  const label = status === "added" ? "Completed" : (message ?? "Missing info")

  return (
    <span
      title={message}
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 font-inter text-[10px] font-medium ${tone}`}
    >
      {label}
    </span>
  )
}

type SeedOutcomeStatus = SeedResults["details"][number]["status"]

function Th({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <th className={`px-2 py-2 font-inter text-[10px] font-normal uppercase tracking-wide text-neutral-600 ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = "" }: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <td className={`px-2 py-3 font-inter text-[11px] font-medium text-neutral-600 ${className}`}>
      {children}
    </td>
  )
}

/** Only for display, and only ever a figure the person typed themselves. */
function formatAmount(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed.toLocaleString() : value || "-"
}

function Done({ results }: Readonly<{ results: SeedResults }>) {
  const many = results.added !== 1

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <Image src="/icons/ph_seal-check-fill.svg" alt="" width={96} height={96} />

      <div className="flex flex-col gap-1">
        <h3 className="font-nohemi text-2xl text-blue-950">
          {many ? "Employees added" : "Employee added"}
        </h3>
        <p className="font-inter text-sm text-neutral-500">
          {results.added} {many ? "employees have" : "employee has"} been added successfully.
        </p>
      </div>

      <div className="w-full rounded-lg bg-[#F7F8FE] p-4 text-left">
        <div className="mb-2 flex items-center gap-2">
          <Image src="/icons/linear_copy.svg" alt="" width={16} height={16} />
          <span className="font-inter text-xs font-medium text-zinc-800">Share the join link</span>
        </div>
        <p className="font-inter text-[11px] leading-4 text-neutral-500">
          Copy the invitation link above the employee list and send it to them yourself. Email
          delivery is limited at the moment, so the link is the reliable way in.
        </p>
        <p className="mt-2 font-inter text-[11px] leading-4 text-neutral-500">
          Employees will appear as Pending until they join the organization and complete their
          account setup.
        </p>
      </div>

      {results.skipped + results.failed > 0 ? (
        <p className="font-inter text-[11px] text-neutral-500">
          {results.skipped > 0 ? `${results.skipped} skipped` : null}
          {results.skipped > 0 && results.failed > 0 ? " · " : null}
          {results.failed > 0 ? `${results.failed} could not be added` : null}
        </p>
      ) : null}
    </div>
  )
}
