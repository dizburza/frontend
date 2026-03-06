"use client"

import { useEffect, useState } from "react"
import { TransactionModal } from "@/components/transaction-modal"
import { SuccessModal } from "@/components/success-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useGlobalLoading } from "@/lib/global-loading"
import { toast } from "sonner"
import { useActiveAccount, useSendTransaction, useWalletBalance } from "thirdweb/react"
import { getContract } from "thirdweb"
import { prepareContractCall } from "thirdweb/transaction"
import { baseSepolia } from "thirdweb/chains"
import { eth_getTransactionReceipt, getRpcClient } from "thirdweb/rpc"
import { thirdwebClient } from "@/app/client"
import { parseUnits } from "viem"
import ConnectWallet from "@/components/ConnectWallet"
import { useChainSwitch } from "@/hooks/useChainSwitch"

interface SendToCNGNFlowProps {
  isOpen: boolean
  onClose: () => void
  initialRecipient?: string
}

type Step = "recipient" | "amount" | "success"

function shortAddress(value: string) {
  if (!value) return "--"
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function isHexAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value)
}

const parseUsernameInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("@@")) {
    return null
  }

  if (trimmed.startsWith("@") && (trimmed.length === 1 || /\s/.test(trimmed[1] ?? ""))) {
    return null
  }

  const cleaned = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed
  const username = cleaned.trim().toLowerCase()
  if (!username) return null

  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    return null
  }

  return username
}

const computeRecipientLabel = (params: {
  resolvedUsername: string | null
  resolvedRecipient: `0x${string}` | null
}) => {
  if (params.resolvedUsername) return `@${params.resolvedUsername}`
  if (params.resolvedRecipient) return shortAddress(params.resolvedRecipient)
  return "--"
}

const computeToValue = (params: {
  resolvedUsername: string | null
  resolvedRecipient: `0x${string}` | null
  recipientInput: string
}) => {
  if (params.resolvedUsername) return `@${params.resolvedUsername}`
  if (params.resolvedRecipient) return shortAddress(params.resolvedRecipient)
  if (isHexAddress(params.recipientInput)) return shortAddress(params.recipientInput)
  return params.recipientInput
}

