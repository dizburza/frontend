import { Card } from "@/components/ui/card"

interface ProposalStatCardProps {
  label: string
  value: string
  lastUpdated?: string
  link?: string
  href?: string
  onLinkClick?: () => void
}

export function ProposalStatCard({ label, value, lastUpdated, link, href, onLinkClick }: Readonly<ProposalStatCardProps>) {
  return (
    <Card className="p-6 bg-white border border-gray-200">
      <p className="text-gray-600 text-sm mb-3">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      {lastUpdated && <p className="text-xs text-gray-500">Last updated: {lastUpdated}</p>}
      {link && (
        href ? (
          <a href={href} className="text-blue-600 text-sm font-medium hover:underline">
            {link}
          </a>
        ) : (
          <button
            type="button"
            onClick={onLinkClick}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            {link}
          </button>
        )
      )}
    </Card>
  )
}
