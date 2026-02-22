"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/step-indicator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import FileUploadArea from "@/components/file-upload-area";
import { toast } from "sonner";

export default function OrganizationDetailsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: "",
    registrationType: "",
    registrationNumber: "",
    country: "",
  });

  const steps = [
    {
      number: 1,
      title: "Organization Details",
      subtitle: "",
      completed: false,
      active: true,
    },
    {
      number: 2,
      title: "Organization Profile",
      subtitle: "",
      completed: false,
      active: false,
    },
    {
      number: 3,
      title: "Add Signers",
      subtitle: "",
      completed: false,
      active: false,
    },
  ];

  const handleContinue = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      // Store organization details
      localStorage.setItem("orgDetails", JSON.stringify(formData));
      toast.success("Organization details saved");
      // Navigate to organization profile
      router.push("/organization-setup/organization-profile");
    } catch (error) {
      console.error(error);
      toast.error("Could not save details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/organization-setup");
  };

  return (
    <div className="flex w-full min-h-[calc(100vh-80px)]">
      {/* Left sidebar */}
      <div className="w-1/2 bg-[#ECEDFC] p-12 flex flex-col justify-center">
        <StepIndicator steps={steps} />
      </div>

      {/* Right content */}
      <div className="w-1/2 flex items-center justify-center p-12 ">
        <Card className="w-full max-w-lg relative right-1/3 rounded-[40px] ">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-[#1D1F5D] mb-2">
              Organization Details
            </h2>
            <p className="text-gray-600 text-center text-sm mb-8">
              Let&apos;s start with your organization&apos;s basic details.
            </p>

            <div className="space-y-2 px-8">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-[#69696C] mb-2">
                  Industry
                </label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select industry</option>
                  <option value="tech">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="retail">Retail</option>
                </select>
              </div>

              <div>
                <label htmlFor="registrationType" className="block text-sm font-medium text-[#69696C] mb-2">
                  Registration Type
                </label>
                <select
                  id="registrationType"
                  value={formData.registrationType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationType: e.target.value,
                    })
                  }
                  className="w-full text-sm px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select business type</option>
                  <option value="llc">LLC</option>
                  <option value="corp">Corporation</option>
                  <option value="sole">Sole Proprietor</option>
                </select>
              </div>

              <div>
                <label htmlFor="registrationNumber" className="block text-sm font-medium text-[#69696C] mb-2">
                  Registration Number
                </label>
                <Input
                  id="registrationNumber"
                  type="text"
                  placeholder="e.g RC1234567"
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationNumber: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-[#69696C] mb-2">
                  Country
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-4 text-sm py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select country</option>
                  <option value="ng">Nigeria</option>
                  <option value="us">United States</option>
                  <option value="uk">United Kingdom</option>
                </select>
              </div>

              <div>
                <label htmlFor="certificateUpload" className="block text-sm font-medium text-[#69696C] mb-2">
                  Upload Certificate
                </label>
                <FileUploadArea inputId="certificateUpload" accept="image/png,image/jpeg,application/pdf" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={handleBack} className="flex-1 bg-transparent">
                  Back
                </Button>
                <Button disabled={isLoading} onClick={handleContinue} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Continuing..." : "Continue"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
