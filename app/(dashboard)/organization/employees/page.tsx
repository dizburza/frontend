"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddEmployeeModal } from "@/components/employees/add-employee-modal"
import { getSessionEmployees } from "@/lib/localStorage"

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBy, setFilterBy] = useState("New Employees")
  const [sortBy, setSortBy] = useState("Date")
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false)
  const [employees, setEmployees] = useState(getSessionEmployees())

  // Refresh employees when modal closes after adding
  const handleEmployeeAdded = () => {
    setEmployees(getSessionEmployees())
  }

  const stats = [
    { label: "Total Salary Payout", value: "5,820,000", unit: "cNGN", lastUpdated: "1 min ago" },
    { label: "Total Employees", value: employees.length.toString(), lastUpdated: "1 min ago" },
    { label: "New Employees", value: "2", change: "+2 than last month", lastUpdated: "" },
    { label: "Proposal Contributors", value: "3", lastUpdated: "1 min ago" },
  ]

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">Dashboard › Employees</p>
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
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
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            {stat.unit && <p className="text-xs text-gray-500 mt-1">{stat.unit}</p>}
            {stat.change && <p className="text-xs text-green-600 mt-1">▲ {stat.change}</p>}
            {stat.lastUpdated && <p className="text-xs text-gray-500 mt-2">Last updated: {stat.lastUpdated}</p>}
          </Card>
        ))}
      </div>

      {/* Employees List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Employee&apos;s List</h3>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search for Employee"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Filter size={16} />
            Filters: {filterBy}
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <ArrowUpDown size={16} />
            Sort: {sortBy}
          </Button>
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
                <TableHead className="w-12">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee, index) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                  <TableCell className="text-gray-700">{employee.surname}</TableCell>
                  <TableCell className="text-gray-700">{employee.firstName}</TableCell>
                  <TableCell className="text-gray-700">{employee.username}</TableCell>
                  <TableCell className="text-gray-700 font-mono text-sm">{employee.walletAddress}</TableCell>
                  <TableCell className="text-gray-700">{employee.role}</TableCell>
                  <TableCell className="text-gray-900 font-medium">{employee.salary.toLocaleString()}</TableCell>
                  <TableCell>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {showAddEmployeeModal && (
        <AddEmployeeModal 
          onClose={() => setShowAddEmployeeModal(false)} 
          onEmployeeAdded={handleEmployeeAdded}
        />
      )}
    </div>
  )
}
