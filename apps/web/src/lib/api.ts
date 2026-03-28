// ============================================
// API Client — works with or without tRPC
// Falls back to direct fetch if tRPC is not connected
// ============================================

import type { Festival, FestivalFilters } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface FestivalListResponse {
  festivals: Festival[];
  total: number;
  page: number;
  totalPages: number;
  year: number;
}

export async function fetchFestivals(
  filters: FestivalFilters & { page?: number; limit?: number }
): Promise<FestivalListResponse> {
  const params = new URLSearchParams();
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month) params.set("month", String(filters.month));
  if (filters.category && filters.category !== "All Categories")
    params.set("category", filters.category);
  if (filters.type && filters.type !== "All Types")
    params.set("type", filters.type);
  if (filters.scope && filters.scope !== "All Scopes")
    params.set("scope", filters.scope);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const res = await fetch(
    `${API_BASE}/trpc/festivals.list?input=${encodeURIComponent(
      JSON.stringify({ json: { ...filters } })
    )}`
  );

  if (!res.ok) throw new Error("Failed to fetch festivals");

  const data = await res.json();
  return data.result.data.json;
}

export async function fetchFestivalById(id: string): Promise<Festival | null> {
  const res = await fetch(
    `${API_BASE}/trpc/festivals.getById?input=${encodeURIComponent(
      JSON.stringify({ json: { id } })
    )}`
  );

  if (!res.ok) return null;
  const data = await res.json();
  return data.result.data.json;
}

export async function fetchUpcomingFestivals(
  limit = 10
): Promise<Festival[]> {
  const res = await fetch(
    `${API_BASE}/trpc/festivals.upcoming?input=${encodeURIComponent(
      JSON.stringify({ json: { limit } })
    )}`
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.result.data.json;
}

export async function fetchFestivalStats(year?: number) {
  const res = await fetch(
    `${API_BASE}/trpc/festivals.getStats?input=${encodeURIComponent(
      JSON.stringify({ json: { year } })
    )}`
  );

  if (!res.ok) throw new Error("Failed to fetch stats");
  const data = await res.json();
  return data.result.data.json;
}

export async function addToCalendar(
  festivalId: string,
  userId: string,
  notes?: string
) {
  const res = await fetch(`${API_BASE}/trpc/calendar.add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: { festivalId, userId, notes } }),
  });
  return res.json();
}

export async function searchFestivals(
  query: string,
  year?: number
): Promise<Festival[]> {
  const res = await fetch(
    `${API_BASE}/trpc/festivals.search?input=${encodeURIComponent(
      JSON.stringify({ json: { query, year } })
    )}`
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.result.data.json;
}
