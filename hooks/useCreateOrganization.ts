"use client";

import { useSendAndConfirmTransaction, useActiveAccount } from "thirdweb/react";
import { getContract, prepareContractCall, readContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";
import { thirdwebClient } from "@/app/client";

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

    const deployedAddress: string = await readContract({
      contract,
      method: "function getOrganizationByCreator(address creator) view returns (address)",
      params: [account.address],
    });

    return deployedAddress;
  };

  return { createOrganization, data, isLoading: isPending, error };
}
