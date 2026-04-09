"use client";

import { Search, Plus, Menu, CalendarDays } from "lucide-react";
import { useState } from "react";
import { formatDate, getDaysUntil } from "@/lib/constants";
import type { Festival } from "@/lib/types";

interface HeaderProps {
  totalFestivals: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreatePost?: () => void;
  upcoming?: Festival[];
}

export function Header({
  totalFestivals,
  searchValue,
  onSearchChange,
  onCreatePost,
  upcoming = [],
}: HeaderProps) {
  const [showUpcoming, setShowUpcoming] = useState(false);

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
              Festival Calendar
            </h1>
            <p className="text-sm text-gray-500">
              India — All Festivals & Events
            </p>
          </div>
        </div>

        {/* Right side — search + upcoming + create */}
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

          {/* Upcoming Events button */}
          <div className="relative">
            <button
              onClick={() => setShowUpcoming(!showUpcoming)}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline">Upcoming</span>
              {upcoming.length > 0 && (
                <span className="bg-brand-orange text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-0.5">
                  {upcoming.length}
                </span>
              )}
            </button>
            {showUpcoming && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUpcoming(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Upcoming Events
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {upcoming.map((f) => {
                      const days = getDaysUntil(f.date);
                      return (
                        <div key={f.id} className="px-4 py-2.5 hover:bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{f.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(f.date)} ·{" "}
                            <span className={days === 0 ? "text-green-600 font-medium" : "text-brand-orange font-medium"}>
                              {days === 0 ? "Today!" : `${days} day${days === 1 ? "" : "s"} away`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {upcoming.length === 0 && (
                      <div className="px-4 py-6 text-sm text-gray-400 text-center">
                        No upcoming events
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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
