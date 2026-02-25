import type React from "react";

import OrgGuard from "@/components/OrgGuard";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrgGuard slug={slug}>{children}</OrgGuard>;
}
