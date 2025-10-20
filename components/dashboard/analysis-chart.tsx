"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", income: 80, expense: 20 },
  { month: "Feb", income: 40, expense: 40 },
  { month: "Mar", income: 60, expense: 30 },
  { month: "Apr", income: 40, expense: 40 },
  { month: "May", income: 100, expense: 20 },
  { month: "June", income: 60, expense: 40 },
  { month: "July", income: 40, expense: 40 },
  { month: "Aug", income: 100, expense: 20 },
  { month: "Sept", income: 60, expense: 40 },
  { month: "Oct", income: 40, expense: 40 },
]

export function AnalysisChart() {
  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Analysis</h3>
        <select className="text-sm border border-gray-200 rounded px-3 py-1">
          <option>Monthly</option>
        </select>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#10b981" />
            <Bar dataKey="expense" fill="#a3e635" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
