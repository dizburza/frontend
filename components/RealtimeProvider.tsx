"use client";

import { useActiveAccount } from "thirdweb/react";
import useOrgSlug from "@/hooks/useOrgSlug";
import { useOrganizationBySlug } from "@/lib/api/organization";
import useRealtimeStream from "@/hooks/useRealtimeStream";

/**
 * Opens the single app-wide realtime connection.
 *
 * Subscribes to the connected wallet and, when inside an organization, its
 * treasury contract. Everything downstream revalidates through the cache bus,
 * so no component polls on its own.
 */
export function RealtimeProvider() {
  const account = useActiveAccount();
  const orgSlug = useOrgSlug();
  const { data: organization } = useOrganizationBySlug(orgSlug);

  useRealtimeStream([account?.address, organization?.contractAddress]);

  return null;
}

export default RealtimeProvider;
