export type Employee = {
  id: string
  surname: string
  firstName: string
  username: string
  walletAddress: string
  role: string
  salary: number
}

export type Proposal = {
  id: string
  title: string
  description: string
  amount: number
  status: string
  timeLeft: string
  votesFor: number
  votesAgainst: number
  createdAt: string
  createdBy: string
}

export type PaymentBatchRecipient = {
  surname: string
  firstName: string
  salary: string
}

export type PaymentBatch = {
  id: string
  batchName: string
  totalAmount: number
  date: string
  employees: number
  status: string
  recipients: PaymentBatchRecipient[]
}

export type Signer = {
  id: string
  name: string
  username: string
  walletAddress: string
  role: string
  avatar: string
}

export type VotingLogItem = {
  id: number
  signer: string
  handle: string
  role: string
  decision: string
  timestamp: string
  avatar: string
}
