import { createThirdwebClient } from "thirdweb";
import { inAppWallet } from "thirdweb/wallets";
import { activeChain } from "@/constants/chain";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error("No client ID provided");
}

export const thirdwebClient = createThirdwebClient({
  clientId: clientId,
});

/**
 * One way in, and it is an ERC-4337 smart account.
 *
 * External wallets are gone deliberately. Supporting them meant supporting EOAs,
 * and an EOA can only be sponsored through ERC-2771, which can never cover cNGN
 * `transfer` or `approve` because the token reads `msg.sender`. Carrying both
 * paths bought a worse version of gasless for a minority of users.
 *
 * A smart account is its own sender, so the paymaster pays for anything it does.
 */
export const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "apple", "email", "passkey"],
    },
    executionMode: {
      mode: "EIP4337",
      smartAccount: { chain: activeChain, sponsorGas: true },
    },
  }),
];
