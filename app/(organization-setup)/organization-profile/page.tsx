"use client";

import { useState } from "react";
import StepIndicator from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import FileUploadArea from "@/components/file-upload-area";

export default function OrganizationProfilePage() {
  const [formData, setFormData] = useState({
    organizationName: "",
    businessEmail: "",
  });

  const steps = [
    {
      number: 1,
      title: "Organization Details",
      subtitle: "",
      completed: true,
      active: false,
    },
    {
      number: 2,
      title: "Organization Profile",
      subtitle: "",
      completed: false,
      active: true,
    },
    {
      number: 3,
      title: "Add Signers",
      subtitle: "",
      completed: false,
      active: false,
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      {/* Left sidebar */}
      <div className="w-1/2 bg-[#ECEDFC] p-12 flex flex-col justify-center">
        <StepIndicator steps={steps} />
      </div>

      {/* Right content */}
      <div className="w-1/2  flex items-center justify-center p-12">
        <Card className="w-full max-w-md relative right-1/3 rounded-[40px] ">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-[#1D1F5D] text-center mb-2">
              Organization Details
            </h2>
            <p className="text-gray-600 text-center text-sm mb-8">
              Let&apos;s start with your organization&apos;s basic details.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <Input
                  type="text"
                  placeholder="Enter organization name"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={formData.businessEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, businessEmail: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Company Logo
                </label>
               <FileUploadArea />
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
