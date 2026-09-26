"use client";

import { WalletView } from "@/components/wallet/wallet-view";

/**
 * A signer's own wallet, reachable from inside an organization.
 *
 * It is the same wallet either way: the view is keyed by the signed-in address,
 * not by the organization in the path. The treasury belongs to the organization
 * dashboard, which has its own card for it.
 */
export default function OrganizationWalletPage() {
  return <WalletView />;
}
