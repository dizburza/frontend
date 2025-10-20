"use client";

import { Bell, Search } from "lucide-react";
import Image from "next/image";

export function DashboardHeader() {
  const tabs = ["Wallet", "Payments", "Transactions", "QR Center"];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-16 py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image src="logo.svg" alt="Logo" width="150" height="200" />
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`text-sm font-medium transition-colors ${
                tab === "Wallet"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
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
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
            <div className="hidden sm:block">
              <p className="text-sm font-medium">@bello_dami_6fad</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
