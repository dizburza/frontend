"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import useCngnTransferActivity from "@/hooks/ERC20/useCngnTransferActivity"

export function AnalysisChart() {
  const { monthly } = useCngnTransferActivity()

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Analysis</h3>
        <select className="text-sm border border-gray-200 rounded px-3 py-1">
          <option>Monthly</option>
        </select>
      </div>

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="incoming" fill="#10b981" />
            <Bar dataKey="outgoing" fill="#a3e635" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
