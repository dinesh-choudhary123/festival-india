"use client";

import { Clock, PartyPopper } from "lucide-react";
import { getDaysUntil, formatDate } from "@/lib/constants";
import { TypeBadge } from "./FestivalBadge";
import type { Festival } from "@/lib/types";

interface UpcomingCountdownProps {
  festivals: Festival[];
  onFestivalClick: (festival: Festival) => void;
}

export function UpcomingCountdown({
  festivals,
  onFestivalClick,
}: UpcomingCountdownProps) {
  if (festivals.length === 0) return null;

  const nextFestival = festivals[0];
  const daysUntil = getDaysUntil(nextFestival.date);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Upcoming Festivals
      </h3>

      {/* Next festival highlight */}
      <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-orange-600 font-medium mb-1">
              Next Up
            </div>
            <h4
              className="text-lg font-bold text-gray-900 cursor-pointer hover:text-brand-orange transition-colors"
              onClick={() => onFestivalClick(nextFestival)}
            >
              {nextFestival.name}
            </h4>
            <p className="text-sm text-gray-600 mt-0.5">
              {formatDate(nextFestival.date)} ({nextFestival.day})
            </p>
          </div>
          <div className="text-center">
            {daysUntil === 0 ? (
              <div className="flex items-center gap-1 text-orange-600">
                <PartyPopper size={20} />
                <span className="text-lg font-bold">Today!</span>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-brand-orange">
                  {daysUntil}
                </div>
                <div className="text-xs text-gray-500">
                  {daysUntil === 1 ? "day" : "days"} to go
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List of upcoming */}
      <div className="space-y-2.5">
        {festivals.slice(1, 6).map((f) => {
          const days = getDaysUntil(f.date);
          return (
            <button
              key={f.id}
              onClick={() => onFestivalClick(f)}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg
                         hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 w-16 shrink-0">
                  <Clock size={12} />
                  {days}d
                </div>
                <span className="text-sm text-gray-900 truncate">
                  {f.name}
                </span>
              </div>
              <TypeBadge type={f.type} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
