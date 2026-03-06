"use client";

import { useSendAndConfirmTransaction, useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/app/client";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const readOrganizationWithRetry = async (params: {
  contract: ReturnType<typeof getContract>;
  creator: string;
}) => {
  const startedAt = Date.now();
  const timeoutMs = 30_000;
  let delayMs = 600;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const deployedAddress: string = await readContract({
        contract: params.contract,
        method: "function getOrganizationByCreator(address creator) view returns (address)",
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
    });

    const tx = prepareContractCall({
      contract,
      method:
        "function createOrganization(string organizationHash, address[] signers, uint256 quorum) returns (address)",
      params: [params.organizationHash, params.signers, params.quorum],
    });

    await sendAndConfirmTx(tx);

    return await readOrganizationWithRetry({
      contract,
      creator: account.address,
    });
  };

  return { createOrganization, data, isLoading: isPending, error };
}
