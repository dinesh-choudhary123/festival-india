"use client";

import { Search, Plus, Menu, CalendarDays, X, Clock, PartyPopper } from "lucide-react";
import { useState } from "react";
import { formatDate, getDaysUntil } from "@/lib/constants";
import { TypeBadge, ScopeBadge } from "@/components/festivals/FestivalBadge";
import type { Festival } from "@/lib/types";

interface HeaderProps {
  totalFestivals: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onCreatePost?: () => void;
  upcoming?: Festival[];
  onFestivalClick?: (festival: Festival) => void;
}

export function Header({
  totalFestivals,
  searchValue,
  onSearchChange,
  onCreatePost,
  upcoming = [],
  onFestivalClick,
}: HeaderProps) {
  const [showUpcoming, setShowUpcoming] = useState(false);

  function handleFestivalClick(festival: Festival) {
    setShowUpcoming(false);
    onFestivalClick?.(festival);
  }

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
          <button
            onClick={() => setShowUpcoming(true)}
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

      {/* Upcoming Events — centered modal */}
      {showUpcoming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUpcoming(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                <p className="text-sm text-gray-500">{upcoming.length} events coming up</p>
              </div>
              <button
                onClick={() => setShowUpcoming(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Event list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {upcoming.map((festival) => {
                const days = getDaysUntil(festival.date);
                const isToday = days === 0;
                return (
                  <button
                    key={festival.id}
                    onClick={() => handleFestivalClick(festival)}
                    className="w-full text-left px-6 py-4 hover:bg-orange-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-orange transition-colors">
                            {festival.name}
                          </span>
                          <TypeBadge type={festival.type} />
                          <ScopeBadge scope={festival.scope} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(festival.date)} · {festival.day}
                        </div>
                        {festival.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {festival.description}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isToday ? (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                            <PartyPopper size={11} />
                            Today!
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-orange-100 text-brand-orange text-xs px-2 py-1 rounded-full font-medium">
                            <Clock size={11} />
                            {days}d
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
              {upcoming.length === 0 && (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">
                  No upcoming events found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
