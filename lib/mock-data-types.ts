// Mock data store for the entire application session
const mockDatabase = {
  users: new Map<string, number>(),
  organizations: new Map<string, number>(),
  batches: new Map<string, number>(),
  transactions: new Map<string, number>(),
}

// Helper to generate usernames
export function generateUsername(surname: string, firstname: string, walletAddress: string): string {
  const shortAddress = walletAddress.slice(2, 8)
  return `${surname.toLowerCase()}_${firstname.toLowerCase()}_${shortAddress}`
}

// Helper to generate mock token
export function generateMockToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`
}

// Reset mock database — mutate instead of reassign
export function resetMockDatabase() {
  mockDatabase.users.clear()
  mockDatabase.organizations.clear()
  mockDatabase.batches.clear()
  mockDatabase.transactions.clear()
}

export { mockDatabase }
