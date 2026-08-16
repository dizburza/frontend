import { cn } from "@/lib/utils"

interface HeroNotificationProps {
  icon: React.ReactNode
  tint: string
  label: string
  amount: string
  // The decimals, set smaller and greyed, as on the "cNGN 542,000.10" card.
  fraction?: string
  className?: string
}

export function HeroNotification({
  icon,
  tint,
  label,
  amount,
  fraction,
  className,
}: Readonly<HeroNotificationProps>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-4 py-3",
        "shadow-[0px_4px_7.6px_0px_rgba(29,30,73,0.12)]",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[3px]",
          tint,
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-1">
        <span className="whitespace-nowrap text-sm font-medium text-gray-400">
          {label}
        </span>
        <span className="whitespace-nowrap font-nohemi text-xl font-medium text-zinc-800">
          {amount}
          {fraction && (
            <span className="text-base text-gray-300">{fraction}</span>
          )}
        </span>
      </span>
    </div>
  )
}
