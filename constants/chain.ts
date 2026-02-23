export const SUPPORTED_CHAIN_ID = 84532; // 4202

export const isSupportedChain = (
  chainId: number | undefined,
): chainId is number =>
  chainId !== undefined && Number(chainId) === SUPPORTED_CHAIN_ID;
