"use client";

import { SectionCard } from "@/components/dashboard/section-card";

type Signer = {
  address: string;
  role: string;
  isActive: boolean;
};

type AuthorizedSignersProps = {
  signers: Signer[];
  viewAllHref: string;
};

const shortAddress = (value: string) =>
  value ? `${value.slice(0, 6)}...${value.slice(-4)}` : "--";

export function AuthorizedSigners({ signers, viewAllHref }: AuthorizedSignersProps) {
  return (
    <SectionCard title="Authorized Signers" viewAllHref={viewAllHref} className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-100">
              <th className="px-2 py-1.5 text-center text-xs font-medium leading-3 text-stone-900">S/N</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium leading-3 text-stone-900">
                Wallet Address
              </th>
              <th className="px-2 py-1.5 text-center text-xs font-medium leading-3 text-stone-900">Role</th>
              <th className="px-2 py-1.5 text-center text-xs font-medium leading-3 text-stone-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {signers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sm text-gray-500">
                  No signers yet.
                </td>
              </tr>
            ) : (
              signers.map((signer, index) => (
                <tr key={signer.address} className="border-b-[0.5px] border-neutral-300">
                  <td className="px-2 py-2 text-center text-xs font-medium leading-3 text-stone-900">
                    {index + 1}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-xs font-medium leading-3 text-stone-900">
                    {shortAddress(signer.address)}
                  </td>
                  <td className="px-2 py-2 text-center text-xs capitalize leading-3 text-neutral-500">
                    {signer.role || "--"}
                  </td>
                  <td className="px-2 py-2 text-center text-xs leading-3 text-neutral-500">
                    {signer.isActive ? "Active" : "Inactive"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
