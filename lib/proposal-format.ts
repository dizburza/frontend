import type { ProposalStatus } from "@/lib/api/proposals";

/** Time remaining in the voting window, or why there is none. */
export const timeLeftLabel = (closesAt: string, status: ProposalStatus): string => {
  if (status !== "open") return "Closed";

  const remaining = new Date(closesAt).getTime() - Date.now();
  if (remaining <= 0) return "Closed";

  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ${hours % 24} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

export const statusLabel: Record<ProposalStatus, string> = {
  open: "In progress",
  passed: "Approved",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Withdrawn",
};

export const statusClasses: Record<ProposalStatus, string> = {
  open: "bg-yellow-100 text-yellow-700",
  passed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-600",
  cancelled: "bg-gray-100 text-gray-600",
};
