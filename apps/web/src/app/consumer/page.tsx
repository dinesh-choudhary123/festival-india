"use client";

import { Users } from "lucide-react";

export default function ConsumerPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
      <Users size={48} className="text-gray-300 mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Consumer</h1>
      <p className="text-sm mt-1">Audience targeting and demographics for festival campaigns</p>
      <p className="text-xs text-gray-400 mt-4">Coming soon</p>
    </div>
  );
}
