"use client";

import { usePathname } from "next/navigation";

const ORG_PATH_RE = /^\/org\/([^/]+)/;

export default function useOrgSlug() {
  const pathname = usePathname();

  const match = ORG_PATH_RE.exec(pathname);
  return match?.[1] || null;
}
