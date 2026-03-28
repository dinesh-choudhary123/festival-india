"use client";

import { Building2 } from "lucide-react";

export default function CompanyPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
      <Building2 size={48} className="text-gray-300 mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Company Settings</h1>
      <p className="text-sm mt-1">Configure your brand, logo, and company details</p>
      <p className="text-xs text-gray-400 mt-4">Coming soon</p>
    </div>
  );
}
