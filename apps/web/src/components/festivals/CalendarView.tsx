"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Festival } from "@/lib/types";

interface CalendarViewProps {
  festivals: Festival[];
  year: number;
  onFestivalClick: (festival: Festival) => void;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_DOT: Record<string, string> = {
  "Festival Day": "bg-orange-500",
  "Social Day": "bg-blue-500",
  "Observance": "bg-purple-500",
};

export function CalendarView({ festivals, year, onFestivalClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const festivalsByDate = useMemo(() => {
    const map: Record<string, Festival[]> = {};
    for (const f of festivals) {
      const key = f.date;
      if (!map[key]) map[key] = [];
      map[key].push(f);
    }
    return map;
  }, [festivals]);

  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, currentMonth, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === currentMonth;

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <button
          onClick={() => setCurrentMonth((m) => (m === 0 ? 11 : m - 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {MONTH_NAMES[currentMonth]} {year}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => (m === 11 ? 0 : m + 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />;
          }

          const dateStr = `${year}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayFestivals = festivalsByDate[dateStr] || [];
          const isToday = isCurrentMonth && day === today.getDate();

          return (
            <div
              key={day}
              className={`min-h-[80px] border-b border-r border-gray-50 p-1.5 ${
                isToday ? "bg-orange-50" : ""
              }`}
            >
              <div
                className={`text-xs font-medium mb-1 ${
                  isToday
                    ? "w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center"
                    : "text-gray-600"
                }`}
              >
                {day}
              </div>
              <div className="space-y-0.5">
                {dayFestivals.slice(0, 3).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onFestivalClick(f)}
                    className="w-full text-left flex items-center gap-1 group"
                    title={f.name}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[f.type] || "bg-gray-400"}`} />
                    <span className="text-[10px] text-gray-700 truncate group-hover:text-brand-orange transition-colors">
                      {f.name}
                    </span>
                  </button>
                ))}
                {dayFestivals.length > 3 && (
                  <span className="text-[10px] text-gray-400">
                    +{dayFestivals.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-3 border-t text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Festival Day
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" /> Social Day
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" /> Observance
        </div>
      </div>
    </div>
  );
}
