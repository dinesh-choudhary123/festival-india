"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { FilterBar } from "@/components/festivals/FilterBar";
import { FestivalTable } from "@/components/festivals/FestivalTable";
import { MyCalendarTable } from "@/components/festivals/MyCalendarTable";
import { FestivalDetailModal } from "@/components/festivals/FestivalDetailModal";
import { PostCreator } from "@/components/festivals/PostCreator";
import { Pagination } from "@/components/festivals/Pagination";
import { useFestivals } from "@/hooks/useFestivals";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { Festival, CalendarEntry } from "@/lib/types";

type Tab = "available" | "calendar";

const STORAGE_KEY = "festival-india-calendar";
const CURRENCY_KEY = "festival-india-currency";

function loadCalendarData(): Record<string, CalendarEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCalendarData(data: Record<string, CalendarEntry>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable
  }
}

export default function HomePage() {
  const {
    festivals,
    allFilteredFestivals,
    total,
    page,
    apiConnected,
    loading,
    totalPages,
    filters,
    updateFilters,
    setPage,
  } = useFestivals();

  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);
  const [postFestival, setPostFestival] = useState<Festival | null>(null);
  const [calendarData, setCalendarData] = useState<Record<string, CalendarEntry>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  // Load calendar data + currency from localStorage on mount
  useEffect(() => {
    setCalendarData(loadCalendarData());
    const savedCurrency = typeof window !== "undefined" ? localStorage.getItem(CURRENCY_KEY) : null;
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  const handleCurrencyChange = useCallback((code: string) => {
    setCurrency(code);
    try { localStorage.setItem(CURRENCY_KEY, code); } catch {}
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleAddToCalendar = useCallback(
    (festival: Festival) => {
      setCalendarData((prev) => {
        const next = { ...prev };
        if (next[festival.id]) {
          delete next[festival.id];
          showToast(`Removed "${festival.name}" from calendar`);
        } else {
          next[festival.id] = {
            id: festival.id,
            festival_id: festival.id,
            name: festival.name,
            date: festival.date,
            day: festival.day,
            type: festival.type,
            scope: festival.scope,
            category: festival.category,
            description: festival.description,
            notes: null,
            added_at: new Date().toISOString(),
            ownership: "",
            creative_budget: 500,
            media_budget: 1000,
            benchmarks: [],
          };
          showToast(`Added "${festival.name}" to calendar`);
        }
        saveCalendarData(next);
        return next;
      });
    },
    [showToast]
  );

  const handleRemoveFromCalendar = useCallback(
    (festivalId: string) => {
      setCalendarData((prev) => {
        const next = { ...prev };
        const name = next[festivalId]?.name || "Festival";
        delete next[festivalId];
        saveCalendarData(next);
        showToast(`Removed "${name}" from calendar`);
        return next;
      });
    },
    [showToast]
  );

  const handleUpdateEntry = useCallback(
    (festivalId: string, updates: Partial<CalendarEntry>) => {
      setCalendarData((prev) => {
        const next = { ...prev };
        if (next[festivalId]) {
          next[festivalId] = { ...next[festivalId], ...updates };
          saveCalendarData(next);
        }
        return next;
      });
    },
    []
  );

  const calendarCount = Object.keys(calendarData).length;

  // Get festival objects for calendar entries
  const calendarFestivals = useMemo(() => {
    return allFilteredFestivals.filter((f) => calendarData[f.id]);
  }, [allFilteredFestivals, calendarData]);

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

      {/* Filters — only show on Available Days tab */}
      {activeTab === "available" && (
        <FilterBar filters={filters} onFilterChange={updateFilters} />
      )}

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
              <MyCalendarTable
                festivals={calendarFestivals}
                calendarData={calendarData}
                onViewDetails={setSelectedFestival}
                onRemoveFromCalendar={handleRemoveFromCalendar}
                onUpdateEntry={handleUpdateEntry}
                onMakePost={setPostFestival}
                currency={currency}
                onCurrencyChange={handleCurrencyChange}
              />
            )}
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
