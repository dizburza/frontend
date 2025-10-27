"use client";

import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

export function DashboardHeader() {
  const pathname = usePathname();
  const [accountType, setAccountType] = useState<
    "personal" | "organization" | null
  >(null);

  useEffect(() => {
    const stored = localStorage.getItem("accountType");
    if (stored) {
      setAccountType(stored as "personal" | "organization");
    } else if (pathname.includes("/personal")) {
      setAccountType("personal");
    } else if (pathname.includes("/organization")) {
      setAccountType("organization");
    }
  }, [pathname]);

  const tabs =
    accountType === "personal"
      ? [
          { label: "Wallet", href: "/personal/wallet" },
          { label: "Payments", href: "/personal/payments" },
          { label: "Transactions", href: "/personal/transactions" },
          { label: "QR Center", href: "/personal/qr-center" },
        ]
      : [
          { label: "Dashboard", href: "/organization" },
          { label: "Employees", href: "/organization/employees" },
          { label: "Proposals", href: "/organization/proposals" },
          { label: "Wallets", href: "/organization/wallet" },
          { label: "Payments", href: "/organization/payments" },
          { label: "Transactions", href: "/organization/transactions" },
        ];

  const isActive = (href: string) => {
    if (href === "/personal" && pathname === "/personal") return true;
    if (href === "/organization" && pathname === "/organization") return true;
    if (
      href !== "/personal" &&
      href !== "/organization" &&
      pathname.startsWith(href)
    )
      return true;
    return false;
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-8 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width="100" height="100"/>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex bg-[#F9F9FE] p-2 rounded-md items-center gap-8">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`text-sm font-medium transition-colors ${
                isActive(tab.href)
                  ? "text-white border-b-2 border-[#8286E9] rounded-md p-2  bg-[#454ADE] pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
              BD
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                @bello_dami_6fad
              </p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
