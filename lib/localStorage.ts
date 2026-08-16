// Utility functions for managing localStorage data during a session
// This will be lost after page refresh since there's no backend

import { mockEmployees, mockOrganizations } from "./static/mock-data"

const canUseLocalStorage = () => globalThis.window !== undefined && globalThis.localStorage !== undefined

// Get session data with fallback to mock data
export function getSessionEmployees() {
  if (!canUseLocalStorage()) return mockEmployees.list
  const stored = localStorage.getItem("sessionEmployees")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return mockEmployees.list
    }
  }
  return mockEmployees.list
}


export function getSessionSigners() {
  if (!canUseLocalStorage()) return mockOrganizations.current.signers
  const stored = localStorage.getItem("sessionSigners")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return mockOrganizations.current.signers
    }
  }
  return mockOrganizations.current.signers
}

// Get session payment batches
export function getSessionPaymentBatches() {
  if (!canUseLocalStorage()) return []
  const stored = localStorage.getItem("sessionPaymentBatches")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

// Add new employee to session
export function addEmployeeToSession(employee: {
  username: string
  role: string
  salary: number
}) {
  if (!canUseLocalStorage()) return mockEmployees.list
  const employees = getSessionEmployees()
  const newEmployee = {
    id: `emp_${Date.now()}`,
    surname: employee.username.split("_")[0],
    firstName: employee.username.split("_")[1] || "",
    username: employee.username,
    walletAddress: `0x${Math.random().toString(16).substring(2, 10)}...`,
    role: employee.role,
    salary: Number(employee.salary),
    status: "active" as const,
    department: employee.role,
  }
  const updatedEmployees = [...employees, newEmployee]
  localStorage.setItem("sessionEmployees", JSON.stringify(updatedEmployees))
  return updatedEmployees
}

// Add signers to session
export function addSignersToSession(signers: Array<{
  id: string
  name: string
  username: string
  role: string
  avatar: string
}>) {
  if (!canUseLocalStorage()) return []
  const updatedSigners = signers.map((s) => ({
    ...s,
    status: "active" as const,
    walletAddress: `0x${Math.random().toString(16).substring(2, 10)}...`,
  }))
  localStorage.setItem("sessionSigners", JSON.stringify(updatedSigners))
  return updatedSigners
}

// Update signer in organization
export function updateOrganizationSigners(signers: Array<{
  id: string
  username: string
  fullName: string
  role: string
  status: string
  walletAddress: string
}>) {
  if (!canUseLocalStorage()) return signers
  localStorage.setItem("sessionOrganizationSigners", JSON.stringify(signers))
  return signers
}

// Get organization signers with fallback
export function getOrganizationSigners() {
  if (!canUseLocalStorage()) return mockOrganizations.current.signers
  const stored = localStorage.getItem("sessionOrganizationSigners")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return mockOrganizations.current.signers
    }
  }
  return mockOrganizations.current.signers
}

// Reset all session data
export function resetSessionData() {
  if (!canUseLocalStorage()) return
  localStorage.removeItem("sessionEmployees")
  localStorage.removeItem("sessionSigners")
  localStorage.removeItem("sessionOrganizationSigners")
  localStorage.removeItem("sessionPaymentBatches")
}
