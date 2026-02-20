export const mockOrganizations = {
  current: {
    id: "org_1",
    name: "Dizburza",
    category: "Fintech",
    location: "Lagos, Nigeria",
    contractAddress: "0x1234567890abcdef",
    signers: [
      {
        id: "signer_1",
        username: "@bello_dami_6fad",
        fullName: "Bello Dami",
        role: "CEO",
        status: "active",
        walletAddress: "0x54...41fd",
      },
      {
        id: "signer_2",
        username: "@admin_user",
        fullName: "Admin User",
        role: "CFO",
        status: "active",
        walletAddress: "0x91d...441a",
      },
    ],
    quorum: 2,
    totalEmployees: 9,
    createdAt: "2025-01-01",
  },
}
