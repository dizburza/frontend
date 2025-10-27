import { Card } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string | number
  trend?: {
    value: string
    direction: "up" | "down"
  }
  lastUpdated?: string
}

export function StatCard({ label, value, trend, lastUpdated }: StatCardProps) {
  return (
    <Card className="p-6 bg-white border border-gray-200">
      <p className="text-gray-600 text-sm mb-3">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      {trend && (
        <p className={`text-xs ${trend.direction === "up" ? "text-green-600" : "text-red-600"}`}>
          {trend.direction === "up" ? "▲" : "▼"} {trend.value}
        </p>
      )}
      {lastUpdated && <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>}
    </Card>
  )
}
