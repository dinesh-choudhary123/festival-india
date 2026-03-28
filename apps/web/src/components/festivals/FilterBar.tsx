"use client";

import {
  FESTIVAL_TYPES,
  FESTIVAL_SCOPES,
  FESTIVAL_CATEGORIES,
  MONTHS,
  getYearRange,
} from "@/lib/constants";
import type { FestivalFilters } from "@/lib/types";

interface FilterBarProps {
  filters: FestivalFilters;
  onFilterChange: (filters: Partial<FestivalFilters>) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const years = getYearRange();

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
      {/* Year */}
      <select
        className="filter-select"
        value={filters.year}
        onChange={(e) => onFilterChange({ year: Number(e.target.value) })}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      {/* Month */}
      <select
        className="filter-select"
        value={filters.month}
        onChange={(e) => onFilterChange({ month: Number(e.target.value) })}
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        className="filter-select"
        value={filters.category}
        onChange={(e) => onFilterChange({ category: e.target.value })}
      >
        <option value="All Categories">All Categories</option>
        {FESTIVAL_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Type */}
      <select
        className="filter-select"
        value={filters.type}
        onChange={(e) => onFilterChange({ type: e.target.value })}
      >
        <option value="All Types">All Types</option>
        {FESTIVAL_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Scope */}
      <select
        className="filter-select"
        value={filters.scope}
        onChange={(e) => onFilterChange({ scope: e.target.value })}
      >
        <option value="All Scopes">All Scopes</option>
        {FESTIVAL_SCOPES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
