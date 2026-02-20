import type { Signer } from "@/lib/types/payloads"

export type MockSignerSearchResult = Signer

export const mockSignerSearchResults: MockSignerSearchResult[] = [
  {
    id: "1",
    name: "John Chibike",
    username: "@john_chi_56f1",
    role: "COO",
    avatar: "JC",
  },
  {
    id: "2",
    name: "Adeoye Adetola",
    username: "@ade_ade_41fd",
    role: "HR",
    avatar: "AA",
  },
  {
    id: "3",
    name: "Bello Damilola",
    username: "@bello_dami_6fad",
    role: "CEO",
    avatar: "BD",
  },
]
