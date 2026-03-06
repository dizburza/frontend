"use client";

import { useSendAndConfirmTransaction, useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/app/client";

const DIZBURZA_FACTORY_ABI = [
  {
    inputs: [{ internalType: "address", name: "existingOrg", type: "address" }],
    name: "CreatorAlreadyHasOrganization",
    type: "error",
  },
  { inputs: [], name: "InvalidOrganizationHash", type: "error" },
  { inputs: [], name: "InvalidSigners", type: "error" },
  { inputs: [], name: "InvalidQuorum", type: "error" },
  { inputs: [], name: "OrganizationNotFound", type: "error" },
  {
    inputs: [
      { internalType: "string", name: "organizationHash", type: "string" },
      { internalType: "address[]", name: "signers", type: "address[]" },
      { internalType: "uint256", name: "quorum", type: "uint256" },
    ],
    name: "createOrganization",
    outputs: [
      { internalType: "address", name: "organization", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "getOrganizationByCreator",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "creator", type: "address" }],
    name: "hasOrganization",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

type DizburzaFactoryAbi = typeof DIZBURZA_FACTORY_ABI;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isCreatorAlreadyHasOrganizationError = (error: unknown) => {
  if (!(error instanceof Error)) return false;
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("creatoralreadyhasorganization") ||
    msg.includes("0xaaf77194") ||
    msg.includes("encoded error signature \"0xaaf77194\"")
  );
};

const readOrganizationWithRetry = async (params: {
  contract: ReturnType<typeof getContract<DizburzaFactoryAbi>>;
  creator: string;
}) => {
  const startedAt = Date.now();
  const timeoutMs = 30_000;
  let delayMs = 600;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const deployedAddress: string = await readContract({
        contract: params.contract,
        method: "getOrganizationByCreator",
        params: [params.creator],
      });
      return deployedAddress;
    } catch {
      await sleep(delayMs);
      delayMs = Math.min(3_000, Math.floor(delayMs * 1.35));
    }
  }

  throw new Error(
    "Organization deployment was submitted, but the organization could not be fetched yet. Please wait a moment and refresh.",
  );
};

export function useCreateOrganization() {
  const account = useActiveAccount();
  const { mutateAsync: sendAndConfirmTx, data, isPending, error } =
    useSendAndConfirmTransaction();

  const createOrganization = async (params: {
    organizationHash: string;
    signers: string[];
    quorum: bigint;
  }) => {
    if (!account?.address) {
      throw new Error("Wallet not connected");
    }

    const factoryAddress = process.env.NEXT_PUBLIC_DIZBURZA_FACTORY_ADDRESS;
    if (!factoryAddress) {
      throw new Error("Missing NEXT_PUBLIC_DIZBURZA_FACTORY_ADDRESS");
    }

    const contract = getContract({
      client: thirdwebClient,
      address: factoryAddress,
      chain: baseSepolia,
      abi: DIZBURZA_FACTORY_ABI,
    });

    const alreadyHasOrg = await readContract({
      contract,
      method: "hasOrganization",
      params: [account.address],
    });
    if (alreadyHasOrg) {
      return await readOrganizationWithRetry({
        contract,
        creator: account.address,
      });
    }

    const tx = prepareContractCall({
      contract,
      method: "createOrganization",
      params: [params.organizationHash, params.signers, params.quorum],
    });

    try {
      await sendAndConfirmTx(tx);
    } catch (e) {
      if (!isCreatorAlreadyHasOrganizationError(e)) {
        throw e;
      }
    }

    return await readOrganizationWithRetry({
      contract,
      creator: account.address,
    });
  };

  return { createOrganization, data, isLoading: isPending, error };
}
