"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/festivals/FilterBar";
import { FestivalTable } from "@/components/festivals/FestivalTable";
import { FestivalDetailModal } from "@/components/festivals/FestivalDetailModal";
import { PostCreator } from "@/components/festivals/PostCreator";
import { Pagination } from "@/components/festivals/Pagination";
import { UpcomingCountdown } from "@/components/festivals/UpcomingCountdown";
import { useFestivals } from "@/hooks/useFestivals";
import type { Festival } from "@/lib/types";

type Tab = "available" | "calendar";

export default function HomePage() {
  const {
    festivals,
    total,
    page,
    apiConnected,
    loading,
    totalPages,
    filters,
    updateFilters,
    setPage,
    upcoming,
  } = useFestivals();

  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [postFestival, setPostFestival] = useState<Festival | null>(null);
  const [calendarItems, setCalendarItems] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAddToCalendar = useCallback(
    (festival: Festival) => {
      setCalendarItems((prev) => {
        const next = new Set(prev);
        if (next.has(festival.id)) {
          next.delete(festival.id);
          showToast(`Removed "${festival.name}" from calendar`);
        } else {
          next.add(festival.id);
          showToast(`Added "${festival.name}" to calendar`);
        }
        return next;
      });
    },
    [showToast]
  );

  const calendarCount = calendarItems.size;

  return (
    <div className="flex flex-col h-full">
      <Header
        totalFestivals={total}
        searchValue={filters.search}
        onSearchChange={(search) => updateFilters({ search })}
        onCreatePost={() => {
          if (festivals.length > 0) setPostFestival(festivals[0]);
        }}
      />

      {/* Data source indicator */}
      {!loading && (
        <div className={`px-6 py-1.5 text-xs ${apiConnected ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          {apiConnected
            ? "Connected to live API — showing scraped data from Calendarific + supplementary sources"
            : "Offline mode — showing built-in seed data. Deploy the API backend for live scraping."}
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4 bg-white border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("available")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "available"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Available Days ({total})
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "calendar"
                ? "border-brand-orange text-brand-orange"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            My Calendar ({calendarCount})
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onFilterChange={updateFilters} />

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-[1600px] mx-auto flex gap-6 p-6">
          {/* Main table area */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {activeTab === "available" ? (
              <>
                <FestivalTable
                  festivals={festivals}
                  onViewDetails={setSelectedFestival}
                  onAddToCalendar={handleAddToCalendar}
                  onMakePost={setPostFestival}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <>
                {calendarCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <p className="text-lg font-medium">Your calendar is empty</p>
                    <p className="text-sm mt-1">
                      Click &quot;+ Add to Calendar&quot; on any festival to add it here
                    </p>
                  </div>
                ) : (
                  <FestivalTable
                    festivals={festivals.filter((f) => calendarItems.has(f.id))}
                    onViewDetails={setSelectedFestival}
                    onAddToCalendar={handleAddToCalendar}
                    onMakePost={setPostFestival}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar — upcoming countdown */}
          <div className="hidden xl:block w-80 shrink-0">
            <UpcomingCountdown
              festivals={upcoming}
              onFestivalClick={setSelectedFestival}
            />
            {/* Quick stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {filters.year} Overview
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{total}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total Days</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{calendarCount}</div>
                  <div className="text-xs text-gray-500 mt-0.5">In Calendar</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Festival Days</span>
                  <span className="font-medium text-gray-900">
                    {festivals.filter((f) => f.type === "Festival Day").length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Social Days</span>
                  <span className="font-medium text-gray-900">
                    {festivals.filter((f) => f.type === "Social Day").length}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Observances</span>
                  <span className="font-medium text-gray-900">
                    {festivals.filter((f) => f.type === "Observance").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedFestival && (
        <FestivalDetailModal
          festival={selectedFestival}
          onClose={() => setSelectedFestival(null)}
          onAddToCalendar={handleAddToCalendar}
          onMakePost={setPostFestival}
        />
      )}

      {postFestival && (
        <PostCreator
          festival={postFestival}
          onClose={() => setPostFestival(null)}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
