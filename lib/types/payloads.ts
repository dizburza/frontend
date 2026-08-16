export type Employee = {
  id: string
  surname: string
  firstName: string
  username: string
  walletAddress: string
  role: string
  salary: number
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