const resolveRecipientInput = async (params: {
  recipient: string
  showLoading: (message: string) => void
  hideLoading: () => void
}): Promise<{ address: `0x${string}`; username: string | null } | null> => {
  const input = params.recipient.trim()
  if (!input) return null

  if (isHexAddress(input)) {
    return { address: input, username: null }
  }

  const username = parseUsernameInput(input)
  if (!username) {
    toast.error("Enter a valid @username or 0x address")
    return null
  }

  try {
    params.showLoading("Resolving username...")
    const res = await fetch(`/api/users/resolve/${encodeURIComponent(username)}`)
    const body = (await res.json()) as { success?: boolean; data?: { username?: string; walletAddress?: string }; error?: string }

    if (!res.ok || !body?.data?.walletAddress) {
      toast.error(body?.error || "Could not resolve username")
      return null
    }

    const addr = body.data.walletAddress.trim()
    if (!isHexAddress(addr)) {
      toast.error("Resolved address is invalid")
      return null
    }

    return {
      address: addr,
      username: body.data.username || username,
    }
  } catch (e) {
    console.error(e)
    toast.error("Could not resolve username")
    return null
  } finally {
    params.hideLoading()
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const getTxHashFromSendResult = (result: unknown): `0x${string}` | null => {
  if (!result) return null
  if (typeof result === "string" && isHexAddress(result)) return result

  const r = result as { transactionHash?: unknown; receipt?: { transactionHash?: unknown } }
  const hash = r?.transactionHash ?? r?.receipt?.transactionHash
  return typeof hash === "string" && isHexAddress(hash) ? (hash) : null
}

const waitForReceipt = async (hash: `0x${string}`) => {
  const rpcRequest = getRpcClient({ client: thirdwebClient, chain: baseSepolia })

  const startedAt = Date.now()
  const timeoutMs = 90_000
  let delayMs = 1_200

  while (Date.now() - startedAt < timeoutMs) {
    const receipt = await eth_getTransactionReceipt(rpcRequest, { hash })
    if (receipt) return receipt
    await sleep(delayMs)
    delayMs = Math.min(4_000, Math.floor(delayMs * 1.25))
  }

  throw new Error("Timed out waiting for transaction confirmation")
}

export function SendToCNGNFlow({ isOpen, onClose, initialRecipient }: Readonly<SendToCNGNFlowProps>) {
  const [step, setStep] = useState<Step>("recipient")
  const [recipient, setRecipient] = useState("")
  const [resolvedRecipient, setResolvedRecipient] = useState<`0x${string}` | null>(null)
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { showLoading, hideLoading } = useGlobalLoading()

  const account = useActiveAccount()
  const { ensureCorrectChain, isOnCorrectChain } = useChainSwitch()
  const { mutateAsync: sendTx } = useSendTransaction()

  const tokenAddress = (process.env.NEXT_PUBLIC_CNGN_ADDRESS || "").trim() as `0x${string}` | ""
  const contract = tokenAddress
    ? getContract({ address: tokenAddress, chain: baseSepolia, client: thirdwebClient })
    : null

  const { data: balanceData } = useWalletBalance({
    address: account?.address,
    chain: baseSepolia,
    client: thirdwebClient,
    tokenAddress: tokenAddress || undefined,
  })

  const recipientLabel = computeRecipientLabel({ resolvedUsername, resolvedRecipient })

  let availableBalanceText = "--"
  if (account?.address) {
    if (!isOnCorrectChain) {
      availableBalanceText = "Switch to Base Sepolia"
    } else if (balanceData) {
      availableBalanceText = `${balanceData.displayValue} cNGN`
    }
  }

  useEffect(() => {
    if (!isOpen) return

    setStep("recipient")
    setAmount("")
    setResolvedRecipient(null)
    setResolvedUsername(null)

    if (typeof initialRecipient === "string") {
      const value = initialRecipient.trim()
      setRecipient(value)
      if (/^0x[a-fA-F0-9]{40}$/.test(value)) {
        setResolvedRecipient(value as `0x${string}`)
        setResolvedUsername(null)
        if (account?.address) {
          setStep("amount")
        }
      }
    } else {
      setRecipient("")
    }
  }, [account?.address, initialRecipient, isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (step !== "recipient") return
    if (!account?.address) return
    if (!resolvedRecipient) return

    setStep("amount")
  }, [account?.address, isOpen, resolvedRecipient, step])

  if (!isOpen) return null

  const submitTransfer = async () => {
    try {
      if (!account?.address) {
        toast.error("Connect wallet to continue")
        return
      }

      const okChain = await ensureCorrectChain()
      if (!okChain) {
        return
      }

      if (!contract) {
        toast.error("Token contract not configured")
        return
      }

      if (!resolvedRecipient) {
        toast.error("Recipient not resolved")
        return
      }

      const parsedAmount = Number.parseFloat(amount)
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error("Enter a valid amount")
        return
      }

      const balanceNumber = balanceData?.displayValue ? Number.parseFloat(balanceData.displayValue) : null
      if (balanceNumber !== null && Number.isFinite(balanceNumber) && parsedAmount > balanceNumber) {
        toast.error("Transfer amount exceeds balance")
        return
      }

      setIsLoading(true)
      showLoading("Confirming transfer...")

      const tokenDecimals = typeof balanceData?.decimals === "number" ? balanceData.decimals : 6

      const tx = prepareContractCall({
        contract,
        method: "function transfer(address to, uint256 value)",
        params: [resolvedRecipient, parseUnits(amount, tokenDecimals)],
      })

      const result = await sendTx(tx)
      const txHash = getTxHashFromSendResult(result)

      toast.success("Transfer submitted")

      if (txHash) {
        showLoading("Waiting for confirmation...")
        const receipt = await waitForReceipt(txHash)
        const statusRaw = (receipt as { status?: unknown } | null | undefined)?.status
        const status = typeof statusRaw === "string" ? statusRaw : undefined
        if (status?.toLowerCase() === "0x0") {
          throw new Error("Transaction reverted")
        }
      }

      globalThis.dispatchEvent(new Event("cngn:activity:refresh"))
      setStep("success")
    } catch (error) {
      console.error(error)
      const e = error as { message?: string }
      toast.error(e?.message || "Could not send. Please try again.")
    } finally {
      hideLoading()
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    if (step === "recipient") {
      if (!recipient) return
      if (isLoading) return

      const result = await resolveRecipientInput({ recipient, showLoading, hideLoading })
      if (!result) return

      setResolvedRecipient(result.address)
      setResolvedUsername(result.username)
      setStep("amount")
      return
    }

    if (step !== "amount" || !amount) return
    if (isLoading) return

    if (!account?.address) {
      toast.error("Connect wallet to continue")
      return
    }

    await submitTransfer()
  }

  const handleBack = () => {
    if (step === "amount") {
      setStep("recipient")
      setResolvedRecipient(null)
      setResolvedUsername(null)
    } else if (step === "success") {
      setStep("amount")
    }
  }

  if (step === "success") {
    const toValue = computeToValue({
      resolvedUsername,
      resolvedRecipient,
      recipientInput: recipient,
    })

    return (
      <SuccessModal
        title="Send cNGN"
        icon="check"
        summary={[
          {
            label: "Date",
            value: new Date().toLocaleDateString(),
          },
          {
            label: "To",
            value: toValue,
          },
          {
            label: "Network",
            value: "Base Sepolia",
          },
          {
            label: "Gas Fee",
            value: "0.0000001 ETH",
          },
        ]}
        onClose={onClose}
      />
    )
  }

  return (
    <TransactionModal
      title="Send cNGN"
      onClose={onClose}
      onBack={step === "recipient" ? undefined : handleBack}
    >
      <div className="space-y-6">
        {!account?.address && (
          <div className="space-y-3 rounded-md border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-700">Connect your wallet to send cNGN.</p>
            <ConnectWallet label="Connect Wallet" />
          </div>
        )}
        {step === "recipient" && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Recipient Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Enter the recipient&apos;s Dizburza username (@username) or wallet address (0x...) to send cNGN.
              </p>
              <Input
                placeholder="Enter @username or 0x address"
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value)
                  setResolvedRecipient(null)
                  setResolvedUsername(null)
                }}
              />
            </div>
            <Button onClick={handleNext} disabled={!recipient || isLoading} className="w-full">
              Next
            </Button>
          </>
        )}

        {step === "amount" && (
          <>
            <div>
              <h3 className="font-semibold mb-2">Enter Amount</h3>
              <p className="text-sm text-gray-600 mb-4">Specify the amount you want to send to this account.</p>
              <div className="text-sm text-gray-600 mb-4">
                Sending to:{" "}
                <span className="font-semibold">{recipientLabel}</span>
              </div>
              {!account?.address && (
                <div className="mb-4 space-y-3 rounded-md border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-700">Connect your wallet to view balance and send.</p>
                  <ConnectWallet label="Connect Wallet" />
                </div>
              )}
              <Input
                placeholder="Enter amount"
                type="number"
                value={amount}
                disabled={!account?.address}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="mt-4 text-sm text-gray-600">
                Available balance:{" "}
                <span className="font-semibold">{availableBalanceText}</span>
              </div>
            </div>
            <Button onClick={handleNext} disabled={!amount || isLoading || !account?.address} className="w-full">
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </>
        )}
      </div>
    </TransactionModal>
  )
}
