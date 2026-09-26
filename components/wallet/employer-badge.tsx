"use client";

import Image from "next/image";
import { useOrganizationBySlug } from "@/lib/api/organization";

type EmployerBadgeProps = {
  organizationSlug: string | null;
  jobRole: string | null;
};

/**
 * Who pays into this wallet, and the job title they pay for, beside the
 * greeting.
 *
 * The mark is a generic glyph: an organization's own logo is not part of the
 * membership record, and a missing image should not read as a missing employer.
 */
export function EmployerBadge({
  organizationSlug,
  jobRole,
}: Readonly<EmployerBadgeProps>) {
  const { data: organization, loading } = useOrganizationBySlug(organizationSlug);

  if (!organizationSlug) return null;

  const name = organization?.name;
  if (!name && !loading) return null;

  return (
    <div className="flex items-center gap-1 rounded-lg p-2 outline outline-[0.5px] -outline-offset-[0.5px] outline-brand-indigo">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md outline outline-[0.4px] -outline-offset-[0.4px] outline-indigo-300">
        <span className="flex size-6 items-center justify-center rounded-[3.2px] bg-slate-100">
          <Image
            src="/icons/vuesax/bold/nexo.svg"
            alt=""
            width={16}
            height={16}
            className="size-4"
          />
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-bricolage text-base font-semibold text-zinc-900">
          {name || "..."}
        </span>
        {jobRole ? (
          <span className="truncate font-raleway text-[10px] text-zinc-600">{jobRole}</span>
        ) : null}
      </span>
    </div>
  );
}
