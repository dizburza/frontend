import type React from "react";

import OrgGuard from "@/components/OrgGuard";

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  return <OrgGuard slug={params.slug}>{children}</OrgGuard>;
}
