"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
  country: "All Countries",
};

export function useFestivals() {
  const [filters, setFilters] = useState<FestivalFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [apiFestivals, setApiFestivals] = useState<Festival[] | null>(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const pageSize = 50;
  const abortRef = useRef<AbortController | null>(null);

  const updateFilters = useCallback((partial: Partial<FestivalFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  // Fetch ALL festivals for the selected year from API (filter client-side for reliability)
  useEffect(() => {
    // Abort previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    async function fetchFromAPI() {
      try {
        setLoading(true);

        // Only send year + high limit — filter client-side for reliability
        const params = { year: filters.year, limit: 500, page: 1 };
        const input = encodeURIComponent(JSON.stringify(params));
        const res = await fetch(`${API_URL}/trpc/festivals.list?input=${input}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        const festivals = data?.result?.data?.festivals;

        if (!controller.signal.aborted) {
          if (Array.isArray(festivals)) {
            setApiFestivals(festivals);
            setApiConnected(true);
          } else {
            throw new Error("Invalid response");
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        // API not available — fall back to seed data
        if (!controller.signal.aborted) {
          setApiFestivals(null);
          setApiConnected(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchFromAPI();
    return () => controller.abort();
  }, [filters.year]);

  // Always filter client-side for reliability (API provides year data, we filter the rest)
  const filtered = useMemo(() => {
    const source = apiConnected && apiFestivals !== null
      ? apiFestivals
      : SEED_FESTIVALS.filter((f) => f.year === filters.year);

    let result = [...source];

    // In "All Countries" view (India-centric default), hide National-scope festivals
    // from other countries (US/UK). They appear only when their country is explicitly selected.
    if (filters.country === "All Countries") {
      result = result.filter(
        (f) => f.scope !== "National" || f.country === "IN"
      );
    }

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
    if (filters.country !== "All Countries") {
      result = result.filter((f) => f.country === filters.country);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (f) => f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [apiConnected, apiFestivals, filters]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const source = apiConnected && apiFestivals ? apiFestivals : SEED_FESTIVALS;
    return source
      .filter((f) => f.date >= today && (filters.country === "All Countries" || f.country === filters.country))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [apiConnected, apiFestivals, filters.country]);

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
