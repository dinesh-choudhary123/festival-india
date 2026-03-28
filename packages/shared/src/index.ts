// ============================================
// Festival India — Shared Types & Constants
// ============================================

// --- Festival Types ---
export type FestivalType = "Festival Day" | "Social Day" | "Observance";
export type FestivalScope = "Global" | "National" | "Regional";
export type FestivalCategory =
  | "Religious"
  | "Cultural"
  | "Environmental"
  | "Health"
  | "Social"
  | "Political"
  | "Fun";

export interface Festival {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  day: string; // Monday, Tuesday, etc.
  type: FestivalType;
  scope: FestivalScope;
  category: FestivalCategory;
  description: string;
  where_celebrated: string;
  why_celebrated: string;
  how_celebrated: string;
  image_url?: string;
  is_public_holiday: boolean;
  source: "calendarific" | "supplementary" | "manual";
  country: string;
  regions?: string[];
  year: number;
}

export interface FestivalFilters {
  year?: number;
  month?: number;
  category?: FestivalCategory | "All Categories";
  type?: FestivalType | "All Types";
  scope?: FestivalScope | "All Scopes";
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface FestivalListResponse {
  festivals: Festival[];
  total: number;
  page: number;
  totalPages: number;
  year: number;
}

export interface CalendarEntry {
  id: string;
  festivalId: string;
  userId: string;
  addedAt: string;
  notes?: string;
}

export interface SocialPost {
  id: string;
  festivalId: string;
  userId: string;
  content: string;
  platform: "instagram" | "twitter" | "facebook" | "linkedin";
  scheduledAt?: string;
  createdAt: string;
  status: "draft" | "scheduled" | "published";
}

// --- Constants ---
export const FESTIVAL_TYPES: FestivalType[] = [
  "Festival Day",
  "Social Day",
  "Observance",
];

export const FESTIVAL_SCOPES: FestivalScope[] = [
  "Global",
  "National",
  "Regional",
];

export const FESTIVAL_CATEGORIES: FestivalCategory[] = [
  "Religious",
  "Cultural",
  "Environmental",
  "Health",
  "Social",
  "Political",
  "Fun",
];

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return DAYS_OF_WEEK[date.getDay()];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getCurrentYearRange(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear + i);
}
