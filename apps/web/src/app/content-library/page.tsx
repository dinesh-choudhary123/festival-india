"use client";

import { FolderOpen } from "lucide-react";

export default function ContentLibraryPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-gray-500">
      <FolderOpen size={48} className="text-gray-300 mb-4" />
      <h1 className="text-xl font-bold text-gray-900">Content Library</h1>
      <p className="text-sm mt-1">Store and manage your social media post templates and assets</p>
      <p className="text-xs text-gray-400 mt-4">Coming soon</p>
    </div>
  );
}
