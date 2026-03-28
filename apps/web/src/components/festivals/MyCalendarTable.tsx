"use client";

import { useState, useMemo } from "react";
import { Info, Calendar, MoreVertical, Image, Trash2, FileText } from "lucide-react";
import { formatDate } from "@/lib/constants";
import { TypeBadge, ScopeBadge } from "./FestivalBadge";
import type { Festival, CalendarEntry } from "@/lib/types";

interface MyCalendarTableProps {
  festivals: Festival[];
  calendarData: Record<string, CalendarEntry>;
  onViewDetails: (festival: Festival) => void;
  onRemoveFromCalendar: (festivalId: string) => void;
  onUpdateEntry: (festivalId: string, updates: Partial<CalendarEntry>) => void;
  onMakePost: (festival: Festival) => void;
}

const SCOPE_TABS = ["All", "Global", "National", "Regional"] as const;

function formatBudget(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return `$${value}`;
}

export function MyCalendarTable({
  festivals,
  calendarData,
  onViewDetails,
  onRemoveFromCalendar,
  onUpdateEntry,
  onMakePost,
}: MyCalendarTableProps) {
  const [scopeFilter, setScopeFilter] = useState<string>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (scopeFilter === "All") return festivals;
    return festivals.filter((f) => f.scope === scopeFilter);
  }, [festivals, scopeFilter]);

  const scopeCounts = useMemo(() => ({
    All: festivals.length,
    Global: festivals.filter((f) => f.scope === "Global").length,
    National: festivals.filter((f) => f.scope === "National").length,
    Regional: festivals.filter((f) => f.scope === "Regional").length,
  }), [festivals]);

  const totals = useMemo(() => {
    let creative = 0;
    let media = 0;
    festivals.forEach((f) => {
      const entry = calendarData[f.id];
      if (entry) {
        creative += entry.creative_budget || 0;
        media += entry.media_budget || 0;
      }
    });
    return { creative, media };
  }, [festivals, calendarData]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((f) => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (festivals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Calendar size={48} className="mb-4 text-gray-300" />
        <p className="text-lg font-medium">Your calendar is empty</p>
        <p className="text-sm mt-1">
          Click &quot;Add to Calendar&quot; on any festival to add it here
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Scope tabs + Budget totals */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex gap-6">
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setScopeFilter(tab)}
              className={`text-sm font-medium pb-0.5 transition-colors ${
                scopeFilter === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab} ({scopeCounts[tab]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
            <span className="text-green-500">&#9786;</span>
            Total Creative: {formatBudget(totals.creative)}
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
            <span className="text-blue-500">$</span>
            Total Media: {formatBudget(totals.media)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Day
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Event Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Classification
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ownership
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Creative Budget
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Media Budget
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Benchmarking
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((festival) => {
              const entry = calendarData[festival.id];
              return (
                <tr
                  key={festival.id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(festival.id)}
                      onChange={() => toggleSelect(festival.id)}
                      className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <div className="text-sm text-gray-900 whitespace-nowrap">
                        {(() => {
                          const d = new Date(festival.date + "T00:00:00");
                          return (
                            <div className="leading-tight">
                              <span className="block font-medium">
                                {d.toLocaleDateString("en-IN", { month: "short" })}{" "}
                                {d.getDate()}
                              </span>
                              <span className="block text-xs text-gray-400">
                                {d.getFullYear()}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </td>

                  {/* Day */}
                  <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    {festival.day}
                  </td>

                  {/* Event Name with type badge + info icon */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => onViewDetails(festival)}
                      >
                        {festival.name}
                      </span>
                      <TypeBadge type={festival.type} />
                      {festival.description && (
                        <span className="relative group">
                          <span className="text-gray-400 hover:text-blue-600 transition-colors cursor-help">
                            <Info size={14} />
                          </span>
                          <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg
                                         opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                            <span className="block font-semibold mb-1">{festival.name}</span>
                            <span className="block text-gray-300 leading-relaxed">{festival.description}</span>
                            <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900" />
                          </span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Classification (Scope) */}
                  <td className="px-4 py-3.5">
                    <ScopeBadge scope={festival.scope} />
                  </td>

                  {/* Ownership dropdown */}
                  <td className="px-4 py-3.5">
                    <select
                      value={entry?.ownership || ""}
                      onChange={(e) =>
                        onUpdateEntry(festival.id, { ownership: e.target.value })
                      }
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                    >
                      <option value="">Select...</option>
                      <option value="Say hi!">Say hi!</option>
                      <option value="Content Team">Content Team</option>
                      <option value="Design Team">Design Team</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Brand Team">Brand Team</option>
                    </select>
                  </td>

                  {/* Creative Budget */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Image size={14} className="text-gray-400 shrink-0" />
                      <span className="text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        value={entry?.creative_budget || 0}
                        onChange={(e) =>
                          onUpdateEntry(festival.id, {
                            creative_budget: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                        min={0}
                      />
                    </div>
                  </td>

                  {/* Media Budget */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-sm">$</span>
                      <span className="text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        value={entry?.media_budget || 0}
                        onChange={(e) =>
                          onUpdateEntry(festival.id, {
                            media_budget: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                        min={0}
                      />
                    </div>
                  </td>

                  {/* Benchmarking */}
                  <td className="px-4 py-3.5">
                    <button className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
                      Add
                    </button>
                  </td>

                  {/* Actions (3-dot menu) */}
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === festival.id ? null : festival.id)
                        }
                        className="p-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={16} className="text-gray-500" />
                      </button>
                      {openMenuId === festival.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                            <button
                              onClick={() => {
                                onViewDetails(festival);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Info size={14} />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                onMakePost(festival);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <FileText size={14} />
                              Make Post
                            </button>
                            <button
                              onClick={() => {
                                onRemoveFromCalendar(festival.id);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
