"use client";

import { Info, CalendarPlus, Pencil } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { TypeBadge, ScopeBadge } from "./FestivalBadge";
import type { Festival } from "@/lib/types";

interface FestivalTableProps {
  festivals: Festival[];
  onViewDetails: (festival: Festival) => void;
  onAddToCalendar: (festival: Festival) => void;
  onMakePost: (festival: Festival) => void;
}

export function FestivalTable({
  festivals,
  onViewDetails,
  onAddToCalendar,
  onMakePost,
}: FestivalTableProps) {
  if (festivals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <CalendarPlus size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">No festivals found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/50">
            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Day
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Festival / Event
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Scope
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {festivals.map((festival) => (
            <tr
              key={festival.id}
              className="festival-row hover:bg-orange-50/30 cursor-pointer"
              onClick={() => onViewDetails(festival)}
            >
              <td className="px-6 py-3.5 text-sm text-gray-900 whitespace-nowrap">
                {formatDate(festival.date)}
              </td>
              <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                {festival.day}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {festival.name}
                  </span>
                  {festival.description && (
                    <span className="relative group">
                      <span className="text-blue-400 hover:text-blue-600 transition-colors cursor-help">
                        <Info size={14} />
                      </span>
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                                     opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                        <span className="block font-semibold mb-1">{festival.name}</span>
                        <span className="block text-gray-300 leading-relaxed">{festival.description}</span>
                        {festival.where_celebrated && (
                          <span className="block text-gray-400 mt-1">📍 {festival.where_celebrated}</span>
                        )}
                        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
                      </span>
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5">
                <TypeBadge type={festival.type} />
              </td>
              <td className="px-4 py-3.5">
                <ScopeBadge scope={festival.scope} />
              </td>
              <td className="px-4 py-3.5 text-sm text-gray-600">
                {festival.category}
              </td>
              <td className="px-6 py-3.5">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCalendar(festival);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                               text-gray-700 bg-white border border-gray-300 rounded-lg
                               hover:bg-gray-50 transition-colors"
                  >
                    <CalendarPlus size={13} />
                    Add to Calendar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMakePost(festival);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                               text-white bg-gray-900 rounded-lg
                               hover:bg-gray-800 transition-colors"
                  >
                    <Pencil size={13} />
                    Make Post
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
