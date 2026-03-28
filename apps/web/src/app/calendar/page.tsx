"use client";

import { useState } from "react";
import { CalendarView } from "@/components/festivals/CalendarView";
import { FestivalDetailModal } from "@/components/festivals/FestivalDetailModal";
import { FilterBar } from "@/components/festivals/FilterBar";
import { useFestivals } from "@/hooks/useFestivals";
import type { Festival } from "@/lib/types";

export default function CalendarPage() {
  const { allFilteredFestivals, filters, updateFilters } = useFestivals();
  const [selectedFestival, setSelectedFestival] = useState<Festival | null>(null);

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Social Calendar</h1>
        <p className="text-sm text-gray-500">Visual calendar view of all festivals & events</p>
      </header>

      <FilterBar filters={filters} onFilterChange={updateFilters} />

      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <CalendarView
          festivals={allFilteredFestivals}
          year={filters.year}
          onFestivalClick={setSelectedFestival}
        />
      </div>

      {selectedFestival && (
        <FestivalDetailModal
          festival={selectedFestival}
          onClose={() => setSelectedFestival(null)}
          onAddToCalendar={() => {}}
          onMakePost={() => {}}
        />
      )}
    </div>
  );
}
