"use client";

import { Card } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";

export function IncomeExpenseCards() {
  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Income</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">23,000.05</span>
              <div className="flex items-center">
                <Image src={"cngn.svg"} alt="cNGN" width={24} height={24} />
                <span className="text-gray-600">cNGN</span>
              </div>
            </div>
            <p className="text-red-600 text-xs mt-2">2.13% than last month</p>
          </div>
          <ArrowDownLeft className="text-green-600" size={24} />
        </div>
      </Card>

      <Card className="p-6 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-2">Expense</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">45,000.23</span>
               <div className="flex items-center">
                <Image src={"cngn.svg"} alt="cNGN" width={24} height={24} />
                <span className="text-gray-600">cNGN</span>
              </div>
            </div>
            <p className="text-red-600 text-xs mt-2">0.01% than last month</p>
          </div>
          <ArrowUpRight className="text-red-600" size={24} />
        </div>
      </Card>
    </div>
  );
}
