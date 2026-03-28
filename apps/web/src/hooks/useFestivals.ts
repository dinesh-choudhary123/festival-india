"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { Festival, FestivalFilters } from "@/lib/types";
import { SEED_FESTIVALS } from "@/lib/seed-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

const DEFAULT_FILTERS: FestivalFilters = {
  year: new Date().getFullYear(),
  month: 0,
  category: "All Categories",
  type: "All Types",
  scope: "All Scopes",
  search: "",
};

export function useFestivals() {
  const [filters, setFilters] = useState<FestivalFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [apiFestivals, setApiFestivals] = useState<Festival[] | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;

  const updateFilters = useCallback((partial: Partial<FestivalFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  // Try to fetch from live API on mount and when year changes
  useEffect(() => {
    let cancelled = false;

    async function fetchFromAPI() {
      try {
        setLoading(true);
        const params: Record<string, string | number> = {
          year: filters.year,
          limit: 500,
          page: 1,
        };
        if (filters.month > 0) params.month = filters.month;
        if (filters.category !== "All Categories") params.category = filters.category;
        if (filters.type !== "All Types") params.type = filters.type;
        if (filters.scope !== "All Scopes") params.scope = filters.scope;
        if (filters.search) params.search = filters.search;

        const input = encodeURIComponent(JSON.stringify({ json: params }));
        const res = await fetch(`${API_URL}/trpc/festivals.list?input=${input}`, {
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const festivals = data?.result?.data?.festivals;

        if (!cancelled && festivals && festivals.length > 0) {
          setApiFestivals(festivals);
          setApiConnected(true);
        }
      } catch {
        // API not available — fall back to seed data
        if (!cancelled) {
          setApiFestivals(null);
          setApiConnected(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFromAPI();
    return () => { cancelled = true; };
  }, [filters.year, filters.month, filters.category, filters.type, filters.scope, filters.search]);

  // Use API data if available, otherwise seed data
  const allFestivals = useMemo(() => {
    if (apiConnected && apiFestivals) {
      return apiFestivals;
    }
    // Fallback: filter seed data locally
    return SEED_FESTIVALS.filter((f) => f.year === filters.year);
  }, [apiConnected, apiFestivals, filters.year]);

  const filtered = useMemo(() => {
    let result = allFestivals;

    // If API is connected, filtering is done server-side already
    if (apiConnected) return result;

    // Client-side filtering for seed data fallback
    if (filters.month > 0) {
      result = result.filter((f) => parseInt(f.date.split("-")[1], 10) === filters.month);
    }
    if (filters.category !== "All Categories") {
      result = result.filter((f) => f.category === filters.category);
    }
    if (filters.type !== "All Types") {
      result = result.filter((f) => f.type === filters.type);
    }
    if (filters.scope !== "All Scopes") {
      result = result.filter((f) => f.scope === filters.scope);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allFestivals, filters, apiConnected]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const source = apiConnected && apiFestivals ? apiFestivals : SEED_FESTIVALS;
    return source
      .filter((f) => f.date >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [apiConnected, apiFestivals]);

  return {
    festivals: paginated,
    allFilteredFestivals: filtered,
    total: filtered.length,
    page,
    totalPages,
    filters,
    updateFilters,
    setPage,
    upcoming,
    apiConnected,
    loading,
  };
}
