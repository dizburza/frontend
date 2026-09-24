"use client"

import { OnboardingButton } from "@/components/organization-setup/onboarding-button"
import { SuccessSeal } from "@/components/ui/success-seal"

interface ProposalSuccessModalProps {
  onViewProposal: () => void
}

export function ProposalSuccessModal({ onViewProposal }: Readonly<ProposalSuccessModalProps>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-[581px] px-6 sm:px-10 py-14 bg-white rounded-[40px] shadow-[0px_4px_78px_31px_rgba(69,74,222,0.08)] outline outline-[0.5px] outline-offset-[-0.5px] outline-gray-200 flex justify-center items-center">
        <div className="w-full max-w-[501px] flex flex-col items-center gap-16">
          <SuccessSeal />

          <div className="flex flex-col items-center gap-10 w-full">
            <div className="flex flex-col items-center gap-4">
              <div className="text-center text-blue-950 text-3xl font-normal font-nohemi">
                Proposal created successfully
              </div>
              <div className="w-full max-w-[393px] text-center text-neutral-500 text-lg font-normal">
                Proposal has been submitted and is now waiting for the required signer approvals.
              </div>
            </div>

            <OnboardingButton className="self-stretch" onClick={onViewProposal}>
              View Proposal
            </OnboardingButton>
          </div>
        </div>
      </div>
    </div>
  )
}
