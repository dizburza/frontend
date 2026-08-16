import { baseSepolia } from "thirdweb/chains";

/**
 * The one chain this deployment talks to.
 *
 * Read this rather than importing `baseSepolia` again. Account abstraction binds
 * a smart account's address to the chain it was configured with, so a call site
 * pointing somewhere else would not merely fail, it would transact as a
 * different account.
 */
export const activeChain = baseSepolia;

export const SUPPORTED_CHAIN_ID = activeChain.id;

export const isSupportedChain = (
  chainId: number | undefined,
): chainId is number =>
  chainId !== undefined && Number(chainId) === SUPPORTED_CHAIN_ID;
