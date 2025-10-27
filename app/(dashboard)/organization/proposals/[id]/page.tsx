"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SignaturesComponent } from "@/components/proposals/signatures-component"
import { StatusTimeline } from "@/components/proposals/status-timeline"
import { SignProposalModal } from "@/components/proposals/sign-proposal-modal"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function ProposalDetailsPage({ params }: { params: { id: string } }) {
  const [showSignModal, setShowSignModal] = useState(false)

  const votingLog = [
    {
      id: 1,
      signer: "Bello Damilola",
      handle: "@bello_dami_6fad",
      role: "CEO",
      decision: "Signed For",
      timestamp: "Oct 7, 2025 - 10:45 AM",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=bello",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-2">Dashboard › Proposals › Proposal Details</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Completed</span>
            <h1 className="text-3xl font-bold">CSR Initiative Funding for Community Development</h1>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">+ Create a Proposal</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Created by:</p>
          <p className="font-medium">CEO</p>
        </div>
        <div>
          <p className="text-gray-600">Created on:</p>
          <p className="font-medium">Oct 7, 2025</p>
        </div>
        <div>
          <p className="text-gray-600">Amount Requested:</p>
          <p className="font-medium">cNGN3,500,000</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-8">
          {/* Description */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed">
              This proposal seeks approval to fund a Corporate Social Responsibility (CSR) initiative focused on
              empowering local communities through business and skill development programs. The initiative aims to
              provide financial support, training, and resources to small and medium-scale enterprises, helping them
              scale sustainably and contribute to local economic growth.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              By investing in this program, the organization reinforces its commitment to social impact, job creation,
              and inclusive development within underserved communities.
            </p>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Recent Activity (Voting Log)</h2>
              <a href="#" className="text-blue-600 text-sm font-medium">
                View all
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">SIGNERS</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">DECISION</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {votingLog.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">{log.id}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={log.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{log.signer[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{log.signer}</p>
                            <p className="text-xs text-gray-500">
                              {log.handle} - {log.role}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-green-600 font-medium">{log.decision}</span>
                      </td>
                      <td className="py-4 px-4">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SignaturesComponent onSignClick={() => setShowSignModal(true)} />
          <StatusTimeline />
        </div>
      </div>

      {/* Sign Proposal Modal */}
      {showSignModal && <SignProposalModal onClose={() => setShowSignModal(false)} />}
    </div>
  )
}
