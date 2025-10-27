"use client"

interface ProposalTableProps {
  proposals: Array<{
    id: string
    title: string
    createdBy: string
    timeLeft: string
    status: string
    votesFor: number
    votesAgainst: number
  }>
}

export function ProposalTable({ proposals }: ProposalTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">PROPOSAL</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">INITIATED BY</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">TIME LEFT</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">STATUS</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-600">SIGNATURE</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">VOTES FOR</th>
            <th className="text-center py-3 px-4 font-semibold text-gray-600">VOTES AGAINST</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal, index) => (
            <tr key={proposal.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-4 px-4">{index + 1}</td>
              <td className="py-4 px-4">
                <a href={`/organization/proposals/${proposal.id}`} className="text-blue-600 hover:underline font-medium">
                  {proposal.title}
                </a>
              </td>
              <td className="py-4 px-4">{proposal.createdBy}</td>
              <td className="py-4 px-4">{proposal.timeLeft}</td>
              <td className="py-4 px-4">
                <span
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    proposal.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {proposal.status}
                </span>
              </td>
              <td className="py-4 px-4">{proposal.votesFor + proposal.votesAgainst}</td>
              <td className="py-4 px-4 text-center">{proposal.votesFor}</td>
              <td className="py-4 px-4 text-center">{proposal.votesAgainst}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
