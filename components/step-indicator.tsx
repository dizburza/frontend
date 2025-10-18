interface Step {
  number: number
  title: string
  subtitle: string
  completed: boolean
  active: boolean
}

interface StepIndicatorProps {
  steps: Step[]
}

export default function StepIndicator({ steps }: StepIndicatorProps) {
  return (
    <div className="space-y-8 w-full space-x-4">
      <div>
        <h1 className="text-4xl font-bold text-[#1D1F5D] mb-2">Set up your organization</h1>
        <p className="text-gray-600 text-sm text-balance">
          Let&apos;s start by creating your organization space on Dizburza. These details help us personalize your dashboard
          and business tools.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
                step.active
                  ? "bg-blue-600 text-white"
                  : step.completed
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
              }`}
            >
              {step.completed ? "✓" : step.number}
            </div>
            <div>
              <p className={`font-semibold ${step.active ? "text-blue-600" : "text-gray-700"}`}>Step {step.number}</p>
              <p className="text-sm text-gray-600">{step.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
