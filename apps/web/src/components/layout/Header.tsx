"use client";

import { Search, Plus, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  totalFestivals: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreatePost?: () => void;
}

export function Header({
  totalFestivals,
  searchValue,
  onSearchChange,
  onCreatePost,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side — title */}
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-gray-500 hover:text-gray-700">
            <Menu size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Social Media Calendar
            </h1>
            <p className="text-sm text-gray-500">
              India — All Festivals & Events
            </p>
          </div>
        </div>

        {/* Right side — search + create */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search festivals..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange
                         w-48 md:w-64"
            />
          </div>
          <button
            onClick={onCreatePost}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg
                       text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Create Post</span>
          </button>
        </div>
      </div>
    </header>
  );
}
