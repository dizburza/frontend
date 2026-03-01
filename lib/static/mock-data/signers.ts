import type { Signer } from "@/lib/types/payloads"

export type MockSignerSearchResult = Signer

export const mockSignerSearchResults: MockSignerSearchResult[] = [
  {
    id: "1",
    name: "John Chibike",
    username: "@john_chi_56f1",
    walletAddress: "0x0000000000000000000000000000000000000001",
    role: "COO",
    avatar: "JC",
  },
  {
    id: "2",
    name: "Adeoye Adetola",
    username: "@ade_ade_41fd",
    walletAddress: "0x0000000000000000000000000000000000000002",
    role: "HR",
    avatar: "AA",
  },
  {
    id: "3",
    name: "Bello Damilola",
    username: "@bello_dami_6fad",
    walletAddress: "0x0000000000000000000000000000000000000003",
    role: "CEO",
    avatar: "BD",
  },
]
