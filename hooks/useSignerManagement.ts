"use client";

import { activeChain } from "@/constants/chain";
import { thirdwebClient } from "@/app/client";
import { useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { useSponsoredTransaction } from "@/hooks/useSponsoredTransaction";

/**
 * Adding a signer to Dizburza is one call during bootstrap and a full
 * propose/approve/execute multisig flow afterwards, gated by the contract's
 * own `constituted` latch. Nothing about that lives in Postgres, since it is
 * derived purely from signer count and target, so every call here reads the
 * chain rather than a cache: this is a write precondition, not a display
 * value, which is the one case rule 1 carves out.
 */
export function useSignerManagement(organizationAddress?: string | null) {
  const account = useActiveAccount();
  const { send } = useSponsoredTransaction();

  const contract = () => {
    if (!organizationAddress) throw new Error("Organization has no contract address");
    return getContract({
      client: thirdwebClient,
      address: organizationAddress,
      chain: activeChain,
    });
  };

  /** True once the declared signer count has been reached at least once. */
  const isConstituted = async (): Promise<boolean> => {
    return await readContract({
      contract: contract(),
      method: "function isConstituted() view returns (bool)",
      params: [],
    });
  };

  /** Bumps on every signer or quorum change, so a stale proposal id never resolves. */
  const getSignerEpoch = async (): Promise<bigint> => {
    return await readContract({
      contract: contract(),
      method: "function signerEpoch() view returns (uint256)",
      params: [],
    });
  };

  const getSignerProposalId = async (subject: string, isRemoval: boolean): Promise<string> => {
    return await readContract({
      contract: contract(),
      method:
        "function signerProposalId(address subject, bool isRemoval) view returns (bytes32)",
      params: [subject, isRemoval],
    });
  };

  /** Bootstrap only: the creator adds a signer directly, no quorum needed yet. */
  const addSigner = async (subject: string): Promise<string> => {
    if (!account) throw new Error("Wallet not connected");

    const tx = prepareContractCall({
      contract: contract(),
      method: "function addSigner(address signer)",
      params: [subject],
    });

    const { transactionHash } = await send(tx);
    return transactionHash;
  };

  /**
   * Past bootstrap: raises a signer-change proposal, which the contract
   * auto-approves for the caller. Returns the proposal id so the caller can
   * hand it to the backend ledger alongside the epoch it was raised under.
   */
  const proposeSignerChange = async (
    subject: string,
    isRemoval: boolean
  ): Promise<{ txHash: string; proposalId: string; signerEpoch: number }> => {
    if (!account) throw new Error("Wallet not connected");

    const signerEpoch = await getSignerEpoch();

    const tx = prepareContractCall({
      contract: contract(),
      method: "function proposeSignerChange(address subject, bool isRemoval) returns (bytes32)",
      params: [subject, isRemoval],
    });

    const { transactionHash } = await send(tx);
    const proposalId = await getSignerProposalId(subject, isRemoval);

    return { txHash: transactionHash, proposalId, signerEpoch: Number(signerEpoch) };
  };

  const approveSignerChange = async (proposalId: string): Promise<string> => {
    if (!account) throw new Error("Wallet not connected");

    const tx = prepareContractCall({
      contract: contract(),
      method: "function approveSignerChange(bytes32 proposalId)",
      params: [proposalId as `0x${string}`],
    });

    const { transactionHash } = await send(tx);
    return transactionHash;
  };

  const executeSignerChange = async (proposalId: string): Promise<string> => {
    if (!account) throw new Error("Wallet not connected");

    const tx = prepareContractCall({
      contract: contract(),
      method: "function executeSignerChange(bytes32 proposalId)",
      params: [proposalId as `0x${string}`],
    });

    const { transactionHash } = await send(tx);
    return transactionHash;
  };

  return {
    isConstituted,
    getSignerEpoch,
    getSignerProposalId,
    addSigner,
    proposeSignerChange,
    approveSignerChange,
    executeSignerChange,
  };
}
